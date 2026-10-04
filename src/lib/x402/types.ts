import type { ProcurementDecision } from "@/lib/x402/decision";

export type ProcureResponse = {
  decision: ProcurementDecision;
  live: boolean;
  payment:
    | {
        status: "settled";
        transaction: string;
        explorerUrl: string;
        network: string;
        resource: unknown;
      }
    | {
        status: "blocked";
        message: string;
      }
    | {
        status: "ask";
        message: string;
      }
    | {
        status: "failed";
        message: string;
        detail?: string;
      }
    | null;
};
