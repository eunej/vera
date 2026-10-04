/**
 * Active settlement adapter for Vera.
 *
 * DEMO: MockSolanaSettlementAdapter
 * LATER: swap for a real x402 / Solana USDC SettlementAdapter implementation.
 */

import { MockSolanaSettlementAdapter } from "@/lib/settlement/mock-solana";
import type { SettlementAdapter } from "@/lib/settlement/types";

let adapter: SettlementAdapter | null = null;

export function getSettlementAdapter(): SettlementAdapter {
  if (!adapter) {
    adapter = new MockSolanaSettlementAdapter();
  }
  return adapter;
}

/** Test helper — inject an alternate adapter without changing call sites. */
export function setSettlementAdapter(next: SettlementAdapter) {
  adapter = next;
}

export type {
  PaymentReceipt,
  SettlementAdapter,
  SettlementRequest,
  SettlementResult,
  SettlementStatus,
} from "@/lib/settlement/types";
