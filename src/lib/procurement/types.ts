import type { Provider } from "@/lib/types";

/** Mission gates a provider must clear before price competition. */
export type MissionRequirements = {
  minQuality: number;
  minReliability: number;
  minRelevance: number;
  /** Higher = safer. */
  minRisk: number;
  maxPriceUsd: number;
};

export type ScoreComponents = {
  relevance: number;
  quality: number;
  reliability: number;
  priceEfficiency: number;
  riskScore: number;
};

export type ScoredProvider = {
  provider: Provider;
  components: ScoreComponents;
  /** Weighted 0–100 procurement score (inspectable, not the sole selector). */
  procurementScore: number;
  meetsRequirements: boolean;
  failReasons: string[];
};

export type RecommendationResult = {
  requirements: MissionRequirements;
  rankedByScore: ScoredProvider[];
  eligibleByPrice: ScoredProvider[];
  /** Cheapest provider that meets mission requirements. */
  recommended: ScoredProvider;
  requested: ScoredProvider | null;
  comparisonProvider: ScoredProvider | null;
  savingsUsd: number;
  savingsPct: number;
  explanation: string;
  /** Explicit note: selection is rule-based, not LLM. */
  method: "deterministic-requirements-then-cheapest";
};
