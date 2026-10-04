"use client";

import { Check, ExternalLink, Loader2, Radio, X } from "lucide-react";
import { SolanaMark } from "@/components/solana-mark";
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
};

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
}: LivePaymentPanelProps) {
  return (
    <section
      className={cn(
        "panel reveal lg:col-span-5",
        status === "settled" && "settle-flash",
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
          x402 V2 · Solana Devnet · real settlement
        </p>
      </div>

      <div className="space-y-3 px-5 py-5">
        <Row label="Vera decision" value={decisionLabel} />
        <Row label="Procurement" value={provider} />
        <Row label="Price" value={`$${priceUsd.toFixed(2)} USDC`} mono />
        <Row label="Network" value="Solana Devnet" />

        <div className="rounded-md border border-[hsl(var(--line))] bg-secondary/30 px-3 py-3">
          <p className="label">Payment</p>
          <p className="mt-1.5 flex items-center gap-2 text-sm font-medium">
            {status === "settling" && (
              <>
                <Loader2 className="size-3.5 animate-spin text-primary" />
                Settling...
              </>
            )}
            {status === "settled" && (
              <>
                <Check className="size-3.5 text-primary" strokeWidth={2.5} />
                <span className="text-primary">Settled ✓</span>
              </>
            )}
            {status === "blocked" && (
              <>
                <X className="size-3.5 text-destructive" strokeWidth={2.5} />
                <span className="text-destructive">Not initiated</span>
              </>
            )}
            {status === "failed" && (
              <>
                <X className="size-3.5 text-destructive" strokeWidth={2.5} />
                <span className="text-destructive">Failed</span>
              </>
            )}
            {(status === "idle" || status === "decided") && (
              <span className="text-muted-foreground">Waiting</span>
            )}
          </p>
        </div>

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

        {status === "settled" && transaction && (
          <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-3">
            <p className="label">Transaction</p>
            <p className="mt-1.5 break-all font-mono text-[11px] leading-relaxed">
              {transaction}
            </p>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View on Solana Explorer
                <ExternalLink className="size-3" />
              </a>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary">
              <Check className="size-3.5" strokeWidth={2.5} />
              Resource {resourceReceived ? "Received ✓" : "Pending"}
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

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-right text-sm font-medium",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </span>
    </div>
  );
}
