"use client";

import { useState } from "react";
import { Card } from "./Card";

export type CounterItem = {
  id: string;
  typeLabel: string;
  intervalKm: number;
  sinceKm: number;
  sinceDays: number | null;
  status: "due" | "soon" | "ok";
};

const statusStyle: Record<CounterItem["status"], string> = {
  due: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  soon: "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  ok: "bg-[var(--surface-muted)] text-[var(--muted)]",
};

const barColor: Record<CounterItem["status"], string> = {
  due: "bg-red-500",
  soon: "bg-brand-500",
  ok: "bg-[var(--border-strong)]",
};

const PREVIEW = 3;

export function ServiceCounterList({ counters }: { counters: CounterItem[] }) {
  const [showAll, setShowAll] = useState(false);

  if (counters.length === 0) {
    return (
      <Card padding="md" className="mt-4 text-sm text-[var(--muted)]">
        No active reminders. Add some to get notified.
      </Card>
    );
  }

  const hiddenCount = Math.max(0, counters.length - PREVIEW);
  const visible = showAll || hiddenCount === 0 ? counters : counters.slice(0, PREVIEW);

  return (
    <>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((c) => {
          const pct = Math.min(100, Math.round((c.sinceKm / c.intervalKm) * 100));
          return (
            <li key={c.id}>
              <Card padding="md">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.typeLabel}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle[c.status]}`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="mt-3 text-xs text-[var(--muted)]">
                  <span className="tabular-nums text-[var(--foreground)]">
                    {c.sinceKm.toLocaleString()}
                  </span>{" "}
                  / {c.intervalKm.toLocaleString()} km
                  {c.sinceDays != null && <> · {c.sinceDays}d</>}
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                  <div
                    className={`h-full transition-all ${barColor[c.status]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
      {hiddenCount > 0 && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="text-xs font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            {showAll ? "Show less" : `Show more (${hiddenCount})`}
          </button>
        </div>
      )}
    </>
  );
}
