"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { VeraMark } from "@/components/vera-logo";

const PROCESS = [
  { label: "Intent", detail: "mission → need" },
  { label: "Compare", detail: "price · fit · latency" },
  { label: "Policy", detail: "limits check" },
  { label: "Decide", detail: "APPROVE · ASK · BLOCK" },
  { label: "Settle", detail: "x402 USDC" },
  { label: "Receipt", detail: "why it cleared" },
] as const;

const PROBLEMS = [
  {
    title: "Agents can pay before anyone asks if they should",
    body: "Rails, wallets, and facilitators move money. They do not judge whether the purchase is the right one.",
  },
  {
    title: "Authorization ≠ procurement",
    body: "Caps and allowlists stop overspend. They do not compare providers, catch inflated tiers, or score mission fit.",
  },
  {
    title: "Enterprise PO tools miss machine micropurchase",
    body: "Source-to-pay suites govern human workflows. They were not built for agent↔API pay-per-request on x402.",
  },
] as const;

const STEPS = [
  {
    title: "State the mission",
    body: "An agent declares what it needs — data, compute, a tool call — not which vendor to hit first.",
  },
  {
    title: "Compare options",
    body: "Vera scores providers on price, latency, and fit so the agent does not overpay for the same capability.",
  },
  {
    title: "Run policy",
    body: "APPROVE, ASK, or BLOCK before any signature. Settlement never starts on a blocked request.",
  },
  {
    title: "Settle and receipt",
    body: "Cleared buys settle over x402. Every receipt carries why it was allowed — audit-ready for the humans funding the agent.",
  },
] as const;

const USE_CASES = [
  {
    title: "Research agent",
    body: "Needs market data. Vera picks the cheapest fit under policy — and blocks a $3.20 premium when a $0.02 lite tier is enough.",
  },
  {
    title: "Tool-using agent",
    body: "Calls paid MCP / API endpoints. Vera compares routes and only settles when the buy clears mission and budget.",
  },
  {
    title: "Ops agent",
    body: "Buys infra or SaaS micropurchases. Humans get ASK on edge cases; routine in-policy buys auto-approve with a receipt.",
  },
] as const;

const PRODUCT = [
  {
    title: "Intent → need",
    body: "Turn a mission into a priced requirement before shopping.",
  },
  {
    title: "Provider comparison",
    body: "Score options together — not first-responder wins.",
  },
  {
    title: "Hard policy gate",
    body: "APPROVE / ASK / BLOCK enforced before x402.",
  },
  {
    title: "Settlement handoff",
    body: "Only cleared buys reach the payment rail.",
  },
  {
    title: "Reasoned receipts",
    body: "Intent, verdict, and on-chain proof in one trail.",
  },
] as const;

const DEMAND = [
  {
    title: "Adjacent pain is already loud",
    body: "Finance wants caps and approvals. CIOs want runtime policy. Procurement wants governed agents. That demand exists before a “Vera” label does.",
  },
  {
    title: "Competitors validate the problem",
    body: "Spend-control planes are already selling “control plane for agentic spending.” Buyers are being pitched the category — Vera sharpens the wedge.",
  },
] as const;

const WEDGES = [
  {
    claim: "Procurement quality, not only authorization.",
    vs: "Vs spend-control planes: compare / fit / overpay — not just cap / allowlist / approve.",
  },
  {
    claim: "Agent↔API micropurchase on x402.",
    vs: "Vs enterprise PO suites: machine pay-per-request, not human source-to-pay workflows.",
  },
] as const;

export function StoryPage() {
  return (
    <main className="story-page relative overflow-x-hidden">
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <ProcessSection />
      <UseCasesSection />
      <ProductSection />
      <TimingSection />
      <WedgeSection />
      <VisionSection />
      <CloseSection />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative border-b border-[hsl(var(--line))]">
      <div className="story-hero-plane absolute inset-0" aria-hidden />
      <DecisionVisual />

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20">
        <div className="max-w-2xl">
          <p className="story-reveal label text-primary">
            Agent procurement intelligence
          </p>
          <h1 className="story-reveal story-d1 mt-4 font-display text-[2.2rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.25rem]">
            The layer between intent and settlement
            <span className="block text-primary">for machine-paid APIs.</span>
          </h1>
          <p className="story-reveal story-d2 mt-3 font-display text-lg font-medium tracking-tight text-foreground/80 sm:text-xl">
            Intent · Compare · Policy · Decide · Settle · Receipt
          </p>
          <p className="story-reveal story-d2 mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Let agents buy what they need — without overpaying, buying the wrong
            tier, or settling before policy clears. Vera asks{" "}
            <span className="text-foreground">should the agent buy this?</span>{" "}
            before any USDC moves.
          </p>
          <div className="story-reveal story-d3 mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Run the live demo
            </Link>
            <a
              href="#problem"
              className="inline-flex h-11 items-center justify-center rounded-md border border-[hsl(var(--line))] bg-secondary/50 px-5 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              See the problem
            </a>
          </div>
        </div>

        <ol className="story-reveal story-d3 mt-14 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {PROCESS.map((step, i) => (
            <li
              key={step.label}
              className="relative border border-[hsl(var(--line))] bg-[hsl(var(--panel)/0.72)] px-3 py-3"
            >
              <span className="font-mono text-[10px] text-primary/80">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-1 font-display text-sm font-semibold tracking-tight">
                {step.label}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function DecisionVisual() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <svg
        className="story-decision-svg absolute right-[-10%] top-[4%] h-[70%] w-[70%] max-w-none opacity-70 sm:right-[-2%] sm:top-[2%] sm:w-[52%] sm:opacity-[0.85]"
        viewBox="0 0 640 520"
        fill="none"
      >
        <defs>
          <linearGradient id="storyPath" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(152 72% 48%)" stopOpacity="0.15" />
            <stop
              offset="100%"
              stopColor="hsl(152 72% 48%)"
              stopOpacity="0.85"
            />
          </linearGradient>
        </defs>
        {[
          { d: "M40 70 C220 70, 300 220, 400 260", delay: "0s" },
          { d: "M40 160 C200 160, 300 230, 400 260", delay: "0.35s" },
          { d: "M40 260 C190 260, 300 260, 400 260", delay: "0.7s" },
          { d: "M40 360 C200 360, 300 290, 400 260", delay: "1.05s" },
          { d: "M40 450 C220 450, 300 300, 400 260", delay: "1.4s" },
        ].map((p) => (
          <path
            key={p.d}
            className="story-option-path"
            style={{ animationDelay: p.delay }}
            d={p.d}
            stroke="url(#storyPath)"
            strokeWidth="1.5"
          />
        ))}
        <g className="story-gate">
          <rect
            x="382"
            y="198"
            width="76"
            height="124"
            rx="6"
            fill="hsl(220 16% 8% / 0.85)"
            stroke="hsl(152 72% 48% / 0.55)"
            strokeWidth="1.5"
          />
          <text
            x="420"
            y="230"
            textAnchor="middle"
            fill="hsl(152 72% 55%)"
            fontSize="11"
            fontFamily="var(--font-geist-mono), monospace"
            letterSpacing="0.16em"
          >
            GATE
          </text>
          <text
            x="420"
            y="262"
            textAnchor="middle"
            fill="hsl(152 72% 48%)"
            fontSize="13"
            fontFamily="var(--font-display), sans-serif"
            fontWeight="600"
          >
            APPROVE
          </text>
          <text
            x="420"
            y="286"
            textAnchor="middle"
            fill="hsl(45 90% 60% / 0.75)"
            fontSize="12"
            fontFamily="var(--font-display), sans-serif"
          >
            ASK
          </text>
          <text
            x="420"
            y="310"
            textAnchor="middle"
            fill="hsl(0 62% 58% / 0.8)"
            fontSize="12"
            fontFamily="var(--font-display), sans-serif"
          >
            BLOCK
          </text>
        </g>
        <path
          className="story-settle-path"
          d="M458 260 C520 260, 540 260, 590 260"
          stroke="hsl(152 72% 48%)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle
          className="story-pulse-node"
          cx="590"
          cy="260"
          r="8"
          fill="hsl(152 72% 48%)"
          style={{ transformOrigin: "590px 260px" }}
        />
        <text
          x="590"
          y="290"
          textAnchor="middle"
          fill="hsl(210 20% 78%)"
          fontSize="12"
          fontFamily="var(--font-geist-mono), monospace"
          letterSpacing="0.12em"
        >
          x402
        </text>
        <circle className="story-token" r="4.5" fill="hsl(152 90% 62%)">
          <animateMotion
            dur="4.8s"
            repeatCount="indefinite"
            path="M40 260 C190 260, 300 260, 400 260 C458 260, 520 260, 590 260"
          />
        </circle>
      </svg>
    </div>
  );
}

function SectionShell({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="border-t border-[hsl(var(--line))] px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-[1200px]">
        <p className="label">{eyebrow}</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h2>
        {lead ? (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {lead}
          </p>
        ) : null}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <SectionShell
      id="problem"
      eyebrow="Problem"
      title="Agentic spend is scaling faster than procurement judgment"
      lead="Payment rails unlock machine commerce. Without a buy decision in front of settlement, waste and policy breaches scale with autonomy."
    >
      <div className="divide-y divide-[hsl(var(--line))] border-y border-[hsl(var(--line))]">
        {PROBLEMS.map((p) => (
          <article
            key={p.title}
            className="grid gap-2 py-7 sm:grid-cols-[1fr_1.2fr] sm:gap-10"
          >
            <h3 className="font-display text-xl font-semibold tracking-tight">
              {p.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {p.body}
            </p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function SolutionSection() {
  return (
    <SectionShell
      id="solution"
      eyebrow="Solution"
      title={
        <>
          Vera decides the buy.
          <span className="block text-muted-foreground">
            Then hands a clean APPROVE to the rail.
          </span>
        </>
      }
      lead="Procurement intelligence for autonomous spend — intent, comparison, and policy before settlement. Not a wallet. Not analytics after the fact."
    >
      <div className="grid gap-8 border-l-2 border-primary/50 pl-5 sm:grid-cols-3 sm:gap-6 sm:border-l-0 sm:pl-0">
        {[
          {
            k: "Should it buy?",
            v: "Mission alignment and provider fit — not just “can it pay?”",
          },
          {
            k: "At what price?",
            v: "Compare options so the agent does not overpay for the same result.",
          },
          {
            k: "Under what rule?",
            v: "Hard gate before x402. ASK when judgment is needed. BLOCK when it fails.",
          },
        ].map((item) => (
          <div key={item.k} className="sm:border-l sm:border-[hsl(var(--line))] sm:pl-5">
            <p className="font-display text-lg font-semibold tracking-tight text-primary">
              {item.k}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.v}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function ProcessSection() {
  return (
    <SectionShell
      id="process"
      eyebrow="Process"
      title="Four steps from mission to receipt"
      lead="The same flow as the live demo — written out. Policy decides; settlement follows."
    >
      <ol className="space-y-0 border-t border-[hsl(var(--line))]">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="story-value-row grid gap-3 border-b border-[hsl(var(--line))] py-8 sm:grid-cols-[5rem_1fr_1.3fr] sm:items-baseline sm:gap-8"
          >
            <span className="font-mono text-sm text-primary/80">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display text-2xl font-semibold tracking-tight">
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

function UseCasesSection() {
  return (
    <SectionShell
      id="use-cases"
      eyebrow="Example use cases"
      title="Where procurement intelligence pays for itself"
      lead="Any agent that shops paid APIs, tools, or data under a human-funded budget."
    >
      <div className="divide-y divide-[hsl(var(--line))] border-y border-[hsl(var(--line))]">
        {USE_CASES.map((u) => (
          <article
            key={u.title}
            className="grid gap-2 py-7 sm:grid-cols-[12rem_1fr] sm:gap-10"
          >
            <h3 className="font-display text-lg font-semibold tracking-tight">
              {u.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {u.body}
            </p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function ProductSection() {
  return (
    <SectionShell
      id="product"
      eyebrow="Product"
      title="One gate in front of the rail"
      lead="Vera sits between the agent’s mission and x402 settlement. Caps alone are not enough — quality of the buy is the product."
    >
      <ul className="grid gap-px overflow-hidden rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--line))] sm:grid-cols-2 lg:grid-cols-5">
        {PRODUCT.map((p) => (
          <li
            key={p.title}
            className="bg-[hsl(var(--panel))] px-4 py-5"
          >
            <p className="font-display text-base font-semibold tracking-tight">
              {p.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {p.body}
            </p>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

function TimingSection() {
  return (
    <SectionShell
      id="timing"
      eyebrow="Market timing"
      title="Demand shows up as adjacent pain"
      lead="The category label is early. The buyers’ problems are not."
    >
      <div className="grid gap-10 sm:grid-cols-2">
        {DEMAND.map((d) => (
          <article key={d.title}>
            <h3 className="font-display text-xl font-semibold tracking-tight">
              {d.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {d.body}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-10 max-w-2xl border-l-2 border-primary/50 pl-5 text-sm leading-relaxed text-foreground/85 sm:text-base">
        Finance wants caps and approvals. CIOs want runtime policy. Procurement
        wants governed agents. Spend-control products pitching a “control plane
        for agentic spending” means the problem is already being sold — Vera
        owns the buy decision those planes leave open.
      </p>
    </SectionShell>
  );
}

function WedgeSection() {
  return (
    <SectionShell
      id="wedge"
      eyebrow="Wedge"
      title="How Vera is different"
      lead="Authorization stops bad spend. Vera improves the buy itself — then settles only when it clears."
    >
      <div className="divide-y divide-[hsl(var(--line))] border-y border-[hsl(var(--line))]">
        {WEDGES.map((w) => (
          <article
            key={w.claim}
            className="grid gap-2 py-7 sm:grid-cols-[1.2fr_1fr] sm:gap-10"
          >
            <p className="font-display text-lg font-semibold tracking-tight sm:text-xl">
              {w.claim}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {w.vs}
            </p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function VisionSection() {
  return (
    <section className="relative overflow-hidden border-t border-[hsl(var(--line))] px-4 py-16 sm:px-6 sm:py-24">
      <div className="story-market-glow absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-[1200px]">
        <p className="label">Vision</p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Every autonomous purchase is warranted before it settles.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Agents become economic actors. Rails will multiply. Vera is the
          procurement judgment layer — so machine commerce scales capability
          without scaling waste.
        </p>
      </div>
    </section>
  );
}

function CloseSection() {
  return (
    <section className="border-t border-[hsl(var(--line))] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-lg">
          <VeraMark className="size-9 text-foreground" />
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Mission in. Receipt out.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Watch Vera compare options, block an overpriced buy, and settle only
            when policy clears.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          Open the procurement demo
        </Link>
      </div>
    </section>
  );
}
