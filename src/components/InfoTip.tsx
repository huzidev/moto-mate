"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * Tiny ? icon that reveals a tooltip on hover or keyboard focus.
 * Pure Tailwind — ponytail: swap to Radix popover only if positioning
 * gets painful (e.g. overflow clipping inside a card).
 */
export function InfoTip({
  children,
  label = "More info",
}: {
  children: ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border-strong)] text-[10px] font-semibold leading-none text-[var(--muted)] transition hover:border-brand-500 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute right-0 top-full z-20 mt-2 w-max max-w-xs rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-normal text-[var(--foreground)] shadow-md"
        >
          {children}
        </span>
      )}
    </span>
  );
}
