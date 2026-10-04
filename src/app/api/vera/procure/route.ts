import { NextResponse } from "next/server";
import {
  makeProcurementDecision,
  providerResourcePath,
} from "@/lib/x402/decision";
import { SOLANA_DEVNET } from "@/lib/x402/constants";
import type { ProcureResponse } from "@/lib/x402/types";
// x402 client is dynamically imported ONLY after APPROVE — policy cannot be bypassed
// by loading payment code on BLOCK/ASK paths.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProcureBody = {
  scenario?: "smart" | "suspicious";
  confirmAsk?: boolean;
  missionId?: string;
  mission?: string;
  purpose?: string;
  requestedProvider?: string;
  requestedPrice?: number;
  remainingBudgetUsd?: number;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ProcureBody;
  const scenario = body.scenario ?? "smart";

  const intent =
    scenario === "suspicious"
      ? {
          missionId: body.missionId ?? "mission-depin-1",
          mission:
            body.mission ?? "Research the top Solana DePIN projects",
          purpose: body.purpose ?? "Premium gaming data subscription",
          requestedProvider: body.requestedProvider ?? "Premium Gaming API",
          requestedPrice: body.requestedPrice ?? 3.2,
          remainingBudgetUsd: body.remainingBudgetUsd ?? 4.84,
        }
      : {
          missionId: body.missionId ?? "mission-depin-1",
          mission:
            body.mission ?? "Research the top Solana DePIN projects",
          purpose: body.purpose ?? "Historical SOL market data",
          requestedProvider: body.requestedProvider ?? "MarketData Pro",
          requestedPrice: body.requestedPrice ?? 0.08,
          remainingBudgetUsd: body.remainingBudgetUsd ?? 4.84,
        };

  // 1) Vera policy decision BEFORE any payment signing.
  const decision = makeProcurementDecision(intent);

  if (decision.policyDecision === "BLOCK") {
    const response: ProcureResponse = {
      decision,
      live: true,
      payment: {
        status: "blocked",
        message:
          "BLOCKED BEFORE PAYMENT — no Solana transaction was created.",
      },
    };
    return NextResponse.json(response);
  }

  if (decision.policyDecision === "ASK" && !body.confirmAsk) {
    const response: ProcureResponse = {
      decision,
      live: true,
      payment: {
        status: "ask",
        message: "Human confirmation required before x402 payment.",
      },
    };
    return NextResponse.json(response);
  }

  if (decision.policyDecision !== "APPROVE" && !body.confirmAsk) {
    return NextResponse.json(
      {
        decision,
        live: true,
        payment: {
          status: "failed",
          message: "Unexpected policy state — payment refused.",
        },
      } satisfies ProcureResponse,
      { status: 400 }
    );
  }

  // 2) Only after APPROVE (or confirmed ASK): load + execute real x402 payment.
  const providerBase =
    process.env.PROVIDER_BASE_URL ?? "http://127.0.0.1:4021";
  const path = providerResourcePath(decision.recommendedProvider);
  const resourceUrl = `${providerBase.replace(/\/$/, "")}${path}`;

  const { executeX402Payment } = await import("@/lib/x402/client");
  const paid = await executeX402Payment(resourceUrl);

  if (!paid.ok) {
    const response: ProcureResponse = {
      decision,
      live: true,
      payment: {
        status: "failed",
        message: paid.error,
        detail: paid.detail,
      },
    };
    return NextResponse.json(response, { status: 502 });
  }

  const response: ProcureResponse = {
    decision,
    live: true,
    payment: {
      status: "settled",
      transaction: paid.transaction,
      explorerUrl: paid.explorerUrl,
      network: SOLANA_DEVNET,
      resource: paid.resource,
    },
  };

  return NextResponse.json(response);
}
