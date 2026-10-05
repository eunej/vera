"use client";

/**
 * LEGACY UI — unused by the primary Vera demo.
 * Live payments render `LivePaymentPanel` and only show Settled after real x402.
 */

import { Check, Loader2 } from "lucide-react";
import { SolanaMark } from "@/components/solana-mark";
import type { PaymentReceipt, SettlementStatus } from "@/lib/settlement";
import { cn } from "@/lib/utils";

type SettlementPanelProps = {
  amountUsd: number;
  provider: string;
  status: SettlementStatus;
  receipt: PaymentReceipt | null;
  note?: string;
};

export function SettlementPanel({
  amountUsd,
  provider,
  status,
  receipt,
  note,
}: SettlementPanelProps) {
  const settling = status === "settling";
  const settled = status === "settled";

  return (
    <section
      className={cn(
        "panel reveal lg:col-span-5",
        settled && "settle-flash"
      )}
    >
      <div className="border-b border-[hsl(var(--line))] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="label">Settlement</p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
              ${amountUsd.toFixed(2)}{" "}
              <span className="text-base text-muted-foreground">USDC</span>
            </p>
          </div>
          <SolanaMark />
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          5 · Solana settlement · demo
        </p>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-[hsl(var(--line))] bg-secondary/30 px-3 py-2.5">
            <p className="label">Network</p>
            <p className="mt-1 text-sm font-medium">Solana</p>
          </div>
          <div className="rounded-md border border-[hsl(var(--line))] bg-secondary/30 px-3 py-2.5">
            <p className="label">Status</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
              {settling && (
                <>
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  <span>Settling...</span>
                </>
              )}
              {settled && (
                <>
                  <Check
                    className="size-3.5 text-primary"
                    strokeWidth={2.5}
                  />
                  <span className="font-mono tracking-[0.12em] text-primary">
                    SETTLED
                  </span>
                </>
              )}
              {!settling && !settled && (
                <span className="text-muted-foreground">Idle</span>
              )}
            </p>
          </div>
        </div>

        <div className="rounded-md border border-[hsl(var(--line))] bg-secondary/20 px-3 py-2.5">
          <p className="label">Provider</p>
          <p className="mt-1 text-sm font-medium">{provider}</p>
        </div>

        {note && (
          <p className="text-xs text-muted-foreground">{note}</p>
        )}

        {settled && receipt && (
          <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-base font-semibold tracking-tight">
                Payment receipt
              </p>
              <SolanaMark />
            </div>
            <dl className="mt-4 space-y-2.5">
              <ReceiptLine
                label="Amount"
                value={`$${receipt.amountUsd.toFixed(2)} ${receipt.asset}`}
              />
              <ReceiptLine label="Provider" value={receipt.provider} />
              <ReceiptLine label="Network" value={receipt.networkLabel} />
              <ReceiptLine label="Decision" value={receipt.decision} />
              <ReceiptLine label="Mission" value={receipt.mission} />
              <ReceiptLine
                label="Signature"
                value={receipt.signature}
                mono
              />
            </dl>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Simulated settlement · not on-chain
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ReceiptLine({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-sm font-medium sm:text-right",
          mono && "break-all font-mono text-[11px] text-foreground/80"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
