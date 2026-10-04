/**
 * Deterministic procurement scoring.
 *
 * This is NOT an LLM decision. Scores are inspectable inputs for ranking and
 * UI; the recommendation selector is: cheapest provider that meets mission
 * requirements (see `recommend.ts`).
 */

import type { Provider } from "@/lib/types";
import type {
  MissionRequirements,
  ScoreComponents,
  ScoredProvider,
} from "@/lib/procurement/types";

export const SCORE_WEIGHTS = {
  relevance: 0.3,
  quality: 0.2,
  reliability: 0.15,
  priceEfficiency: 0.25,
  riskScore: 0.1,
} as const;

/** Clamp a metric already expressed on a 0–100 scale. */
export function normalizeMetric(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/**
 * Price efficiency: cheaper relative to the catalog max → higher score.
 * Uses max price in the compared set so values stay normalized 0–100.
 */
export function priceEfficiencyScore(
  priceUsd: number,
  maxPriceUsd: number
): number {
  if (maxPriceUsd <= 0) return 100;
  if (priceUsd <= 0) return 100;
  const ratio = Math.min(1, priceUsd / maxPriceUsd);
  return normalizeMetric((1 - ratio) * 100);
}

export function procurementScore(components: ScoreComponents): number {
  const score =
    components.relevance * SCORE_WEIGHTS.relevance +
    components.quality * SCORE_WEIGHTS.quality +
    components.reliability * SCORE_WEIGHTS.reliability +
    components.priceEfficiency * SCORE_WEIGHTS.priceEfficiency +
    components.riskScore * SCORE_WEIGHTS.riskScore;

  return Math.round(score * 100) / 100;
}

export function evaluateRequirements(
  provider: Provider,
  requirements: MissionRequirements
): { ok: boolean; failReasons: string[] } {
  const failReasons: string[] = [];

  if (provider.quality < requirements.minQuality) {
    failReasons.push(
      `Quality ${provider.quality} < minimum ${requirements.minQuality}`
    );
  }
  if (provider.reliability < requirements.minReliability) {
    failReasons.push(
      `Reliability ${provider.reliability} < minimum ${requirements.minReliability}`
    );
  }
  if (provider.relevance < requirements.minRelevance) {
    failReasons.push(
      `Relevance ${provider.relevance} < minimum ${requirements.minRelevance}`
    );
  }
  if (provider.risk < requirements.minRisk) {
    failReasons.push(
      `Risk ${provider.risk} < minimum ${requirements.minRisk}`
    );
  }
  if (provider.priceUsd > requirements.maxPriceUsd) {
    failReasons.push(
      `Price $${provider.priceUsd.toFixed(2)} exceeds mission budget room $${requirements.maxPriceUsd.toFixed(2)}`
    );
  }

  return { ok: failReasons.length === 0, failReasons };
}

export function scoreProviders(
  providers: Provider[],
  requirements: MissionRequirements
): ScoredProvider[] {
  const maxPrice = Math.max(...providers.map((p) => p.priceUsd), 0.01);

  return providers.map((provider) => {
    const components: ScoreComponents = {
      relevance: normalizeMetric(provider.relevance),
      quality: normalizeMetric(provider.quality),
      reliability: normalizeMetric(provider.reliability),
      priceEfficiency: priceEfficiencyScore(provider.priceUsd, maxPrice),
      riskScore: normalizeMetric(provider.risk),
    };

    const { ok, failReasons } = evaluateRequirements(provider, requirements);

    return {
      provider,
      components,
      procurementScore: procurementScore(components),
      meetsRequirements: ok,
      failReasons,
    };
  });
}
