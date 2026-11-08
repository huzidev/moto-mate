"use client";

import { useState } from "react";
import { LineChart, type LineChartPoint } from "./LineChart";

type Mode = "month" | "year";

export function FuelChart({
  monthData,
  yearData,
}: {
  monthData: LineChartPoint[];
  yearData: LineChartPoint[];
}) {
  const [mode, setMode] = useState<Mode>("month");
  const data = mode === "month" ? monthData : yearData;

  return (
    <div>
      <div className="mb-3 flex justify-end gap-1">
        <ToggleBtn active={mode === "month"} onClick={() => setMode("month")}>
          Month
        </ToggleBtn>
        <ToggleBtn active={mode === "year"} onClick={() => setMode("year")}>
          Year
        </ToggleBtn>
      </div>
      <LineChart
        data={data}
        seriesLabel="km / L"
        ySuffix=" km/L"
        format={(y) => y.toFixed(1)}
        emptyLabel="Not enough data yet — log a second fillup to see a trend."
      />
    </div>
  );
}

function ToggleBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md px-3 py-1 text-xs font-medium transition " +
        (active
          ? "bg-brand-500 text-white"
          : "text-[var(--muted)] hover:bg-[var(--surface-muted)]")
      }
    >
      {children}
    </button>
  );
}
