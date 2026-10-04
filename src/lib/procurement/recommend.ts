/**
 * Deterministic recommendation:
 * 1) Score every provider (inspectable).
 * 2) Keep only providers that meet mission requirements.
 * 3) Among eligible providers, pick the cheapest.
 *
 * Never: "highest score wins" or "cheapest overall wins" without gates.
 * Never: LLM as the financial decision-maker.
 */

import { scoreProviders } from "@/lib/procurement/score";
import type {
  MissionRequirements,
  RecommendationResult,
  ScoredProvider,
} from "@/lib/procurement/types";
import type { Provider } from "@/lib/types";

export const DEMO_MISSION_REQUIREMENTS: MissionRequirements = {
  minQuality: 85,
  minReliability: 90,
  minRelevance: 90,
  minRisk: 90,
  maxPriceUsd: 4.84,
};

function shortName(name: string): string {
  if (name.includes("Lite")) return "Lite";
  if (name.includes("Pro")) return "Pro";
  if (name.includes("Premium")) return "Premium";
  return name;
}

function buildExplanation(
  recommended: ScoredProvider,
  comparison: ScoredProvider | null
): { explanation: string; savingsUsd: number; savingsPct: number } {
  if (!comparison || comparison.provider.id === recommended.provider.id) {
    return {
      explanation: `${recommended.provider.name} meets mission requirements at $${recommended.provider.priceUsd.toFixed(2)}.`,
      savingsUsd: 0,
      savingsPct: 0,
    };
  }

  const savingsUsd =
    Math.round(
      (comparison.provider.priceUsd - recommended.provider.priceUsd) * 100
    ) / 100;
  const savingsPct = Math.round(
    (savingsUsd / comparison.provider.priceUsd) * 100
  );

  const explanation = `${shortName(recommended.provider.name)} meets the mission's minimum quality requirement while costing ${savingsPct}% less than ${shortName(comparison.provider.name)}.`;

  return { explanation, savingsUsd, savingsPct };
}

export function recommendProvider(
  providers: Provider[],
  requirements: MissionRequirements = DEMO_MISSION_REQUIREMENTS,
  requestedProviderName?: string
): RecommendationResult {
  const scored = scoreProviders(providers, requirements);

  const rankedByScore = [...scored].sort(
    (a, b) => b.procurementScore - a.procurementScore
  );

  const eligibleByPrice = scored
    .filter((s) => s.meetsRequirements)
    .sort((a, b) => {
      if (a.provider.priceUsd !== b.provider.priceUsd) {
        return a.provider.priceUsd - b.provider.priceUsd;
      }
      // Tie-break: higher procurement score, then name for stability.
      if (b.procurementScore !== a.procurementScore) {
        return b.procurementScore - a.procurementScore;
      }
      return a.provider.name.localeCompare(b.provider.name);
    });

  if (eligibleByPrice.length === 0) {
    throw new Error(
      "No provider meets mission requirements — cannot recommend a purchase."
    );
  }

  const recommended = eligibleByPrice[0];

  const requested =
    scored.find(
      (s) =>
        s.provider.requested ||
        (requestedProviderName &&
          s.provider.name.toLowerCase() === requestedProviderName.toLowerCase())
    ) ?? null;

  // Prefer comparing against the agent's requested provider when eligible/present.
  const comparisonProvider =
    requested && requested.provider.id !== recommended.provider.id
      ? requested
      : eligibleByPrice.find((s) => s.provider.id !== recommended.provider.id) ??
        null;

  const { explanation, savingsUsd, savingsPct } = buildExplanation(
    recommended,
    comparisonProvider
  );

  return {
    requirements,
    rankedByScore,
    eligibleByPrice,
    recommended,
    requested,
    comparisonProvider,
    savingsUsd,
    savingsPct,
    explanation,
    method: "deterministic-requirements-then-cheapest",
  };
}

/** Tag providers with recommended flag from a recommendation result. */
export function withRecommendationFlags(
  providers: Provider[],
  result: RecommendationResult
): Provider[] {
  return providers.map((p) => ({
    ...p,
    recommended: p.id === result.recommended.provider.id,
  }));
}
