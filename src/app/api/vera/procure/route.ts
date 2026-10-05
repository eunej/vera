import { NextResponse } from "next/server";
import { runVeraProcurement } from "@/lib/x402/procure";
import type { ProcureResponse } from "@/lib/x402/types";
import type { ProcureTraceEvent } from "@/lib/x402/trace";
import type { PurchaseIntent } from "@/lib/x402/decision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ScenarioId = "smart" | "suspicious" | "expensive" | "ask";

type ProcureBody = {
  scenario?: ScenarioId;
  confirmAsk?: boolean;
  stream?: boolean;
  missionId?: string;
  mission?: string;
  purpose?: string;
  requestedProvider?: string;
  requestedPrice?: number;
  remainingBudgetUsd?: number;
};

function buildIntent(body: ProcureBody): PurchaseIntent {
  const scenario: ScenarioId = body.scenario ?? "smart";
  const base = {
    missionId: body.missionId ?? "mission-depin-1",
    mission: body.mission ?? "Research the top Solana DePIN projects",
    remainingBudgetUsd: body.remainingBudgetUsd ?? 4.84,
    scenario,
  };

  switch (scenario) {
    case "suspicious":
      return {
        ...base,
        purpose: body.purpose ?? "Premium gaming data subscription",
        requestedProvider: body.requestedProvider ?? "Premium Gaming API",
        requestedPrice: body.requestedPrice ?? 3.2,
      };
    case "expensive":
      return {
        ...base,
        purpose: body.purpose ?? "Historical SOL market data",
        requestedProvider: body.requestedProvider ?? "PremiumData",
        requestedPrice: body.requestedPrice ?? 0.4,
      };
    case "ask":
      return {
        ...base,
        purpose: body.purpose ?? "Historical SOL market data",
        requestedProvider: body.requestedProvider ?? "MarketData Pro",
        requestedPrice: body.requestedPrice ?? 0.08,
      };
    case "smart":
    default:
      return {
        ...base,
        purpose: body.purpose ?? "Historical SOL market data",
        requestedProvider: body.requestedProvider ?? "MarketData Pro",
        requestedPrice: body.requestedPrice ?? 0.08,
      };
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ProcureBody;
  const intent = buildIntent(body);
  const wantsStream =
    body.stream === true ||
    (req.headers.get("accept") ?? "").includes("application/x-ndjson");

  if (!wantsStream) {
    const result: ProcureResponse = await runVeraProcurement({
      intent,
      confirmAsk: body.confirmAsk,
    });

    if (
      result.payment?.status === "failed" &&
      result.payment.message.includes("Unexpected policy")
    ) {
      return NextResponse.json(result, { status: 400 });
    }
    if (result.payment?.status === "failed") {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ProcureTraceEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        await runVeraProcurement(
          { intent, confirmAsk: body.confirmAsk },
          { onEvent: send }
        );
      } catch (err) {
        send({
          type: "failed",
          message: err instanceof Error ? err.message : "Procurement failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
