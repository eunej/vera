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

const EXPENSIVE_RECOMMENDATION = recommendProvider(
  SMART_PROVIDERS,
  {
    ...DEMO_MISSION_REQUIREMENTS,
    maxPriceUsd: SHARED_MISSION.remainingUsd,
  },
  "PremiumData"
);

const ASK_RECOMMENDATION = SMART_RECOMMENDATION;

export const SCENARIOS: Record<
  "smart" | "suspicious" | "expensive" | "ask",
  Scenario
> = {
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
  expensive: {
    id: "expensive",
    label: "Expensive Provider",
    blurb:
      "Agent requests PremiumData at a high price — Vera recommends the cheaper eligible option.",
    mission: SHARED_MISSION,
    request: {
      purpose: "Historical SOL market data",
      provider: "PremiumData",
      priceUsd: 0.4,
      agentName: "research-agent-01",
    },
    providers: withRecommendationFlags(
      SMART_PROVIDERS.map((p) => ({
        ...p,
        requested: p.id === "premium",
      })),
      EXPENSIVE_RECOMMENDATION
    ),
    decision: {
      verdict: "APPROVED",
      metrics: {
        intentMatch: Math.round(
          EXPENSIVE_RECOMMENDATION.recommended.components.relevance
        ),
        priceEfficiency: Math.round(
          EXPENSIVE_RECOMMENDATION.recommended.components.priceEfficiency
        ),
        budgetImpact: "Low",
        providerRisk: "Low",
      },
      reason: EXPENSIVE_RECOMMENDATION.explanation,
      recommendation: `${EXPENSIVE_RECOMMENDATION.recommended.provider.name} — cheapest eligible vs PremiumData.`,
      savingsUsd: EXPENSIVE_RECOMMENDATION.savingsUsd,
      selectedProvider: EXPENSIVE_RECOMMENDATION.recommended.provider.name,
      selectedAmountUsd:
        EXPENSIVE_RECOMMENDATION.recommended.provider.priceUsd,
    },
    factors: [
      "Mission need: historical market data.",
      "Requested PremiumData at $0.40 — significantly above alternatives.",
      EXPENSIVE_RECOMMENDATION.explanation,
      "Purchase is within mission budget.",
      "Selector: cheapest eligible provider (deterministic).",
    ],
    payment: {
      asset: "USDC",
      amountUsd: EXPENSIVE_RECOMMENDATION.recommended.provider.priceUsd,
      destination: EXPENSIVE_RECOMMENDATION.recommended.provider.name,
      network: "Solana",
      status: "SETTLED",
      txHash: "mock-filled-at-runtime",
      settledAt: "2026-10-04T09:11:42.000Z",
    },
    budgetOnlySays: "$0.40 is within remaining budget → allowed",
    veraSays:
      "PremiumData works, but Lite meets requirements at 95% lower cost → recommend Lite",
  },
  ask: {
    id: "ask",
    label: "Human Approval",
    blurb:
      "Legitimate mission purchase — Vera selects Lite, then requires explicit human approval before x402.",
    mission: SHARED_MISSION,
    request: {
      purpose: "Historical SOL market data",
      provider: "MarketData Pro",
      priceUsd: 0.08,
      agentName: "research-agent-01",
    },
    providers: SMART_PROVIDERS_TAGGED,
    decision: {
      verdict: "ASK",
      metrics: {
        intentMatch: Math.round(
          ASK_RECOMMENDATION.recommended.components.relevance
        ),
        priceEfficiency: Math.round(
          ASK_RECOMMENDATION.recommended.components.priceEfficiency
        ),
        budgetImpact: "Low",
        providerRisk: "Low",
      },
      reason:
        "Purchase matches the mission and a cheaper provider was selected, but policy requires explicit human approval before any x402 payment.",
      recommendation: `${ASK_RECOMMENDATION.recommended.provider.name} at $${ASK_RECOMMENDATION.recommended.provider.priceUsd.toFixed(2)} — awaiting human approval.`,
      savingsUsd: ASK_RECOMMENDATION.savingsUsd,
      selectedProvider: ASK_RECOMMENDATION.recommended.provider.name,
      selectedAmountUsd: ASK_RECOMMENDATION.recommended.provider.priceUsd,
    },
    factors: [
      "Mission need: historical market data.",
      "Cheapest eligible provider selected (Lite).",
      "Spend is within budget.",
      "Policy class: human confirmation required.",
      "No x402 payment until Approve.",
    ],
    payment: {
      asset: "USDC",
      amountUsd: ASK_RECOMMENDATION.recommended.provider.priceUsd,
      destination: ASK_RECOMMENDATION.recommended.provider.name,
      network: "Solana",
      status: "PENDING",
      txHash: "—",
      settledAt: "—",
    },
    budgetOnlySays: "$0.08 is within remaining budget → allowed",
    veraSays: "Mission fit OK → ASK human before payment",
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
