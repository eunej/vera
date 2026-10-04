"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Compact Solana visual mark for settlement UI (branding only). */
export function SolanaMark({
  className,
  title = "Solana",
}: {
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const a = `sol-a-${uid}`;
  const b = `sol-b-${uid}`;
  const c = `sol-c-${uid}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-[#9945FF]/35 bg-[#9945FF]/10 px-2 py-1",
        className
      )}
      title={title}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-3.5"
        fill="none"
      >
        <path
          d="M4.5 7.2h12.4c.4 0 .7.2.9.5l1.7 2.1c.3.4 0 1-.5 1H6.6c-.4 0-.7-.2-.9-.5L4 8.2c-.3-.4 0-1 .5-1Z"
          fill={`url(#${a})`}
        />
        <path
          d="M4.5 16.8h12.4c.4 0 .7-.2.9-.5l1.7-2.1c.3-.4 0-1-.5-1H6.6c-.4 0-.7.2-.9.5L4 15.8c-.3.4 0 1 .5 1Z"
          fill={`url(#${b})`}
        />
        <path
          d="M19.5 10.4H7.1c-.4 0-.7.2-.9.5L4.5 13c-.3.4 0 1 .5 1h12.4c.4 0 .7-.2.9-.5l1.7-2.1c.3-.4 0-1-.5-1Z"
          fill={`url(#${c})`}
        />
        <defs>
          <linearGradient
            id={a}
            x1="4"
            y1="6"
            x2="20"
            y2="18"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#9945FF" />
            <stop offset="1" stopColor="#14F195" />
          </linearGradient>
          <linearGradient
            id={b}
            x1="4"
            y1="6"
            x2="20"
            y2="18"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#9945FF" />
            <stop offset="1" stopColor="#14F195" />
          </linearGradient>
          <linearGradient
            id={c}
            x1="4"
            y1="6"
            x2="20"
            y2="18"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#9945FF" />
            <stop offset="1" stopColor="#14F195" />
          </linearGradient>
        </defs>
      </svg>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c4b5fd]">
        Solana
      </span>
    </span>
  );
}
