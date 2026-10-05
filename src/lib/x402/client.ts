/**
 * Server-side x402 V2 payment client (Solana Devnet).
 *
 * Private keys NEVER leave the server. Browser code must not import this module.
 */

import "server-only";

import { base58 } from "@scure/base";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import {
  decodePaymentResponseHeader,
  wrapFetchWithPayment,
  x402Client,
} from "@x402/fetch";
import { ExactSvmScheme } from "@x402/svm/exact/client";
import {
  DEFAULT_FACILITATOR_URL,
  DEVNET_USDC_MINT,
  SOLANA_DEVNET,
  explorerTxUrl,
  usdcToBaseUnits,
} from "@/lib/x402/constants";
import type { TraceEmitter } from "@/lib/x402/trace";

export type LivePaymentResult = {
  ok: true;
  resource: unknown;
  transaction: string;
  explorerUrl: string;
  network: typeof SOLANA_DEVNET;
  payer?: string;
  amount?: string;
};

export type LivePaymentFailure = {
  ok: false;
  error: string;
  status?: number;
  detail?: string;
};

export type ExecutePaymentOptions = {
  /** Emit real protocol steps (402 challenge, signing, settlement). */
  onTrace?: TraceEmitter;
};

let cachedFetch: typeof fetch | null = null;

async function getPaidFetch(): Promise<typeof fetch> {
  if (cachedFetch) return cachedFetch;

  const secret = process.env.SOLANA_PRIVATE_KEY;
  if (!secret) {
    throw new Error(
      "SOLANA_PRIVATE_KEY is not set. Generate a Devnet keypair and fund it with SOL + USDC."
    );
  }

  const bytes = base58.decode(secret.trim());
  if (bytes.length !== 64) {
    throw new Error(
      `SOLANA_PRIVATE_KEY must be a 64-byte base58 secret key (got ${bytes.length} bytes).`
    );
  }

  const signer = await createKeyPairSignerFromBytes(bytes);
  const maxUsdc = usdcToBaseUnits(
    Number(process.env.VERA_MAX_PAYMENT_USD ?? "0.10")
  );

  const client = new x402Client();

  client.registerPolicy((_version, requirements) =>
    requirements.filter(
      ({ network, asset, amount }) =>
        network === SOLANA_DEVNET &&
        asset === DEVNET_USDC_MINT &&
        BigInt(amount) <= maxUsdc
    )
  );

  client.register(SOLANA_DEVNET, new ExactSvmScheme(signer));
  client.register("solana:*", new ExactSvmScheme(signer));

  cachedFetch = wrapFetchWithPayment(fetch, client);
  return cachedFetch;
}

function decodePaymentRequired(header: string): {
  amountUsd?: number;
  network?: string;
  error?: string;
} {
  try {
    const decoded = JSON.parse(
      Buffer.from(header, "base64").toString("utf8")
    ) as {
      error?: string;
      accepts?: Array<{ amount?: string; network?: string }>;
    };
    const accept = decoded.accepts?.[0];
    const amountUsd =
      accept?.amount != null ? Number(accept.amount) / 1e6 : undefined;
    return {
      amountUsd: Number.isFinite(amountUsd) ? amountUsd : undefined,
      network: accept?.network,
      error: decoded.error,
    };
  } catch {
    return {};
  }
}

/**
 * Execute a paid GET against a resource that returns 402 + PAYMENT-REQUIRED.
 * Only call AFTER Vera policyDecision === "APPROVE".
 */
export async function executeX402Payment(
  resourceUrl: string,
  options: ExecutePaymentOptions = {}
): Promise<LivePaymentResult | LivePaymentFailure> {
  const onTrace = options.onTrace;

  try {
    // Real unpaid probe — surfaces the actual 402 / PAYMENT-REQUIRED challenge.
    const probe = await fetch(resourceUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const requiredHeader =
      probe.headers.get("PAYMENT-REQUIRED") ??
      probe.headers.get("payment-required");

    let challengeAmountUsd: number | undefined;
    if (probe.status === 402 && requiredHeader) {
      const challenge = decodePaymentRequired(requiredHeader);
      challengeAmountUsd = challenge.amountUsd;
      onTrace?.({
        type: "x402",
        detail: "Payment requirement received",
        amountUsd: challenge.amountUsd,
        network: challenge.network,
      });
    } else if (probe.status === 402) {
      onTrace?.({
        type: "x402",
        detail: "Payment requirement received",
      });
    } else {
      return {
        ok: false,
        error: `Expected HTTP 402 Payment Required from provider, got ${probe.status}`,
        status: probe.status,
        detail: (await probe.text().catch(() => "")).slice(0, 500),
      };
    }

    onTrace?.({ type: "solana", detail: "Signing payment..." });

    if (challengeAmountUsd != null) {
      onTrace?.({
        type: "settlement",
        amountUsd: challengeAmountUsd,
        asset: "USDC",
      });
    }

    const paidFetch = await getPaidFetch();
    const response = await paidFetch(resourceUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const retryHeader =
        response.headers.get("PAYMENT-REQUIRED") ??
        response.headers.get("payment-required");
      let facilitatorDetail = body.slice(0, 500);
      if (retryHeader) {
        const decoded = decodePaymentRequired(retryHeader);
        if (decoded.error) {
          facilitatorDetail = `${decoded.error}${body ? ` — ${body.slice(0, 200)}` : ""}`;
        }
      }

      const hint =
        facilitatorDetail.includes("simulation_failed") ||
        facilitatorDetail.includes("InvalidAccountData")
          ? " Fund the agent wallet with Devnet USDC (Circle faucet, mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU) and a little Devnet SOL, then retry."
          : "";

      return {
        ok: false,
        error: `x402 settlement failed (HTTP ${response.status}).${hint}`,
        status: response.status,
        detail: facilitatorDetail,
      };
    }

    const paymentHeader =
      response.headers.get("PAYMENT-RESPONSE") ??
      response.headers.get("payment-response");

    if (!paymentHeader) {
      return {
        ok: false,
        error:
          "Resource returned 200 but missing PAYMENT-RESPONSE header — cannot confirm Solana settlement.",
        status: response.status,
      };
    }

    const settlement = decodePaymentResponseHeader(paymentHeader);
    if (!settlement.success || !settlement.transaction) {
      return {
        ok: false,
        error:
          settlement.errorMessage ||
          settlement.errorReason ||
          "Settlement reported unsuccessful",
        detail: JSON.stringify(settlement).slice(0, 500),
      };
    }

    // Only after facilitator PAYMENT-RESPONSE reports success + tx signature.
    onTrace?.({
      type: "confirmed",
      network: "Solana Devnet",
      transaction: settlement.transaction,
      explorerUrl: explorerTxUrl(settlement.transaction),
    });

    const resource = await response.json();

    onTrace?.({
      type: "resource",
      detail: "Historical data received",
    });

    return {
      ok: true,
      resource,
      transaction: settlement.transaction,
      explorerUrl: explorerTxUrl(settlement.transaction),
      network: SOLANA_DEVNET,
      payer: settlement.payer,
      amount: settlement.amount,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "x402 payment failed",
    };
  }
}

export function getFacilitatorUrl(): string {
  return process.env.FACILITATOR_URL ?? DEFAULT_FACILITATOR_URL;
}
