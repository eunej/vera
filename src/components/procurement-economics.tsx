"use client";

import { cn } from "@/lib/utils";

export type ProcurementEconomicsProps = {
  requestedUsd: number;
  actualUsd: number;
  savedUsd: number;
  savingsPct: number;
  budgetUsd: number;
  spentUsd: number;
  remainingUsd: number;
  /** When true, actual spend is $0 because policy blocked payment. */
  blocked?: boolean;
  className?: string;
};

export function ProcurementEconomics({
  requestedUsd,
  actualUsd,
  savedUsd,
  savingsPct,
  budgetUsd,
  spentUsd,
  remainingUsd,
  blocked,
  className,
}: ProcurementEconomicsProps) {
  return (
    <section
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        className
      )}
    >
      <article className="panel overflow-hidden">
        <div className="border-b border-[hsl(var(--line))] px-4 py-3">
          <p className="label">Procurement savings</p>
          <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-primary">
            {savingsPct}%
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {blocked
              ? "Spend avoided vs requested"
              : "Cheaper than requested provider"}
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-px bg-[hsl(var(--line))]">
          <Metric label="Requested" value={`$${requestedUsd.toFixed(2)}`} />
          <Metric
            label="Actual"
            value={`$${actualUsd.toFixed(2)}`}
            accent={!blocked}
            muted={blocked}
          />
          <Metric
            label="Saved"
            value={`$${savedUsd.toFixed(2)}`}
            accent
          />
        </dl>
      </article>

      <article className="panel overflow-hidden">
        <div className="border-b border-[hsl(var(--line))] px-4 py-3">
          <p className="label">Mission budget</p>
          <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
            ${remainingUsd.toFixed(2)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Remaining</p>
        </div>
        <dl className="grid grid-cols-3 gap-px bg-[hsl(var(--line))]">
          <Metric label="Budget" value={`$${budgetUsd.toFixed(2)}`} />
          <Metric label="Spent" value={`$${spentUsd.toFixed(2)}`} />
          <Metric
            label="Remaining"
            value={`$${remainingUsd.toFixed(2)}`}
            accent
          />
        </dl>
      </article>
    </section>
  );
}

function Metric({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="bg-[hsl(var(--panel))] px-3 py-3">
      <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-mono text-sm font-semibold tabular-nums",
          accent && "text-primary",
          muted && "text-muted-foreground"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
