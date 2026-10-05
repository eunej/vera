/**
 * LEGACY mock settlement module — NOT used by the primary Vera demo.
 *
 * Primary (REAL) payment path:
 *   src/lib/x402/decision.ts → src/app/api/vera/procure → src/lib/x402/client.ts
 *   → x402 facilitator → Solana Devnet → provider resource
 *
 * UI for live settlement: src/components/live-payment-panel.tsx
 * (only shows "Settled" when payment.status === "settled" from x402)
 *
 * Keep this folder for reference / possible offline demos. Do not wire it
 * back into vera-demo without an explicit non-live label.
 */

import { MockSolanaSettlementAdapter } from "@/lib/settlement/mock-solana";
import type { SettlementAdapter } from "@/lib/settlement/types";

let legacyAdapter: SettlementAdapter | null = null;

/** @deprecated Unused by primary demo. Prefer src/lib/x402/client.ts */
export function getLegacyMockSettlementAdapter(): SettlementAdapter {
  if (!legacyAdapter) {
    legacyAdapter = new MockSolanaSettlementAdapter();
  }
  return legacyAdapter;
}

export type {
  PaymentReceipt,
  SettlementAdapter,
  SettlementRequest,
  SettlementResult,
  SettlementStatus,
} from "@/lib/settlement/types";
