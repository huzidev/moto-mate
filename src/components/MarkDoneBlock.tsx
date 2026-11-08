"use client";

import { useState } from "react";
import { FormField, inputClass } from "./FormField";
import { Button } from "./Button";
import { ConfirmModal } from "./Modal";

export function MarkDoneBlock({
  reminderId,
  reminderLabel,
  defaultKm,
  defaultDate,
  action,
}: {
  reminderId: string;
  reminderLabel: string;
  defaultKm: number;
  defaultDate: string; // YYYY-MM-DD
  action: (
    reminderId: string,
    atLifetimeKm: number,
    performedAt: string,
  ) => Promise<void> | void;
}) {
  const [km, setKm] = useState<number>(defaultKm);
  const [date, setDate] = useState<string>(defaultDate);

  return (
    <div className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
      <FormField label="Done at (km)" htmlFor={`doneKm-${reminderId}`}>
        <input
          id={`doneKm-${reminderId}`}
          type="number"
          min={0}
          max={10000000}
          required
          value={km}
          onChange={(e) => setKm(Number(e.target.value) || 0)}
          className={inputClass}
        />
      </FormField>
      <FormField label="On date" htmlFor={`doneAt-${reminderId}`}>
        <input
          id={`doneAt-${reminderId}`}
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={defaultDate}
          className={inputClass}
        />
      </FormField>
      <ConfirmModal
        title="Mark done?"
        description={
          <>
            Mark{" "}
            <strong className="text-[var(--foreground)]">{reminderLabel}</strong>{" "}
            done at{" "}
            <strong className="tabular-nums text-[var(--foreground)]">
              {km.toLocaleString()} km
            </strong>{" "}
            on <strong className="text-[var(--foreground)]">{date}</strong>?
          </>
        }
        confirmLabel="Mark done"
        onConfirm={() => action(reminderId, km, date)}
      >
        <Button type="button" size="md">
          Mark done
        </Button>
      </ConfirmModal>
    </div>
  );
}
