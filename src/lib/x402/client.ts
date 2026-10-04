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

  // Hard spend controls at the x402 layer (defense in depth after Vera policy).
  client.registerPolicy((_version, requirements) =>
    requirements.filter(
      ({ network, asset, amount }) =>
        network === SOLANA_DEVNET &&
        asset === DEVNET_USDC_MINT &&
        BigInt(amount) <= maxUsdc
    )
  );

  client.register(SOLANA_DEVNET, new ExactSvmScheme(signer));
  // Also register wildcard for library matching.
  client.register("solana:*", new ExactSvmScheme(signer));

  cachedFetch = wrapFetchWithPayment(fetch, client);
  return cachedFetch;
}

/**
 * Execute a paid GET against a resource that returns 402 + PAYMENT-REQUIRED.
 * Only call AFTER Vera policyDecision === "APPROVE".
 */
export async function executeX402Payment(
  resourceUrl: string
): Promise<LivePaymentResult | LivePaymentFailure> {
  try {
    const paidFetch = await getPaidFetch();
    const response = await paidFetch(resourceUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      // On a failed paid retry, x402 re-issues PAYMENT-REQUIRED with the
      // facilitator invalidReason (e.g. simulation failed / missing USDC ATA).
      const requiredHeader =
        response.headers.get("PAYMENT-REQUIRED") ??
        response.headers.get("payment-required");
      let facilitatorDetail = body.slice(0, 500);
      if (requiredHeader) {
        try {
          const decoded = JSON.parse(
            Buffer.from(requiredHeader, "base64").toString("utf8")
          ) as { error?: string; accepts?: unknown };
          facilitatorDetail = decoded.error
            ? `${decoded.error}${body ? ` — ${body.slice(0, 200)}` : ""}`
            : facilitatorDetail;
        } catch {
          /* keep body */
        }
      }

      // Common Devnet setup failure — make it actionable.
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

    const resource = await response.json();

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
