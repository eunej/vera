import { VeraLogo, VeraMark } from "@/components/vera-logo";

export const metadata = {
  title: "Vera Brand",
  description: "Official Vera mark — blades. Symbol, lockups, and color.",
};

export default function BrandPage() {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-12 max-w-xl">
        <p className="label mb-3">Brand system</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Vera
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Official mark: two converging blades resolve into a selection point —
          decision, evaluation, intelligent purchase.
        </p>
      </header>

      <section className="mb-10">
        <p className="label mb-4">Mark</p>
        <div className="grid gap-px overflow-hidden rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--line))] sm:grid-cols-4">
          <MarkTile label="App / dark UI" bg="bg-[hsl(var(--panel))]">
            <VeraMark className="size-12 text-foreground" />
          </MarkTile>
          <MarkTile label="24px" bg="bg-[hsl(var(--panel))]">
            <VeraMark className="size-6 text-foreground" />
          </MarkTile>
          <MarkTile label="16px" bg="bg-[hsl(var(--panel))]">
            <VeraMark className="size-4 text-foreground" />
          </MarkTile>
          <MarkTile label="Mono" bg="bg-[hsl(var(--panel))]">
            <VeraMark className="size-12 text-foreground" variant="mono" />
          </MarkTile>
        </div>
      </section>

      <section className="mb-10">
        <p className="label mb-4">Lockups</p>
        <div className="grid gap-px overflow-hidden rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--line))] sm:grid-cols-2">
          <div className="flex min-h-[160px] flex-col justify-between bg-white px-8 py-7 text-black">
            <VeraLogo
              markClassName="size-9 text-black"
              wordmarkClassName="text-black text-[1.65rem] tracking-[0.02em]"
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Light
            </p>
          </div>
          <div className="flex min-h-[160px] flex-col justify-between bg-[#0A0A0B] px-8 py-7">
            <VeraLogo
              markClassName="size-9 text-white"
              wordmarkClassName="text-white text-[1.65rem] tracking-[0.02em]"
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Dark
            </p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <p className="label mb-4">Surfaces</p>
        <div className="grid gap-px overflow-hidden rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--line))] sm:grid-cols-2">
          <div className="flex min-h-[180px] items-center justify-center bg-white">
            <VeraMark className="size-16 text-black" />
          </div>
          <div className="flex min-h-[180px] items-center justify-center bg-[#0A0A0B]">
            <VeraMark className="size-16 text-white" />
          </div>
        </div>
      </section>

      <section>
        <p className="label mb-4">Color</p>
        <div className="grid gap-px overflow-hidden rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--line))] sm:grid-cols-3">
          <Swatch name="Ink" hex="#0A0A0B" className="bg-[#0A0A0B]" />
          <Swatch name="Paper" hex="#FFFFFF" className="bg-white text-black" />
          <Swatch name="Signal" hex="#5B7CFF" className="bg-[#5B7CFF]" />
        </div>
        <p className="mt-4 max-w-lg text-xs leading-relaxed text-muted-foreground">
          Masters in <code className="text-foreground">/public/brand</code>.
          Favicon uses the dark tile mark. Signal blue is reserved for the
          selection point.
        </p>
      </section>
    </main>
  );
}

function MarkTile({
  label,
  bg,
  children,
}: {
  label: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex min-h-[130px] flex-col justify-between px-5 py-4 ${bg}`}
    >
      <div className="flex flex-1 items-center justify-center">{children}</div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function Swatch({
  name,
  hex,
  className,
}: {
  name: string;
  hex: string;
  className: string;
}) {
  return (
    <div
      className={`flex min-h-[100px] flex-col justify-end px-5 py-4 ${className}`}
    >
      <p className="text-sm font-medium">{name}</p>
      <p className="font-mono text-[11px] opacity-70">{hex}</p>
    </div>
  );
}
