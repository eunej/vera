export type DecisionVerdict =
  | "APPROVED"
  | "ASK"
  | "BLOCKED"
  | "OVERRIDE_APPROVED";

export type ScenarioId = "smart" | "suspicious";

export type Provider = {
  id: string;
  name: string;
  priceUsd: number;
  /** 0–100 */
  quality: number;
  /** 0–100 */
  reliability: number;
  /** 0–100 mission fit */
  relevance: number;
  /** 0–100 where higher = safer / lower risk */
  risk: number;
  requested?: boolean;
  recommended?: boolean;
};

export type Mission = {
  title: string;
  /** Short label for payment receipts. */
  shortTitle: string;
  budgetUsd: number;
  spentUsd: number;
  remainingUsd: number;
};

export type ProcurementRequest = {
  purpose: string;
  provider: string;
  priceUsd: number;
  agentName: string;
};

export type DecisionMetrics = {
  intentMatch: number;
  priceEfficiency: number;
  budgetImpact: "Low" | "Medium" | "High";
  providerRisk?: "Low" | "Medium" | "High";
  providerFamiliarity?: "Low" | "Medium" | "High";
};

export type VeraDecision = {
  verdict: DecisionVerdict;
  metrics: DecisionMetrics;
  reason: string;
  recommendation: string;
  savingsUsd?: number;
  selectedProvider: string;
  selectedAmountUsd: number;
  alternativeSpendUsd?: number;
  budgetConsumptionNote?: string;
};

export type SimulatedPayment = {
  asset: "USDC";
  amountUsd: number;
  destination: string;
  network: "Solana";
  status: "SETTLED" | "PENDING" | "FAILED" | "BLOCKED";
  txHash: string;
  settledAt: string;
};

export type AuditReceipt = {
  mission: string;
  purchase: string;
  provider: string;
  amountUsd: number;
  decision: DecisionVerdict;
  reason: string;
  timestamp: string;
  transactionId: string;
};

export type Scenario = {
  id: ScenarioId;
  label: string;
  blurb: string;
  mission: Mission;
  request: ProcurementRequest;
  providers: Provider[];
  decision: VeraDecision;
  factors: string[];
  payment: SimulatedPayment;
  budgetOnlySays: string;
  veraSays: string;
};
