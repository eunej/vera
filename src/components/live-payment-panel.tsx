"use client";

/**
 * Live payment surface for the primary Vera demo.
 * Trace steps are driven only by real backend NDJSON events.
 * "Settled" / CONFIRMED appears only after a real transaction signature.
 */

import { Check, ExternalLink, Loader2, Radio } from "lucide-react";
import { SolanaMark } from "@/components/solana-mark";
import type { ProcureTraceEvent } from "@/lib/x402/trace";
import { cn } from "@/lib/utils";

export type LivePaymentUiStatus =
  | "idle"
  | "decided"
  | "settling"
  | "settled"
  | "blocked"
  | "failed";

export type LivePaymentPanelProps = {
  status: LivePaymentUiStatus;
  decisionLabel: "Approved" | "Blocked" | "Ask" | "—";
  provider: string;
  priceUsd: number;
  transaction?: string | null;
  explorerUrl?: string | null;
  resourceReceived?: boolean;
  errorMessage?: string | null;
  blockedBeforePayment?: boolean;
  /** Real events from `/api/vera/procure` NDJSON stream. */
  trace?: ProcureTraceEvent[];
};

type TraceStepId =
  | "intent"
  | "need"
  | "procurement"
  | "recommendation"
  | "policy"
  | "x402"
  | "solana"
  | "settlement"
  | "confirmed"
  | "resource";

type TraceStepView = {
  id: TraceStepId;
  index: string;
  title: string;
  body: string;
  active: boolean;
  done: boolean;
  failed?: boolean;
};

function shortenTx(sig: string): string {
  if (sig.length <= 20) return sig;
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`;
}

function buildSteps(
  trace: ProcureTraceEvent[],
  status: LivePaymentUiStatus
): TraceStepView[] {
  const byType = new Map<string, ProcureTraceEvent>();
  for (const e of trace) byType.set(e.type, e);

  const intent = byType.get("intent") as
    | Extract<ProcureTraceEvent, { type: "intent" }>
    | undefined;
  const need = byType.get("need") as
    | Extract<ProcureTraceEvent, { type: "need" }>
    | undefined;
  const procurement = byType.get("procurement") as
    | Extract<ProcureTraceEvent, { type: "procurement" }>
    | undefined;
  const recommendation = byType.get("recommendation") as
    | Extract<ProcureTraceEvent, { type: "recommendation" }>
    | undefined;
  const policy = byType.get("policy") as
    | Extract<ProcureTraceEvent, { type: "policy" }>
    | undefined;
  const x402 = byType.get("x402") as
    | Extract<ProcureTraceEvent, { type: "x402" }>
    | undefined;
  const solana = byType.get("solana") as
    | Extract<ProcureTraceEvent, { type: "solana" }>
    | undefined;
  const settlement = byType.get("settlement") as
    | Extract<ProcureTraceEvent, { type: "settlement" }>
    | undefined;
  const confirmed = byType.get("confirmed") as
    | Extract<ProcureTraceEvent, { type: "confirmed" }>
    | undefined;
  const resource = byType.get("resource") as
    | Extract<ProcureTraceEvent, { type: "resource" }>
    | undefined;

  const blocked = status === "blocked" || byType.has("blocked");
  const failed = status === "failed" || byType.has("failed");
  const lastType = trace.length ? trace[trace.length - 1]?.type : undefined;

  const defs: Array<{
    id: TraceStepId;
    index: string;
    title: string;
    body: string;
    present: boolean;
    skip?: boolean;
  }> = [
    {
      id: "intent",
      index: "①",
      title: "INTENT",
      body: intent?.mission ?? "—",
      present: !!intent,
    },
    {
      id: "need",
      index: "②",
      title: "NEED",
      body: need?.resource ?? "—",
      present: !!need,
    },
    {
      id: "procurement",
      index: "③",
      title: "PROCUREMENT",
      body: procurement
        ? `${procurement.providersEvaluated} provider${procurement.providersEvaluated === 1 ? "" : "s"} evaluated`
        : "—",
      present: !!procurement,
    },
    {
      id: "recommendation",
      index: "④",
      title: "RECOMMENDATION",
      body: recommendation
        ? `${recommendation.provider}\n$${recommendation.priceUsd.toFixed(2)}\n${recommendation.savingsPct}% cheaper than requested provider`
        : "—",
      present: !!recommendation,
      skip: blocked && !recommendation,
    },
    {
      id: "policy",
      index: "⑤",
      title: "POLICY",
      body: policy
        ? policy.decision === "APPROVE"
          ? "APPROVED"
          : policy.decision
        : "—",
      present: !!policy,
    },
    {
      id: "x402",
      index: "⑥",
      title: "X402",
      body: x402?.detail ?? "—",
      present: !!x402,
      skip: blocked,
    },
    {
      id: "solana",
      index: "⑦",
      title: "SOLANA",
      body: solana?.detail ?? "—",
      present: !!solana,
      skip: blocked,
    },
    {
      id: "settlement",
      index: "⑧",
      title: "SETTLEMENT",
      body: settlement
        ? `$${settlement.amountUsd.toFixed(2)} ${settlement.asset}`
        : "—",
      present: !!settlement,
      skip: blocked,
    },
    {
      id: "confirmed",
      index: "⑨",
      title: "CONFIRMED",
      body: confirmed?.network ?? "—",
      present: !!confirmed,
      skip: blocked,
    },
    {
      id: "resource",
      index: "⑩",
      title: "RESOURCE",
      body: resource?.detail ?? "—",
      present: !!resource,
      skip: blocked,
    },
  ];

  return defs
    .filter((d) => !d.skip)
    .map((d) => {
      const done = d.present;
      const active =
        !done &&
        !failed &&
        status === "settling" &&
        (lastType === undefined
          ? d.id === "intent"
          : /* next incomplete after last event */ false);
      return {
        id: d.id,
        index: d.index,
        title: d.title,
        body: d.body,
        active: active || (status === "settling" && done && d.id === mapLastActive(lastType)),
        done,
        failed: failed && d.id === "policy" && !confirmed,
      };
    });
}

function mapLastActive(
  lastType: ProcureTraceEvent["type"] | undefined
): TraceStepId | null {
  switch (lastType) {
    case "intent":
      return "need";
    case "need":
      return "procurement";
    case "procurement":
      return "recommendation";
    case "recommendation":
      return "policy";
    case "policy":
      return "x402";
    case "x402":
      return "solana";
    case "solana":
      return "settlement";
    case "settlement":
      return "confirmed";
    case "confirmed":
      return "resource";
    default:
      return null;
  }
}

export function LivePaymentPanel({
  status,
  decisionLabel,
  provider,
  priceUsd,
  transaction,
  explorerUrl,
  resourceReceived,
  errorMessage,
  blockedBeforePayment,
  trace = [],
}: LivePaymentPanelProps) {
  const steps = buildSteps(trace, status);
  const confirmed = trace.find((e) => e.type === "confirmed") as
    | Extract<ProcureTraceEvent, { type: "confirmed" }>
    | undefined;
  const displayTx = confirmed?.transaction ?? transaction;
  const displayExplorer = confirmed?.explorerUrl ?? explorerUrl;
  // Never show settled UI without a real signature from the backend.
  const showConfirmed = status === "settled" && !!displayTx;

  return (
    <section
      className={cn(
        "panel reveal lg:col-span-5",
        showConfirmed && "settle-flash",
        status === "blocked" && "border-destructive/45",
        status === "failed" && "border-destructive/45"
      )}
    >
      <div className="border-b border-[hsl(var(--line))] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="label flex items-center gap-1.5">
              <Radio className="size-3 text-primary" />
              Live payment
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
              ${priceUsd.toFixed(2)}{" "}
              <span className="text-base text-muted-foreground">USDC</span>
            </p>
          </div>
          <SolanaMark />
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          x402 V2 · Solana Devnet · real-time trace
        </p>
      </div>

      <div className="space-y-3 px-5 py-5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">Vera decision</span>
          <span className="font-medium">{decisionLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">Procurement</span>
          <span className="font-medium">{provider}</span>
        </div>

        <ol className="space-y-2 rounded-md border border-[hsl(var(--line))] bg-secondary/20 px-3 py-3">
          {steps.map((step) => (
            <li
              key={step.id}
              className={cn(
                "grid grid-cols-[1.25rem_1fr] gap-x-2 gap-y-0.5 text-sm",
                !step.done && !step.active && "opacity-35",
                step.active && !step.done && "opacity-100"
              )}
            >
              <span className="font-mono text-[11px] text-muted-foreground">
                {step.index}
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="label !normal-case tracking-[0.14em]">
                    {step.title}
                  </span>
                  {step.done && (
                    <Check
                      className="size-3 text-primary"
                      strokeWidth={2.5}
                    />
                  )}
                  {step.active && !step.done && status === "settling" && (
                    <Loader2 className="size-3 animate-spin text-primary" />
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-line text-[13px] font-medium leading-snug">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
          {trace.length === 0 && status === "settling" && (
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              Waiting for Vera stream…
            </li>
          )}
        </ol>

        {blockedBeforePayment && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-3">
            <p className="font-mono text-xs font-semibold tracking-[0.14em] text-destructive">
              BLOCKED BEFORE PAYMENT
            </p>
            <p className="mt-1.5 text-sm text-destructive/90">
              No Solana transaction was created. This is Vera policy — not an
              error.
            </p>
          </div>
        )}

        {showConfirmed && displayTx && (
          <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-3">
            <p className="label">Transaction</p>
            <p className="mt-1.5 font-mono text-[12px] leading-relaxed">
              {shortenTx(displayTx)}
            </p>
            {displayExplorer && (
              <a
                href={displayExplorer}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                VIEW ON SOLANA EXPLORER
                <ExternalLink className="size-3" />
              </a>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary">
              <Check className="size-3.5" strokeWidth={2.5} />
              {resourceReceived || status === "settled"
                ? "Resource received ✓"
                : "Resource pending"}
            </p>
          </div>
        )}

        {status === "failed" && errorMessage && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-3">
            <p className="label text-destructive">Settlement error</p>
            <p className="mt-1.5 text-sm text-destructive/90">{errorMessage}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Vera will not show a fake Settled state. Fix wallet funding /
              facilitator / provider, then retry.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
