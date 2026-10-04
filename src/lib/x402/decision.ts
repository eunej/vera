/**
 * Vera procurement decision — MUST run before any x402 payment signing.
 * The x402 client is never invoked unless policyDecision === "APPROVE"
 * (or "ASK" after explicit human confirmation).
 */

import {
  DEMO_MISSION_REQUIREMENTS,
  recommendProvider,
} from "@/lib/procurement";
import type { Provider } from "@/lib/types";

export type PolicyDecision = "APPROVE" | "ASK" | "BLOCK";

export type ProcurementDecision = {
  missionId: string;
  resource: string;
  provider: string;
  requestedPrice: number;
  recommendedPrice: number;
  savings: number;
  intentScore: number;
  riskScore: number;
  policyDecision: PolicyDecision;
  reason: string;
  recommendedProvider: string;
  requestedProvider: string;
};

export type PurchaseIntent = {
  missionId: string;
  mission: string;
  purpose: string;
  requestedProvider: string;
  requestedPrice: number;
  remainingBudgetUsd: number;
};

const LIVE_PROVIDERS: Provider[] = [
  {
    id: "lite",
    name: "MarketData Lite",
    priceUsd: 0.02,
    quality: 88,
    reliability: 95,
    relevance: 98,
    risk: 95,
  },
  {
    id: "pro",
    name: "MarketData Pro",
    priceUsd: 0.08,
    quality: 96,
    reliability: 99,
    relevance: 99,
    risk: 96,
    requested: true,
  },
];

const SUSPICIOUS_PROVIDER: Provider = {
  id: "gaming",
  name: "Premium Gaming API",
  priceUsd: 3.2,
  quality: 91,
  reliability: 88,
  relevance: 12,
  risk: 55,
  requested: true,
};

export function makeProcurementDecision(
  intent: PurchaseIntent
): ProcurementDecision {
  const isSuspicious =
    intent.requestedProvider.toLowerCase().includes("gaming") ||
    intent.purpose.toLowerCase().includes("gaming");

  if (isSuspicious) {
    return {
      missionId: intent.missionId,
      resource: intent.purpose,
      provider: intent.requestedProvider,
      requestedPrice: intent.requestedPrice,
      recommendedPrice: 0.02,
      savings: intent.requestedPrice - 0.02,
      intentScore: 12,
      riskScore: 55,
      policyDecision: "BLOCK",
      reason:
        "This purchase does not appear necessary to complete the current mission. BLOCKED BEFORE PAYMENT — no x402 settlement initiated.",
      recommendedProvider: "MarketData Lite",
      requestedProvider: intent.requestedProvider,
    };
  }

  const providers = LIVE_PROVIDERS.map((p) => ({
    ...p,
    requested:
      p.name.toLowerCase() === intent.requestedProvider.toLowerCase(),
  }));

  const rec = recommendProvider(
    providers,
    {
      ...DEMO_MISSION_REQUIREMENTS,
      maxPriceUsd: intent.remainingBudgetUsd,
    },
    intent.requestedProvider
  );

  const recommended = rec.recommended.provider;
  const savings = Math.max(
    0,
    Math.round((intent.requestedPrice - recommended.priceUsd) * 100) / 100
  );

  return {
    missionId: intent.missionId,
    resource: intent.purpose,
    provider: recommended.name,
    requestedPrice: intent.requestedPrice,
    recommendedPrice: recommended.priceUsd,
    savings,
    intentScore: Math.round(rec.recommended.components.relevance),
    riskScore: Math.round(rec.recommended.components.riskScore),
    policyDecision: "APPROVE",
    reason: rec.explanation,
    recommendedProvider: recommended.name,
    requestedProvider: intent.requestedProvider,
  };
}

/** Map approved provider name → local paid API path. */
export function providerResourcePath(providerName: string): string {
  if (providerName.includes("Pro")) return "/api/provider/sol-price-pro";
  if (providerName.includes("Lite")) return "/api/provider/sol-price";
  throw new Error(`No paid endpoint registered for provider: ${providerName}`);
}

export { LIVE_PROVIDERS, SUSPICIOUS_PROVIDER };
