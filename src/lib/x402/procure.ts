/**
 * Vera procurement orchestration — the only path from HTTP request to x402.
 *
 * Call graph (enforced):
 *   REQUEST → makeProcurementDecision → POLICY
 *     BLOCK / unanswered ASK → return (x402 never loaded/called)
 *     APPROVE (or ASK + confirmAsk) → optional max-payment gate → executeX402Payment
 */

import {
  LIVE_PROVIDERS,
  makeProcurementDecision,
  providerResourcePath,
  type ProcurementDecision,
  type PurchaseIntent,
} from "@/lib/x402/decision";
import { SOLANA_DEVNET } from "@/lib/x402/constants";
import type { ProcureResponse } from "@/lib/x402/types";
import type { LivePaymentFailure, LivePaymentResult } from "@/lib/x402/client";
import type { TraceEmitter } from "@/lib/x402/trace";

export type ProcureInput = {
  intent: PurchaseIntent;
  confirmAsk?: boolean;
  maxPaymentUsd?: number;
};

export type ProcureDeps = {
  decide?: (intent: PurchaseIntent) => ProcurementDecision;
  pay?: (
    resourceUrl: string,
    opts?: { onTrace?: TraceEmitter }
  ) => Promise<LivePaymentResult | LivePaymentFailure>;
  providerBaseUrl?: string;
  onEvent?: TraceEmitter;
};

function resolveMaxPaymentUsd(explicit?: number): number {
  if (typeof explicit === "number" && Number.isFinite(explicit)) return explicit;
  const fromEnv = Number(process.env.VERA_MAX_PAYMENT_USD ?? "0.10");
  return Number.isFinite(fromEnv) ? fromEnv : 0.10;
}

/** Prefer same-origin Next provider routes (works on Vercel). */
export function resolveProviderBaseUrl(): string {
  if (process.env.PROVIDER_BASE_URL?.trim()) {
    return process.env.PROVIDER_BASE_URL.trim().replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, "");
  }
  // Local Next.js embeds /api/provider/* — no separate :4021 required.
  return "http://127.0.0.1:3000";
}

function emitIntentNeed(intent: PurchaseIntent, onEvent?: TraceEmitter) {
  onEvent?.({ type: "intent", mission: intent.mission });
  onEvent?.({ type: "need", resource: intent.purpose });
}

/**
 * Run Vera decision, then pay only if policy allows.
 * Optional `onEvent` streams real steps for the LivePaymentPanel trace.
 */
export async function runVeraProcurement(
  input: ProcureInput,
  deps: ProcureDeps = {}
): Promise<ProcureResponse> {
  const onEvent = deps.onEvent;
  const decide = deps.decide ?? makeProcurementDecision;

  emitIntentNeed(input.intent, onEvent);

  const decision = decide(input.intent);

  const isSuspicious =
    input.intent.scenario === "suspicious" ||
    input.intent.requestedProvider.toLowerCase().includes("gaming") ||
    input.intent.purpose.toLowerCase().includes("gaming");

  onEvent?.({
    type: "procurement",
    providersEvaluated: isSuspicious ? 1 : LIVE_PROVIDERS.length,
  });

  // Emit recommendation for APPROVE/ASK (not for off-mission BLOCK).
  if (!(isSuspicious && decision.policyDecision === "BLOCK")) {
    const savingsPct =
      decision.requestedPrice > 0
        ? Math.round(
            ((decision.requestedPrice - decision.recommendedPrice) /
              decision.requestedPrice) *
              100
          )
        : 0;
    onEvent?.({
      type: "recommendation",
      provider: decision.recommendedProvider,
      priceUsd: decision.recommendedPrice,
      savingsPct,
      requestedProvider: decision.requestedProvider,
      requestedPrice: decision.requestedPrice,
    });
  }

  onEvent?.({
    type: "policy",
    decision: decision.policyDecision,
    reason: decision.reason,
  });

  if (decision.policyDecision === "BLOCK") {
    const message =
      "BLOCKED BEFORE PAYMENT — no Solana transaction was created.";
    const response: ProcureResponse = {
      decision,
      live: true,
      payment: { status: "blocked", message },
    };
    onEvent?.({ type: "blocked", message });
    onEvent?.({ type: "done", result: response });
    return response;
  }

  if (decision.policyDecision === "ASK" && !input.confirmAsk) {
    const response: ProcureResponse = {
      decision,
      live: true,
      payment: {
        status: "ask",
        message: "Human confirmation required before x402 payment.",
      },
    };
    onEvent?.({ type: "done", result: response });
    return response;
  }

  if (decision.policyDecision !== "APPROVE" && !input.confirmAsk) {
    const message = "Unexpected policy state — payment refused.";
    const response: ProcureResponse = {
      decision,
      live: true,
      payment: { status: "failed", message },
    };
    onEvent?.({ type: "failed", message });
    onEvent?.({ type: "done", result: response });
    return response;
  }

  const maxPaymentUsd = resolveMaxPaymentUsd(input.maxPaymentUsd);
  if (decision.recommendedPrice > maxPaymentUsd) {
    const blockedDecision: ProcurementDecision = {
      ...decision,
      policyDecision: "BLOCK",
      reason: `Approved amount $${decision.recommendedPrice.toFixed(2)} exceeds configured policy maximum $${maxPaymentUsd.toFixed(2)}. BLOCKED BEFORE PAYMENT.`,
    };
    const message =
      "BLOCKED BEFORE PAYMENT — amount exceeds policy maximum; no Solana transaction was created.";
    const response: ProcureResponse = {
      decision: blockedDecision,
      live: true,
      payment: { status: "blocked", message },
    };
    onEvent?.({
      type: "policy",
      decision: "BLOCK",
      reason: blockedDecision.reason,
    });
    onEvent?.({ type: "blocked", message });
    onEvent?.({ type: "done", result: response });
    return response;
  }

  const providerBase =
    deps.providerBaseUrl ?? resolveProviderBaseUrl();
  const path = providerResourcePath(decision.recommendedProvider);
  const resourceUrl = `${providerBase.replace(/\/$/, "")}${path}`;

  const pay =
    deps.pay ??
    (async (url: string, opts?: { onTrace?: TraceEmitter }) => {
      const { executeX402Payment } = await import("@/lib/x402/client");
      return executeX402Payment(url, { onTrace: opts?.onTrace });
    });

  const paid = await pay(resourceUrl, { onTrace: onEvent });

  if (!paid.ok) {
    const response: ProcureResponse = {
      decision,
      live: true,
      payment: {
        status: "failed",
        message: paid.error,
        detail: paid.detail,
      },
    };
    onEvent?.({
      type: "failed",
      message: paid.error,
      detail: paid.detail,
    });
    onEvent?.({ type: "done", result: response });
    return response;
  }

  const response: ProcureResponse = {
    decision,
    live: true,
    payment: {
      status: "settled",
      transaction: paid.transaction,
      explorerUrl: paid.explorerUrl,
      network: SOLANA_DEVNET,
      resource: paid.resource,
    },
  };
  onEvent?.({ type: "done", result: response });
  return response;
}
