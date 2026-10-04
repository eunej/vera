/**
 * Settlement adapter contract.
 *
 * Current demo uses MockSolanaSettlementAdapter (no custody, no signing).
 * A production x402 / Solana SPL USDC adapter can implement this same interface.
 */

export type SettlementNetwork = "solana";

export type SettlementAsset = "USDC";

export type SettlementStatus =
  | "idle"
  | "settling"
  | "settled"
  | "failed"
  | "blocked";

export type SettlementRequest = {
  /** Stable id for deterministic mock signatures in demos. */
  requestId: string;
  amountUsd: number;
  asset: SettlementAsset;
  provider: string;
  mission: string;
  need: string;
  decisionLabel: string;
  network: SettlementNetwork;
};

export type PaymentReceipt = {
  title: "Payment receipt";
  amountUsd: number;
  asset: SettlementAsset;
  provider: string;
  network: SettlementNetwork;
  networkLabel: "Solana";
  decision: string;
  mission: string;
  signature: string;
  settledAt: string;
  /** Always true for the current demo adapter. */
  mocked: true;
};

export type SettlementResult = {
  status: "settled";
  signature: string;
  explorerUrl: string;
  receipt: PaymentReceipt;
  /** Demo flag — real adapters should set mocked: false. */
  mocked: true;
  adapter: string;
};

export interface SettlementAdapter {
  readonly id: string;
  readonly network: SettlementNetwork;
  readonly mocked: boolean;
  settle(request: SettlementRequest): Promise<SettlementResult>;
}
