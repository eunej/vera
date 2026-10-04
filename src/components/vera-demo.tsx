"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Loader2,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  UserRoundCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LivePaymentPanel,
  type LivePaymentUiStatus,
} from "@/components/live-payment-panel";
import { WhyVera } from "@/components/why-vera";
import { FLOW_STAGES, SCENARIOS, SMART_RECOMMENDATION } from "@/lib/mock-data";
import {
  DEMO_MISSION_REQUIREMENTS,
  recommendProvider,
  SCORE_WEIGHTS,
} from "@/lib/procurement";
import type { ProcureResponse } from "@/lib/x402/types";
import type { DecisionVerdict, ScenarioId } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type Outcome = "none" | "blocked" | "overridden" | "approved";

const STEP_STATUS: Record<Exclude<Step, 0>, string> = {
  1: "Mission & purchase request…",
  2: "Comparing providers…",
  3: "Building recommendation…",
  4: "Policy decision…",
  5: "Solana settlement…",
  6: "Writing receipt…",
};

const SMART_TIMING = {
  2: 1500,
  3: 3000,
  4: 4600,
  /** Hold the decision on screen before settlement. */
  5: 7200,
} as const;

const SUSPICIOUS_TIMING = {
  2: 1400,
  3: 2800,
  4: 4400,
  awaitAction: 6000,
} as const;

export function VeraDemo() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("smart");
  const [step, setStep] = useState<Step>(0);
  const [factorCount, setFactorCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [awaitingAction, setAwaitingAction] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>("none");
  const [liveStatus, setLiveStatus] = useState<LivePaymentUiStatus>("idle");
  const [liveTx, setLiveTx] = useState<string | null>(null);
  const [liveExplorer, setLiveExplorer] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [resourceReceived, setResourceReceived] = useState(false);
  const timers = useRef<number[]>([]);
  const settleGen = useRef(0);
  const decisionRef = useRef<HTMLDivElement>(null);

  const scenario = SCENARIOS[scenarioId];
  const isSuspicious = scenarioId === "suspicious";
  const settled = liveStatus === "settled";

  const recommendation = useMemo(() => {
    if (scenarioId === "smart") return SMART_RECOMMENDATION;
    // Suspicious: score catalog for inspectability; gaming fails relevance gate.
    return recommendProvider(
      scenario.providers,
      {
        ...DEMO_MISSION_REQUIREMENTS,
        maxPriceUsd: scenario.mission.remainingUsd,
      },
      scenario.request.provider
    );
  }, [scenario, scenarioId]);

  const scoreById = useMemo(() => {
    const map = new Map(
      recommendation.rankedByScore.map((row) => [row.provider.id, row])
    );
    return map;
  }, [recommendation]);

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }

  function schedule(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (step !== 4 && !awaitingAction) return;
    decisionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [step, awaitingAction]);

  function hardReset(nextScenario?: ScenarioId) {
    clearTimers();
    settleGen.current += 1;
    if (nextScenario) setScenarioId(nextScenario);
    setStep(0);
    setFactorCount(0);
    setRunning(false);
    setComplete(false);
    setAwaitingAction(false);
    setOutcome("none");
    setLiveStatus("idle");
    setLiveTx(null);
    setLiveExplorer(null);
    setLiveError(null);
    setResourceReceived(false);
  }

  async function runLiveProcurement(opts: {
    scenario: ScenarioId;
    confirmAsk?: boolean;
  }) {
    const gen = ++settleGen.current;
    const expectPayment = opts.scenario === "smart";
    setLiveStatus(expectPayment ? "settling" : "decided");
    setLiveTx(null);
    setLiveExplorer(null);
    setLiveError(null);
    setResourceReceived(false);
    if (expectPayment) setStep(5);

    try {
      const res = await fetch("/api/vera/procure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: opts.scenario,
          confirmAsk: opts.confirmAsk,
        }),
      });

      const data = (await res.json()) as ProcureResponse;

      if (gen !== settleGen.current) return;

      if (data.payment?.status === "blocked") {
        setOutcome("blocked");
        setLiveStatus("blocked");
        setStep(6);
        setRunning(false);
        setComplete(true);
        return;
      }

      if (data.payment?.status === "settled") {
        setOutcome(opts.scenario === "suspicious" ? "overridden" : "approved");
        setLiveStatus("settled");
        setLiveTx(data.payment.transaction);
        setLiveExplorer(data.payment.explorerUrl);
        setResourceReceived(true);
        setStep(6);
        setRunning(false);
        setComplete(true);
        return;
      }

      // Do not fake Settled — surface the real failure.
      setLiveStatus("failed");
      setLiveError(
        data.payment?.status === "failed"
          ? data.payment.message +
              (data.payment.detail ? ` — ${data.payment.detail}` : "")
          : `Unexpected response (HTTP ${res.status})`
      );
      setStep(5);
      setRunning(false);
      setComplete(true);
    } catch (err) {
      if (gen !== settleGen.current) return;
      setLiveStatus("failed");
      setLiveError(err instanceof Error ? err.message : "Network error");
      setRunning(false);
      setComplete(true);
    }
  }

  function switchScenario(id: ScenarioId) {
    if (id === scenarioId && step === 0) return;
    hardReset(id);
  }

  function runProcurement() {
    clearTimers();
    settleGen.current += 1;
    setStep(1);
    setFactorCount(0);
    setRunning(true);
    setComplete(false);
    setAwaitingAction(false);
    setOutcome("none");
    setLiveStatus("idle");
    setLiveTx(null);
    setLiveExplorer(null);
    setLiveError(null);
    setResourceReceived(false);

    schedule(() => setFactorCount(1), 450);
    schedule(() => setFactorCount(2), 1000);

    if (isSuspicious) {
      schedule(() => setStep(2), SUSPICIOUS_TIMING[2]);
      schedule(() => setFactorCount(3), SUSPICIOUS_TIMING[2] + 400);

      schedule(() => setStep(3), SUSPICIOUS_TIMING[3]);
      schedule(() => setFactorCount(4), SUSPICIOUS_TIMING[3] + 350);
      schedule(() => setFactorCount(5), SUSPICIOUS_TIMING[3] + 850);

      schedule(() => setStep(4), SUSPICIOUS_TIMING[4]);
      schedule(() => {
        setRunning(false);
        setAwaitingAction(true);
      }, SUSPICIOUS_TIMING.awaitAction);
      return;
    }

    schedule(() => setStep(2), SMART_TIMING[2]);
    schedule(() => setFactorCount(3), SMART_TIMING[2] + 500);

    schedule(() => setStep(3), SMART_TIMING[3]);
    schedule(() => setFactorCount(4), SMART_TIMING[3] + 400);
    schedule(() => setFactorCount(5), SMART_TIMING[3] + 900);

    schedule(() => setStep(4), SMART_TIMING[4]);
    schedule(() => {
      setOutcome("approved");
      setLiveStatus("decided");
      void runLiveProcurement({ scenario: "smart" });
    }, SMART_TIMING[5]);
  }

  function blockPurchase() {
    setAwaitingAction(false);
    setRunning(true);
    // Confirm BLOCK via server — ensures no x402 call occurs.
    void runLiveProcurement({ scenario: "suspicious" });
  }

  function overridePurchase() {
    setAwaitingAction(false);
    setOutcome("overridden");
    setLiveError(
      "Override of a BLOCKED gaming purchase is disabled in the live x402 demo — no off-mission payment will be signed."
    );
    setLiveStatus("blocked");
    setStep(6);
    setComplete(true);
    setRunning(false);
  }

  const statusText = (() => {
    if (step === 0) return "Ready for procurement";
    if (awaitingAction) return "Policy decision needs confirmation";
    if (liveStatus === "settling") return "LIVE · Settling on Solana Devnet…";
    if (liveStatus === "failed") return "LIVE · Settlement failed";
    if (complete && outcome === "blocked")
      return "BLOCKED BEFORE PAYMENT";
    if (complete && outcome === "overridden")
      return "Override refused · no payment";
    if (complete && settled) return "LIVE · Settled on Solana Devnet";
    if (settled) return "LIVE · Settled";
    return STEP_STATUS[step as Exclude<Step, 0>];
  })();

  // Need → Options → Recommendation → Policy → Purchase → Receipt
  const pipelineIndex =
    step === 0
      ? -1
      : step === 1
        ? 0
        : step === 2
          ? 1
          : step === 3
            ? 2
            : step === 4 || awaitingAction
              ? 3
              : step === 5
                ? 4
                : 5;

  const receiptDecision: DecisionVerdict =
    outcome === "overridden"
      ? "OVERRIDE_APPROVED"
      : outcome === "blocked"
        ? "BLOCKED"
        : scenario.decision.verdict;

  const receiptAmount =
    outcome === "overridden"
      ? scenario.request.priceUsd
      : outcome === "blocked"
        ? 0
        : scenario.decision.selectedAmountUsd;

  const receiptProvider =
    outcome === "overridden" || outcome === "blocked"
      ? scenario.request.provider
      : scenario.decision.selectedProvider;

  const receiptTx =
    outcome === "blocked" || liveStatus === "blocked"
      ? "none — BLOCKED BEFORE PAYMENT"
      : liveTx ?? (liveStatus === "failed" ? "none — settlement failed" : "pending");

  const settlementAmount =
    isSuspicious && outcome !== "approved"
      ? scenario.request.priceUsd
      : scenario.decision.selectedAmountUsd;

  const settlementProvider =
    isSuspicious && outcome === "blocked"
      ? scenario.request.provider
      : scenario.decision.selectedProvider;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
      {/* Scenario switcher */}
      <section className="mb-4 grid gap-2 sm:grid-cols-2">
        {(["smart", "suspicious"] as const).map((id) => {
          const s = SCENARIOS[id];
          const active = scenarioId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => switchScenario(id)}
              disabled={running}
              className={cn(
                "rounded-lg border px-4 py-3.5 text-left transition-colors",
                active
                  ? id === "suspicious"
                    ? "border-destructive/50 bg-destructive/10"
                    : "border-primary/40 bg-primary/10"
                  : "border-[hsl(var(--line))] bg-[hsl(var(--panel))] hover:bg-secondary/60",
                running && "opacity-60"
              )}
            >
              <div className="flex items-center gap-2">
                {id === "suspicious" ? (
                  <ShieldAlert
                    className={cn(
                      "size-4",
                      active ? "text-destructive" : "text-muted-foreground"
                    )}
                  />
                ) : (
                  <ShieldCheck
                    className={cn(
                      "size-4",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                )}
                <span className="font-display text-sm font-semibold tracking-tight">
                  {s.label}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {s.blurb}
              </p>
            </button>
          );
        })}
      </section>

      {/* Control bar */}
      <section className="panel mb-4 overflow-hidden">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="label">
              Purchase request · {scenario.label}
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              {running ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
              ) : awaitingAction ? (
                <ShieldAlert className="size-4 shrink-0 text-destructive" />
              ) : complete && outcome === "blocked" ? (
                <X className="size-4 shrink-0 text-destructive" strokeWidth={2.5} />
              ) : complete ? (
                <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} />
              ) : (
                <span className="size-2 shrink-0 rounded-full bg-muted-foreground/50" />
              )}
              <p className="truncate font-display text-lg font-semibold tracking-tight sm:text-xl">
                {statusText}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => hardReset()}
                disabled={running}
                className="border-[hsl(var(--line))] bg-transparent hover:bg-secondary"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            )}
            <Button
              size="lg"
              onClick={runProcurement}
              disabled={running || awaitingAction}
              className={cn(
                "h-11 px-6 font-semibold",
                isSuspicious &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
            >
              {complete ? (
                <>
                  <RotateCcw className="size-3.5" />
                  Run again
                </>
              ) : (
                <>
                  <Play className="size-3.5 fill-current" />
                  Run Procurement
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 border-t border-[hsl(var(--line))] px-5 py-3">
          {FLOW_STAGES.map((name, i) => {
            const active = pipelineIndex === i;
            const done = pipelineIndex > i;
            const blockedStage =
              isSuspicious && name === "Settle" && outcome === "blocked";
            return (
              <div key={name} className="flex items-center gap-1">
                {i > 0 && (
                  <ArrowRight
                    className={cn(
                      "mx-1 size-3",
                      done || active
                        ? "text-primary/70"
                        : "text-muted-foreground/40"
                    )}
                  />
                )}
                <span
                  className={cn(
                    "rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors",
                    blockedStage && "bg-destructive/15 text-destructive",
                    !blockedStage && done && "bg-primary/15 text-primary",
                    !blockedStage &&
                      active &&
                      "bg-primary/20 text-primary ring-1 ring-primary/40",
                    !blockedStage &&
                      !done &&
                      !active &&
                      "text-muted-foreground/50"
                  )}
                >
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Idle */}
      {step === 0 && (
        <div className="space-y-4">
          <section className="panel px-5 py-7 sm:px-8 sm:py-9">
            <div className="mx-auto max-w-2xl text-center">
              <p className="label">Vera</p>
              <h1 className="font-display mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Helps AI agents buy the right thing, from the right provider, at
                the right price.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {isSuspicious
                  ? "This request is within budget — but not required for the mission."
                  : "Watch Vera compare providers, recommend a fit, enforce policy, then settle on Solana."}
              </p>
            </div>

            {isSuspicious && (
              <div className="mx-auto mt-7 grid max-w-3xl gap-3 sm:grid-cols-2">
                <ContrastCard
                  tone="muted"
                  eyebrow="Budget-only check"
                  text={scenario.budgetOnlySays}
                />
                <ContrastCard
                  tone="danger"
                  eyebrow="Vera procurement decision"
                  text={scenario.veraSays}
                  strong
                />
              </div>
            )}

            <div className="mx-auto mt-7 grid max-w-3xl gap-px overflow-hidden rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--line))] sm:grid-cols-3">
              <IdleStat label="Mission" value={scenario.mission.title} />
              <IdleStat
                label="Purchase request"
                value={`${scenario.request.provider} · $${scenario.request.priceUsd.toFixed(2)}`}
              />
              <IdleStat label="Need" value={scenario.request.purpose} />
            </div>
          </section>

          <WhyVera />
        </div>
      )}

      {step > 0 && (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Contrast — always visible for suspicious once running */}
          {isSuspicious && (
            <section className="reveal lg:col-span-12">
              <div className="grid gap-3 sm:grid-cols-2">
                <ContrastCard
                  tone="muted"
                  eyebrow="Budget-only check"
                  text={scenario.budgetOnlySays}
                />
                <ContrastCard
                  tone={
                    outcome === "overridden"
                      ? "warn"
                      : step >= 4
                        ? "danger"
                        : "muted"
                  }
                  eyebrow="Vera procurement decision"
                  text={
                    outcome === "overridden"
                      ? "Human override accepted — intent mismatch logged"
                      : step >= 4
                        ? scenario.veraSays
                        : "Checking mission need…"
                  }
                  strong={step >= 4}
                />
              </div>
            </section>
          )}

          {/* Step 1 */}
          <section className="panel reveal lg:col-span-5">
            <StepHeader
              label="1 · Mission"
              status={STEP_STATUS[1]}
              active={step === 1 && running}
              done={step > 1}
            />
            <div className="space-y-4 px-5 py-5">
              <div>
                <p className="label">Mission</p>
                <p className="mt-1.5 font-display text-lg font-semibold tracking-tight">
                  {scenario.mission.title}
                </p>
              </div>
              <div>
                <p className="label">Purchase request</p>
                <p
                  className={cn(
                    "mt-1.5 text-base font-medium",
                    isSuspicious && "text-destructive"
                  )}
                >
                  {scenario.request.purpose}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {scenario.request.provider} · $
                  {scenario.request.priceUsd.toFixed(2)}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat
                  label="Budget"
                  value={`$${scenario.mission.budgetUsd.toFixed(2)}`}
                />
                <MiniStat
                  label="Spent"
                  value={`$${scenario.mission.spentUsd.toFixed(2)}`}
                />
                <MiniStat
                  label="Left"
                  value={`$${scenario.mission.remainingUsd.toFixed(2)}`}
                  accent
                />
              </div>
            </div>
          </section>

          {/* Factors */}
          <section className="panel reveal reveal-d1 lg:col-span-7">
            <div className="border-b border-[hsl(var(--line))] px-5 py-4">
              <p className="label">Decision factors</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Visible factors for this procurement decision.
              </p>
            </div>
            <ul className="divide-y divide-[hsl(var(--line))]">
              {scenario.factors.map((factor, i) => {
                const visible = i < factorCount;
                return (
                  <li
                    key={factor}
                    className={cn(
                      "flex items-start gap-3 px-5 py-3.5 transition-all duration-500",
                      visible
                        ? "translate-y-0 opacity-100"
                        : "translate-y-1 opacity-20"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-5 shrink-0 place-items-center rounded border font-mono text-[10px]",
                        visible
                          ? isSuspicious
                            ? "border-destructive/40 bg-destructive/15 text-destructive"
                            : "border-primary/40 bg-primary/15 text-primary"
                          : "border-[hsl(var(--line))] text-muted-foreground/40"
                      )}
                    >
                      {visible ? (
                        isSuspicious ? (
                          <X className="size-3" strokeWidth={2.5} />
                        ) : (
                          <Check className="size-3" strokeWidth={2.5} />
                        )
                      ) : (
                        i + 1
                      )}
                    </span>
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        visible ? "text-foreground" : "text-muted-foreground/50"
                      )}
                    >
                      {factor}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Step 2 */}
          {step >= 2 && (
            <section className="panel reveal lg:col-span-12">
              <StepHeader
                label="2 · Provider comparison"
                status={STEP_STATUS[2]}
                active={step === 2 && running}
                done={step > 2}
              />
              <div className="border-b border-[hsl(var(--line))] px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  Score = relevance {SCORE_WEIGHTS.relevance}, quality{" "}
                  {SCORE_WEIGHTS.quality}, reliability{" "}
                  {SCORE_WEIGHTS.reliability}, price{" "}
                  {SCORE_WEIGHTS.priceEfficiency}, risk{" "}
                  {SCORE_WEIGHTS.riskScore}. Pick: cheapest that meets mission
                  gates.
                </p>
              </div>
              <div className="grid gap-px bg-[hsl(var(--line))] md:grid-cols-3">
                {scenario.providers.map((provider, i) => {
                  const scored = scoreById.get(provider.id);
                  return (
                    <article
                      key={provider.id}
                      className={cn(
                        "reveal bg-[hsl(var(--panel))] px-5 py-5",
                        i === 1 && "reveal-d1",
                        i === 2 && "reveal-d2",
                        provider.recommended &&
                          !isSuspicious &&
                          step >= 4 &&
                          "bg-primary/[0.05]",
                        provider.requested &&
                          isSuspicious &&
                          step >= 4 &&
                          "bg-destructive/[0.06]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-lg font-semibold tracking-tight">
                          {provider.name}
                        </h3>
                        {provider.requested && (
                          <span
                            className={cn(
                              "shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                              isSuspicious && step >= 4
                                ? "border-destructive/40 text-destructive"
                                : "border-[hsl(var(--line))] text-muted-foreground"
                            )}
                          >
                            Requested
                          </span>
                        )}
                        {provider.recommended &&
                          step >= 4 &&
                          !isSuspicious && (
                            <span className="shrink-0 rounded border border-primary/40 bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                              Recommended provider
                            </span>
                          )}
                        {provider.recommended &&
                          isSuspicious &&
                          step >= 4 && (
                            <span className="shrink-0 rounded border border-primary/40 bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                              Mission option
                            </span>
                          )}
                      </div>
                      <p className="mt-3 font-display text-3xl font-semibold tracking-tight">
                        ${provider.priceUsd.toFixed(2)}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px] text-muted-foreground">
                        <span>Quality {provider.quality}</span>
                        <span>Reliability {provider.reliability}</span>
                        <span>Relevance {provider.relevance}</span>
                        <span>Risk {provider.risk}</span>
                      </div>
                      {scored && (
                        <div className="mt-4 rounded-md border border-[hsl(var(--line))] bg-secondary/30 px-2.5 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="label">Procurement score</span>
                            <span className="font-mono text-sm font-semibold text-foreground">
                              {scored.procurementScore.toFixed(1)}
                            </span>
                          </div>
                          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                            P.eff {scored.components.priceEfficiency.toFixed(0)}
                            {scored.meetsRequirements
                              ? " · eligible"
                              : " · fails gates"}
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Step 3 */}
          {step >= 3 && (
            <section className="panel reveal lg:col-span-5">
              <StepHeader
                label="3 · Recommendation"
                status={STEP_STATUS[3]}
                active={step === 3 && running}
                done={step > 3}
              />
              <div className="space-y-4 px-5 py-5">
                {!isSuspicious && (
                  <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-3">
                    <p className="label">Vera recommendation</p>
                    <p className="mt-2 text-sm font-medium leading-relaxed">
                      {recommendation.explanation}
                    </p>
                  </div>
                )}
                <Metric
                  label="Intent match"
                  value={`${scenario.decision.metrics.intentMatch}%`}
                  bar={scenario.decision.metrics.intentMatch}
                  danger={isSuspicious}
                />
                <Metric
                  label="Price efficiency"
                  value={`${scenario.decision.metrics.priceEfficiency}%`}
                  bar={scenario.decision.metrics.priceEfficiency}
                  danger={isSuspicious}
                />
                <div className="grid grid-cols-2 gap-3">
                  <StatChip
                    label="Budget impact"
                    value={scenario.decision.metrics.budgetImpact}
                    danger={scenario.decision.metrics.budgetImpact === "High"}
                  />
                  <StatChip
                    label={
                      isSuspicious ? "Provider familiarity" : "Provider risk"
                    }
                    value={
                      isSuspicious
                        ? scenario.decision.metrics.providerFamiliarity ?? "Low"
                        : scenario.decision.metrics.providerRisk ?? "Low"
                    }
                    danger={isSuspicious}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Step 4 — Decision (dominant) */}
          {step >= 4 && (
            <div
              ref={decisionRef}
              className={cn(
                "panel reveal relative",
                step === 4 || awaitingAction
                  ? "border-2 lg:col-span-12"
                  : "lg:col-span-7",
                isSuspicious && outcome !== "overridden"
                  ? "border-destructive/50"
                  : "border-primary/40 settle-flash"
              )}
            >
              <StepHeader
                label="4 · Policy decision"
                status={STEP_STATUS[4]}
                active={(step === 4 && running) || awaitingAction}
                done={step > 4 || complete}
                danger={isSuspicious && outcome !== "overridden"}
              />
              <div className="px-5 py-6 sm:px-7 sm:py-7">
                {isSuspicious && outcome !== "overridden" ? (
                  <>
                    <p className="inline-flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/15 px-4 py-2 font-mono text-base font-semibold tracking-[0.18em] text-destructive sm:text-lg">
                      <X className="size-5" strokeWidth={2.5} />
                      BLOCKED
                    </p>
                    <p className="mt-5 max-w-2xl text-lg font-medium leading-snug tracking-tight sm:text-xl">
                      {scenario.decision.reason}
                    </p>
                    <div className="mt-5 space-y-2 rounded-md border border-[hsl(var(--line))] bg-secondary/30 px-4 py-4">
                      <p className="text-sm text-foreground/90">
                        {scenario.decision.recommendation}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {scenario.decision.budgetConsumptionNote}
                      </p>
                    </div>

                    {(awaitingAction || outcome === "blocked") && (
                      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                        {awaitingAction ? (
                          <>
                            <Button
                              size="lg"
                              variant="destructive"
                              className="h-12 flex-1 font-semibold tracking-wide"
                              onClick={blockPurchase}
                            >
                              <X className="size-4" />
                              Block purchase
                            </Button>
                            <Button
                              size="lg"
                              variant="outline"
                              className="h-12 flex-1 border-amber-500/40 bg-amber-500/10 font-semibold tracking-wide text-amber-200 hover:bg-amber-500/20 hover:text-amber-100"
                              onClick={overridePurchase}
                            >
                              <UserRoundCheck className="size-4" />
                              Override
                            </Button>
                          </>
                        ) : (
                          <p className="flex items-center gap-2 text-sm text-destructive">
                            <X className="size-4" />
                            Purchase blocked. Settlement not created.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : isSuspicious && outcome === "overridden" ? (
                  <>
                    <p className="inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/15 px-4 py-2 font-mono text-base font-semibold tracking-[0.18em] text-amber-200">
                      <UserRoundCheck className="size-5" />
                      HUMAN OVERRIDE
                    </p>
                    <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                      Vera blocked for intent mismatch. A human overrode policy
                      and authorized settlement of the original purchase request.
                    </p>
                    <div className="mt-5 grid gap-px overflow-hidden rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--line))] sm:grid-cols-3">
                      <DataBlock
                        label="Provider"
                        value={scenario.request.provider}
                      />
                      <DataBlock
                        label="Price"
                        value={`$${scenario.request.priceUsd.toFixed(2)}`}
                        mono
                      />
                      <DataBlock
                        label="Policy decision"
                        value="Override logged"
                        mono
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="inline-flex items-center gap-2 rounded-md border border-primary/45 bg-primary/15 px-4 py-2 font-mono text-base font-semibold tracking-[0.18em] text-primary sm:text-lg">
                      <Check className="size-5" strokeWidth={2.5} />
                      APPROVED
                    </p>
                    <p className="mt-5 max-w-2xl text-lg font-medium leading-snug tracking-tight sm:text-xl">
                      {scenario.decision.reason}
                    </p>
                    <div className="mt-6 grid gap-px overflow-hidden rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--line))] sm:grid-cols-3">
                      <DataBlock
                        label="Recommended provider"
                        value={scenario.decision.selectedProvider}
                      />
                      <DataBlock
                        label="Price"
                        value={`$${scenario.decision.selectedAmountUsd.toFixed(2)}`}
                        mono
                      />
                      <DataBlock
                        label="Procurement savings"
                        value={`$${(scenario.decision.savingsUsd ?? 0).toFixed(2)}`}
                        mono
                        accent
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 5 — Live x402 / Solana Devnet */}
          {(step >= 5 ||
            liveStatus === "blocked" ||
            liveStatus === "failed" ||
            liveStatus === "settled") && (
            <LivePaymentPanel
              status={liveStatus}
              decisionLabel={
                outcome === "blocked" || liveStatus === "blocked"
                  ? "Blocked"
                  : outcome === "approved" || settled
                    ? "Approved"
                    : "—"
              }
              provider={settlementProvider}
              priceUsd={
                outcome === "blocked" || liveStatus === "blocked"
                  ? scenario.request.priceUsd
                  : settlementAmount
              }
              transaction={liveTx}
              explorerUrl={liveExplorer}
              resourceReceived={resourceReceived}
              errorMessage={liveError}
              blockedBeforePayment={
                outcome === "blocked" || liveStatus === "blocked"
              }
            />
          )}

          {/* Step 6 — Receipt */}
          {step >= 6 && (
            <section
              className={cn(
                "panel reveal lg:col-span-7",
                (outcome === "blocked" || liveStatus === "blocked") &&
                  "border-destructive/35"
              )}
            >
              <div className="border-b border-[hsl(var(--line))] px-5 py-4">
                <div className="flex items-center gap-2">
                  <p className="label">6 · Receipt</p>
                  {outcome === "blocked" ? (
                    <X className="size-3.5 text-destructive" strokeWidth={2.5} />
                  ) : (
                    <Check className="size-3.5 text-primary" strokeWidth={2.5} />
                  )}
                </div>
                <p className="mt-2 font-display text-lg font-semibold tracking-tight">
                  Audit receipt
                </p>
              </div>
              <dl className="divide-y divide-[hsl(var(--line))]">
                <ReceiptRow label="Mission" value={scenario.mission.title} />
                <ReceiptRow label="Need" value={scenario.request.purpose} />
                <ReceiptRow label="Provider" value={receiptProvider} />
                <ReceiptRow
                  label="Price"
                  value={
                    outcome === "blocked"
                      ? "$0.00 — no settlement"
                      : `$${receiptAmount.toFixed(2)} USDC`
                  }
                  mono
                />
                <ReceiptRow
                  label="Policy decision"
                  value={receiptDecision}
                  mono
                />
                <ReceiptRow
                  label="Reason"
                  value={
                    outcome === "overridden"
                      ? "Human override after Vera blocked for intent mismatch."
                      : scenario.decision.reason
                  }
                />
                <ReceiptRow
                  label="Timestamp"
                  value={new Date().toUTCString()}
                  mono
                />
                <ReceiptRow label="Settlement ID" value={receiptTx} mono />
              </dl>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

function ContrastCard({
  eyebrow,
  text,
  tone,
  strong,
}: {
  eyebrow: string;
  text: string;
  tone: "muted" | "danger" | "warn";
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-4",
        tone === "muted" && "border-[hsl(var(--line))] bg-secondary/40",
        tone === "danger" && "border-destructive/45 bg-destructive/10",
        tone === "warn" && "border-amber-500/40 bg-amber-500/10"
      )}
    >
      <p
        className={cn(
          "label",
          tone === "danger" && "text-destructive",
          tone === "warn" && "text-amber-200"
        )}
      >
        {eyebrow}
      </p>
      <p
        className={cn(
          "mt-2 text-sm leading-snug tracking-tight",
          strong && "font-semibold",
          tone === "danger" && "text-destructive",
          tone === "warn" && "text-amber-100"
        )}
      >
        {text}
      </p>
    </div>
  );
}

function StepHeader({
  label,
  status,
  active,
  done,
  danger,
}: {
  label: string;
  status: string;
  active?: boolean;
  done?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="border-b border-[hsl(var(--line))] px-5 py-4">
      <div className="flex items-center gap-2">
        <p className="label">{label}</p>
        {active && (
          <Loader2
            className={cn(
              "size-3.5 animate-spin",
              danger ? "text-destructive" : "text-primary"
            )}
          />
        )}
        {done && !active && (
          danger ? (
            <X className="size-3.5 text-destructive" strokeWidth={2.5} />
          ) : (
            <Check className="size-3.5 text-primary" strokeWidth={2.5} />
          )
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{status}</p>
    </div>
  );
}

function IdleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[hsl(var(--panel))] px-4 py-4">
      <p className="label">{label}</p>
      <p className="mt-2 text-sm font-medium leading-snug">{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-[hsl(var(--line))] bg-secondary/30 px-2.5 py-2">
      <p className="label">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-xs font-medium",
          accent && "text-primary"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function DataBlock({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="bg-[hsl(var(--panel))] px-4 py-3.5">
      <p className="label">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-sm font-semibold tracking-tight",
          mono && "font-mono",
          accent && "text-primary"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  bar,
  danger,
}: {
  label: string;
  value: string;
  bar: number;
  danger?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span
          className={cn(
            "font-mono text-sm font-medium",
            danger && "text-destructive"
          )}
        >
          {value}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "meter-fill h-full rounded-full",
            danger ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${Math.max(bar, 4)}%` }}
        />
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border border-[hsl(var(--line))] bg-secondary/40 px-3 py-2.5">
      <p className="label">{label}</p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold",
          danger ? "text-destructive" : "text-primary"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 px-5 py-3 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="label self-start pt-0.5">{label}</dt>
      <dd
        className={cn(
          "text-sm leading-relaxed text-foreground/90",
          mono && "break-all font-mono text-xs"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
