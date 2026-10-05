"use client";

import {
  Hand,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import type { ScenarioId } from "@/lib/types";
import { SCENARIOS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const DEMO_SCENARIOS: ScenarioId[] = [
  "smart",
  "suspicious",
  "expensive",
  "ask",
];

const ICONS: Record<
  ScenarioId,
  typeof ShieldCheck
> = {
  smart: ShieldCheck,
  suspicious: ShieldAlert,
  expensive: TrendingDown,
  ask: Hand,
};

export function isVeraDemoControlsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_VERA_DEMO_CONTROLS === "1") return true;
  if (process.env.NEXT_PUBLIC_VERA_DEMO_CONTROLS === "0") return false;
  return process.env.NODE_ENV !== "production";
}

type DemoControlPanelProps = {
  scenarioId: ScenarioId;
  running: boolean;
  onSelect: (id: ScenarioId) => void;
};

export function DemoControlPanel({
  scenarioId,
  running,
  onSelect,
}: DemoControlPanelProps) {
  return (
    <section className="panel mb-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--line))] px-4 py-3">
        <div>
          <p className="label">Demo control panel</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Developer-only · hidden in production builds
          </p>
        </div>
        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-200">
          Demo env
        </span>
      </div>

      <div className="px-4 py-3">
        <p className="label mb-2">Scenario</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {DEMO_SCENARIOS.map((id) => {
            const s = SCENARIOS[id];
            const active = scenarioId === id;
            const Icon = ICONS[id];
            const danger = id === "suspicious";
            const ask = id === "ask";
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                disabled={running}
                className={cn(
                  "rounded-md border px-3 py-3 text-left transition-colors",
                  active &&
                    danger &&
                    "border-destructive/50 bg-destructive/10",
                  active &&
                    ask &&
                    "border-amber-500/40 bg-amber-500/10",
                  active &&
                    !danger &&
                    !ask &&
                    "border-primary/40 bg-primary/10",
                  !active &&
                    "border-[hsl(var(--line))] bg-secondary/20 hover:bg-secondary/50",
                  running && "opacity-60"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0",
                      active && danger && "text-destructive",
                      active && ask && "text-amber-200",
                      active && !danger && !ask && "text-primary",
                      !active && "text-muted-foreground"
                    )}
                  />
                  <span className="font-display text-sm font-semibold tracking-tight">
                    {s.label}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  {s.blurb}
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80">
                  {s.request.provider} · ${s.request.priceUsd.toFixed(2)}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
