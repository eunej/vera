/**
 * Real backend events for the live payment trace.
 * Only emit when the corresponding operation actually happens.
 */

export type ProcureTraceEvent =
  | { type: "intent"; mission: string }
  | { type: "need"; resource: string }
  | {
      type: "procurement";
      providersEvaluated: number;
    }
  | {
      type: "recommendation";
      provider: string;
      priceUsd: number;
      savingsPct: number;
      requestedProvider: string;
      requestedPrice: number;
    }
  | {
      type: "policy";
      decision: "APPROVE" | "ASK" | "BLOCK";
      reason?: string;
    }
  | {
      type: "x402";
      detail: string;
      amountUsd?: number;
      network?: string;
    }
  | { type: "solana"; detail: string }
  | {
      type: "settlement";
      amountUsd: number;
      asset: "USDC";
    }
  | {
      type: "confirmed";
      network: string;
      transaction: string;
      explorerUrl: string;
    }
  | { type: "resource"; detail: string }
  | {
      type: "blocked";
      message: string;
    }
  | {
      type: "failed";
      message: string;
      detail?: string;
    }
  | {
      type: "done";
      /** Final procure payload (same shape as non-stream JSON response). */
      result: unknown;
    };

export type TraceEmitter = (event: ProcureTraceEvent) => void;
