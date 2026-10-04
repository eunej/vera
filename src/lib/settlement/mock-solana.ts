/**
 * MOCK / DEMO Solana USDC settlement.
 *
 * Does NOT:
 * - hold custody
 * - request wallet signatures
 * - broadcast transactions
 * - touch mainnet or devnet RPCs
 *
 * Replace this adapter with a real x402 / SPL USDC implementation later
 * by swapping the export in `src/lib/settlement/index.ts`.
 */

import type {
  PaymentReceipt,
  SettlementAdapter,
  SettlementRequest,
  SettlementResult,
} from "@/lib/settlement/types";

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Deterministic FNV-1a style hash → u32. */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Produce a base58-looking signature that is stable for the same request.
 * Looks like a Solana tx sig; is not a real signature.
 */
export function mockSolanaSignature(seed: string, length = 88): string {
  let state = hash32(`vera:mock-solana:${seed}`);
  let out = "";
  for (let i = 0; i < length; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    out += BASE58[state % 58];
  }
  return out;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class MockSolanaSettlementAdapter implements SettlementAdapter {
  readonly id = "mock-solana-usdc";
  readonly network = "solana" as const;
  readonly mocked = true as const;

  async settle(request: SettlementRequest): Promise<SettlementResult> {
    // Simulated confirmation latency for the demo UI.
    await delay(1400);

    const signature = mockSolanaSignature(
      [
        request.requestId,
        request.provider,
        request.amountUsd.toFixed(2),
        request.mission,
        request.decisionLabel,
      ].join("|")
    );

    const settledAt = new Date().toISOString();

    const receipt: PaymentReceipt = {
      title: "Payment receipt",
      amountUsd: request.amountUsd,
      asset: request.asset,
      provider: request.provider,
      network: "solana",
      networkLabel: "Solana",
      decision: request.decisionLabel,
      mission: request.mission,
      signature,
      settledAt,
      mocked: true,
    };

    return {
      status: "settled",
      signature,
      // Demo explorer link — signature is mocked and will not resolve on-chain.
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      receipt,
      mocked: true,
      adapter: this.id,
    };
  }
}
