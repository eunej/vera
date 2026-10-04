const SPENDING_CONTROL = [
  "Balance check",
  "Amount under limit",
  "Authorize transfer",
] as const;

const PROCUREMENT = [
  "Intent",
  "Provider selection",
  "Price comparison",
  "Mission alignment",
  "Anomaly detection",
  "Policy enforcement",
  "Settlement",
] as const;

export function WhyVera() {
  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[hsl(var(--line))] px-5 py-3.5">
        <div>
          <p className="label">Why Vera?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Same request. Different question.
          </p>
        </div>
      </div>

      <div className="grid gap-px bg-[hsl(var(--line))] sm:grid-cols-2">
        <ComparisonColumn
          eyebrow="Spending control"
          question="Can the agent pay?"
          items={SPENDING_CONTROL}
          emphasis={false}
        />
        <ComparisonColumn
          eyebrow="Procurement intelligence"
          question="Should the agent buy this?"
          items={PROCUREMENT}
          emphasis
        />
      </div>
    </section>
  );
}

function ComparisonColumn({
  eyebrow,
  question,
  items,
  emphasis,
}: {
  eyebrow: string;
  question: string;
  items: readonly string[];
  emphasis: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? "bg-primary/[0.05] px-5 py-4"
          : "bg-[hsl(var(--panel))] px-5 py-4"
      }
    >
      <p className={emphasis ? "label text-primary" : "label"}>{eyebrow}</p>
      <p className="mt-1.5 font-display text-base font-semibold tracking-tight sm:text-lg">
        {question}
      </p>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2 text-[13px] text-foreground/75"
          >
            <span
              className={
                emphasis
                  ? "size-1 shrink-0 rounded-full bg-primary"
                  : "size-1 shrink-0 rounded-full bg-muted-foreground/45"
              }
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
