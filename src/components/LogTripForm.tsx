"use client";

import { useState } from "react";
import { FormField, inputClass } from "./FormField";
import { SubmitButton } from "./SubmitButton";

export function LogTripForm({
  action,
  lifetimeKm,
}: {
  action: (formData: FormData) => void | Promise<void>;
  lifetimeKm: number;
}) {
  const [delta, setDelta] = useState<number>(0);
  const after = lifetimeKm + (Number.isFinite(delta) && delta > 0 ? delta : 0);

  return (
    <form action={action} className="space-y-5">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-muted">Current lifetime</span>
          <span className="font-medium tabular-nums">
            {lifetimeKm.toLocaleString()} km
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <span className="text-muted">After this log</span>
          <span className="font-semibold tabular-nums text-brand-500">
            {after.toLocaleString()} km
          </span>
        </div>
      </div>

      <FormField
        label="Kilometers ridden"
        htmlFor="km"
        required
        hint="How far you rode since your last log. Odometer resets don't matter — we only store deltas."
      >
        <input
          id="km"
          name="km"
          type="number"
          min={1}
          max={100000}
          required
          autoFocus
          placeholder="120"
          value={delta || ""}
          onChange={(e) => setDelta(Number(e.target.value) || 0)}
          className={inputClass}
        />
      </FormField>

      <FormField
        label="Note"
        htmlFor="note"
        hint="Optional — route, conditions, anything useful later."
      >
        <input
          id="note"
          name="note"
          maxLength={200}
          placeholder="City ride, light rain"
          className={inputClass}
        />
      </FormField>

      <SubmitButton full size="lg" pendingLabel="Saving…">
        Save log
      </SubmitButton>
    </form>
  );
}
