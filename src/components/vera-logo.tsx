import { cn } from "@/lib/utils";

type MarkVariant = "accent" | "mono";

type VeraMarkProps = {
  className?: string;
  variant?: MarkVariant;
};

/** Concept 1 — two bold blades + selection point. */
export function VeraMark({ className, variant = "accent" }: VeraMarkProps) {
  const mono = variant === "mono";
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-7", className)}
      aria-hidden
    >
      <path
        d="M6.4 5.8 L14.2 22.4 L11.7 23.55 L3.9 6.95 Z"
        fill="currentColor"
      />
      <path
        d="M25.6 5.8 L17.8 22.4 L20.3 23.55 L28.1 6.95 Z"
        fill="currentColor"
      />
      <path
        d="M16 24.05 L17.55 25.6 L16 27.15 L14.45 25.6 Z"
        fill={mono ? "currentColor" : "#5B7CFF"}
      />
    </svg>
  );
}

/** Concept 2 — many thin option-paths converge into one decision. */
export function VeraMarkConverge({
  className,
  variant = "accent",
}: VeraMarkProps) {
  const mono = variant === "mono";
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-7", className)}
      aria-hidden
    >
      <g
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <path d="M5 6.25 L16 24.1" />
        <path d="M10.5 6.25 L16 24.1" />
        <path d="M16 6.25 L16 24.1" />
        <path d="M21.5 6.25 L16 24.1" />
        <path d="M27 6.25 L16 24.1" />
      </g>
      <circle
        cx="16"
        cy="25.55"
        r="1.35"
        fill={mono ? "currentColor" : "#6B7AFF"}
      />
    </svg>
  );
}

/** Concept 3 — Verity. Open V + indigo node. */
export function VeraMarkVerity({
  className,
  variant = "accent",
}: VeraMarkProps) {
  const mono = variant === "mono";
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-7", className)}
      aria-hidden
    >
      <path
        d="M6.5 6.8 L13.6 23.2 L11.15 24.4 L4.05 8 Z"
        fill="currentColor"
      />
      <path
        d="M25.5 6.8 L18.4 23.2 L20.85 24.4 L27.95 8 Z"
        fill="currentColor"
      />
      <rect
        x="14.2"
        y="13.4"
        width="3.6"
        height="3.6"
        rx="0.4"
        fill={mono ? "currentColor" : "#5B6BF0"}
      />
    </svg>
  );
}

/**
 * Concept 5 — Agent / Resolve.
 * Outer V frame + inner path with nodes → optimal decision tip.
 * Computational without circuit-board language.
 */
export function VeraMarkAgent({
  className,
  variant = "accent",
}: VeraMarkProps) {
  const mono = variant === "mono";
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-7", className)}
      aria-hidden
    >
      <path
        d="M5.2 6.2 L14.6 25.6"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="square"
      />
      <path
        d="M26.8 6.2 L17.4 25.6"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="square"
      />
      <path
        d="M10.6 12.8 L16 23.2 L21.4 12.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <circle cx="10.6" cy="12.8" r="1.85" fill="currentColor" />
      <circle cx="21.4" cy="12.8" r="1.85" fill="currentColor" />
      <circle
        cx="16"
        cy="24.35"
        r="2"
        fill={mono ? "currentColor" : "#6B75F0"}
      />
    </svg>
  );
}

/**
 * Concept 4 — Tile mark.
 * Rounded square with V cut through negative space. App icon / favicon.
 */
export function VeraMarkTile({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-7", className)}
      aria-hidden
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.5 2h17A5.5 5.5 0 0 1 30 7.5v17a5.5 5.5 0 0 1-5.5 5.5h-17A5.5 5.5 0 0 1 2 24.5v-17A5.5 5.5 0 0 1 7.5 2ZM10.4 9.2 16 22.4 21.6 9.2h-2.15L16 17.6 12.55 9.2H10.4Z"
      />
    </svg>
  );
}

/**
 * Concept 4 — Custom wordmark.
 * Distinctive segmented-V + optically tracked "era".
 */
export function VeraWordmarkCustom({
  className,
  showMark = false,
  markClassName,
}: {
  className?: string;
  showMark?: boolean;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {showMark ? <VeraMarkTile className={cn("size-6", markClassName)} /> : null}
      <span className="inline-flex items-baseline" aria-label="Vera">
        <svg
          viewBox="0 0 28 32"
          className="h-[1.05em] w-[0.92em] shrink-0 translate-y-[0.06em]"
          fill="none"
          aria-hidden
        >
          <g
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="square"
            strokeLinejoin="miter"
          >
            <path d="M3.2 5.5 L7.1 12.2" />
            <path d="M8.5 14.6 L11.8 20.4" />
            <path d="M13 22.5 L15.2 26.4" />
            <path d="M24.8 5.5 L15.2 26.4" />
          </g>
        </svg>
        <span className="font-display text-[1.05em] font-medium tracking-[-0.025em] text-current">
          era
        </span>
      </span>
    </span>
  );
}

/** Concept 3 title-case wordmark — optical V vs era tracking. */
export function VeraWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-[1.2rem] font-semibold text-foreground",
        className
      )}
    >
      <span className="tracking-[-0.03em]">V</span>
      <span className="tracking-[0.09em]">era</span>
    </span>
  );
}

type VeraLogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
  variant?: MarkVariant;
  concept?: "blades" | "converge" | "verity" | "wordmark" | "agent";
};

export function VeraLogo({
  className,
  markClassName,
  wordmarkClassName,
  showWordmark = true,
  variant = "accent",
  concept = "blades",
}: VeraLogoProps) {
  if (concept === "wordmark") {
    return (
      <VeraWordmarkCustom
        className={cn("text-foreground", className, wordmarkClassName)}
        showMark
        markClassName={markClassName}
      />
    );
  }

  const Mark =
    concept === "converge"
      ? VeraMarkConverge
      : concept === "verity"
        ? VeraMarkVerity
        : concept === "agent"
          ? VeraMarkAgent
          : VeraMark;

  const word =
    concept === "verity" || concept === "agent" ? (
      <VeraWordmark className={wordmarkClassName} />
    ) : (
      <span
        className={cn(
          "font-display text-[1.2rem] font-semibold tracking-[0.08em] text-foreground",
          wordmarkClassName
        )}
      >
        vera
      </span>
    );

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <Mark className={markClassName} variant={variant} />
      {showWordmark ? word : null}
    </div>
  );
}
