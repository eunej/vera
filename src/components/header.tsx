import { VeraMark } from "@/components/vera-logo";
import { AGENT_STATUS } from "@/lib/mock-data";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[hsl(var(--line))] bg-[hsl(220_18%_5%/0.88)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 rounded-sm outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          <VeraMark className="size-7 shrink-0 text-foreground" />
          <div className="min-w-0 leading-tight">
            <p className="font-display text-lg font-semibold tracking-[0.02em]">
              vera
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              Agent Procurement Intelligence
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <Link
            href="/demo"
            className="hidden text-xs font-medium text-muted-foreground transition hover:text-foreground sm:inline"
          >
            Live demo
          </Link>
          <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--line))] bg-secondary/60 px-2.5 py-1.5 sm:px-3">
            <span className="status-dot size-2 rounded-full bg-primary" />
            <div className="leading-tight">
              <p className="text-xs font-medium text-foreground">
                {AGENT_STATUS.label}
              </p>
              <p className="hidden font-mono text-[10px] text-muted-foreground sm:block">
                {AGENT_STATUS.detail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
