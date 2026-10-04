import {
  DEMO_MISSION_REQUIREMENTS,
  recommendProvider,
  withRecommendationFlags,
} from "@/lib/procurement";
import type { Provider, Scenario } from "@/lib/types";

const SHARED_MISSION = {
  title: "Research the top Solana DePIN projects",
  shortTitle: "Solana DePIN Research",
  budgetUsd: 5.0,
  spentUsd: 0.16,
  remainingUsd: 4.84,
};

const SMART_PROVIDERS: Provider[] = [
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
  {
    id: "premium",
    name: "PremiumData",
    priceUsd: 0.4,
    quality: 98,
    reliability: 99,
    relevance: 99,
    risk: 95,
  },
];

/** Deterministic recommendation for the Smart Purchase demo. */
export const SMART_RECOMMENDATION = recommendProvider(
  SMART_PROVIDERS,
  {
    ...DEMO_MISSION_REQUIREMENTS,
    maxPriceUsd: SHARED_MISSION.remainingUsd,
  },
  "MarketData Pro"
);

const SMART_PROVIDERS_TAGGED = withRecommendationFlags(
  SMART_PROVIDERS,
  SMART_RECOMMENDATION
);

const SUSPICIOUS_PROVIDERS: Provider[] = [
  {
    id: "gaming",
    name: "Premium Gaming API",
    priceUsd: 3.2,
    quality: 91,
    reliability: 88,
    relevance: 12,
    risk: 55,
    requested: true,
  },
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
  },
];

const SUSPICIOUS_MISSION_OPTIONS = recommendProvider(
  SUSPICIOUS_PROVIDERS.filter((p) => p.id !== "gaming"),
  {
    ...DEMO_MISSION_REQUIREMENTS,
    maxPriceUsd: SHARED_MISSION.remainingUsd,
  }
);

export const SCENARIOS: Record<"smart" | "suspicious", Scenario> = {
  smart: {
    id: "smart",
    label: "Smart Purchase",
    blurb:
      "Relevant need. Vera scores providers, then picks the cheapest that meets requirements.",
    mission: SHARED_MISSION,
    request: {
      purpose: "Historical SOL market data",
      provider: "MarketData Pro",
      priceUsd: 0.08,
      agentName: "research-agent-01",
    },
    providers: SMART_PROVIDERS_TAGGED,
    decision: {
      verdict: "APPROVED",
      metrics: {
        intentMatch: Math.round(
          SMART_RECOMMENDATION.recommended.components.relevance
        ),
        priceEfficiency: Math.round(
          SMART_RECOMMENDATION.recommended.components.priceEfficiency
        ),
        budgetImpact: "Low",
        providerRisk: "Low",
      },
      reason: SMART_RECOMMENDATION.explanation,
      recommendation: `${SMART_RECOMMENDATION.recommended.provider.name} — cheapest eligible provider.`,
      savingsUsd: SMART_RECOMMENDATION.savingsUsd,
      selectedProvider: SMART_RECOMMENDATION.recommended.provider.name,
      selectedAmountUsd: SMART_RECOMMENDATION.recommended.provider.priceUsd,
    },
    factors: [
      "Mission need: historical market data.",
      `Minimum quality gate: ${DEMO_MISSION_REQUIREMENTS.minQuality} (Lite scores 88).`,
      SMART_RECOMMENDATION.explanation,
      "Purchase is within mission budget.",
      "Selector: cheapest eligible provider (deterministic).",
    ],
    payment: {
      asset: "USDC",
      amountUsd: SMART_RECOMMENDATION.recommended.provider.priceUsd,
      destination: SMART_RECOMMENDATION.recommended.provider.name,
      network: "Solana",
      status: "SETTLED",
      txHash: "mock-filled-at-runtime",
      settledAt: "2026-10-04T09:11:42.000Z",
    },
    budgetOnlySays: "$0.08 is within remaining budget → allowed",
    veraSays:
      "Need matches mission — recommend cheapest provider that meets requirements",
  },
  suspicious: {
    id: "suspicious",
    label: "Suspicious Purchase",
    blurb: "Within budget, but not required for the mission — Vera blocks.",
    mission: SHARED_MISSION,
    request: {
      purpose: "Premium gaming data subscription",
      provider: "Premium Gaming API",
      priceUsd: 3.2,
      agentName: "research-agent-01",
    },
    providers: SUSPICIOUS_PROVIDERS.map((p) => ({
      ...p,
      recommended: p.id === SUSPICIOUS_MISSION_OPTIONS.recommended.provider.id,
    })),
    decision: {
      verdict: "BLOCKED",
      metrics: {
        intentMatch: 12,
        priceEfficiency: 18,
        budgetImpact: "High",
        providerFamiliarity: "Low",
      },
      reason:
        "This purchase does not appear necessary to complete the current mission.",
      recommendation: `Alternative required spend for this mission: approximately $${SUSPICIOUS_MISSION_OPTIONS.recommended.provider.priceUsd.toFixed(2)}`,
      selectedProvider: "Premium Gaming API",
      selectedAmountUsd: 3.2,
      alternativeSpendUsd:
        SUSPICIOUS_MISSION_OPTIONS.recommended.provider.priceUsd,
      budgetConsumptionNote:
        "$3.20 would consume 66% of the remaining mission budget.",
    },
    factors: [
      "Mission is Solana DePIN research — not gaming.",
      "Purchase purpose is not required by the mission.",
      "Provider relevance 12 fails minimum relevance gate.",
      "Amount is within budget; mission relevance fails.",
      `Required mission spend is about $${SUSPICIOUS_MISSION_OPTIONS.recommended.provider.priceUsd.toFixed(2)}, not $3.20.`,
    ],
    payment: {
      asset: "USDC",
      amountUsd: 3.2,
      destination: "Premium Gaming API",
      network: "Solana",
      status: "BLOCKED",
      txHash: "—",
      settledAt: "2026-10-04T09:14:08.000Z",
    },
    budgetOnlySays: "$3.20 < $5.00 → allowed",
    veraSays:
      "$3.20 is within budget, but unrelated to the mission → BLOCKED",
  },
};

/** Conceptual flow shown in the console pipeline. */
export const FLOW_STAGES = [
  "Mission",
  "Compare",
  "Recommend",
  "Decide",
  "Settle",
  "Receipt",
] as const;

export const AGENT_STATUS = {
  label: "Agent online",
  detail: "research-agent-01 · idle",
} as const;
