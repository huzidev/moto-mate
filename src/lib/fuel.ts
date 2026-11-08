import type { FuelLog } from "@prisma/client";
import type { LineChartPoint } from "@/components/LineChart";

export type FuelStats = {
  logs: FuelLog[];                   // sorted ascending by atLifetimeKm
  totalLiters: number;               // sum of fillups counted toward mileage (excludes first)
  totalCost: number | null;          // sum where recorded, null if nothing recorded
  totalKmCovered: number;            // last.atLifetimeKm - first.atLifetimeKm
  rollingKmPerLiter: number | null;  // null when < 2 fillups or 0 liters
  lastTankKmPerLiter: number | null; // mileage of the most recent tank only
};

/**
 * Standard "fill-to-full" tank-to-tank mileage.
 * The first fillup is a baseline — its liters are not counted (we don't know what
 * km those liters covered). Each later fillup's liters represent what refilled the
 * tank for (this.atLifetimeKm - prev.atLifetimeKm) km of riding.
 */
export function computeFuelStats(input: FuelLog[]): FuelStats {
  const logs = [...input].sort((a, b) => a.atLifetimeKm - b.atLifetimeKm);
  const base: FuelStats = {
    logs,
    totalLiters: 0,
    totalCost: null,
    totalKmCovered: 0,
    rollingKmPerLiter: null,
    lastTankKmPerLiter: null,
  };
  if (logs.length === 0) return base;

  // Cost: sum whatever's recorded across ALL logs. Fine to include the first.
  const costed = logs.filter((l) => l.totalCost != null);
  const totalCost = costed.length ? costed.reduce((s, l) => s + (l.totalCost ?? 0), 0) : null;

  if (logs.length < 2) return { ...base, totalCost };

  const first = logs[0];
  const last = logs[logs.length - 1];
  const prev = logs[logs.length - 2];

  // Excludes first.liters by design.
  const totalLiters = logs.slice(1).reduce((s, l) => s + l.liters, 0);
  const totalKmCovered = Math.max(0, last.atLifetimeKm - first.atLifetimeKm);
  const rollingKmPerLiter = totalLiters > 0 ? totalKmCovered / totalLiters : null;

  const lastTankKm = Math.max(0, last.atLifetimeKm - prev.atLifetimeKm);
  const lastTankKmPerLiter = last.liters > 0 ? lastTankKm / last.liters : null;

  return {
    logs,
    totalLiters,
    totalCost,
    totalKmCovered,
    rollingKmPerLiter,
    lastTankKmPerLiter,
  };
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;

/**
 * Bucket fuel logs into km/L per month (last 12 months) or per year (first log → now).
 * First log is a baseline; its liters don't get bucketed (we don't know what km those
 * liters covered). Buckets with no data become null so the chart draws gaps.
 */
export function bucketFuelForChart(input: FuelLog[], mode: "month" | "year"): LineChartPoint[] {
  const sorted = [...input].sort((a, b) => a.atLifetimeKm - b.atLifetimeKm);
  if (sorted.length < 2) return [];

  const buckets = new Map<string, { liters: number; km: number }>();
  for (let i = 1; i < sorted.length; i++) {
    const log = sorted[i];
    const prev = sorted[i - 1];
    const deltaKm = Math.max(0, log.atLifetimeKm - prev.atLifetimeKm);
    const key = bucketKey(log.filledAt, mode);
    const b = buckets.get(key) ?? { liters: 0, km: 0 };
    b.liters += log.liters;
    b.km += deltaKm;
    buckets.set(key, b);
  }

  const now = new Date();
  const axis: string[] = [];
  if (mode === "month") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      axis.push(bucketKey(d, "month"));
    }
  } else {
    const firstYear = sorted[0].filledAt.getFullYear();
    for (let y = firstYear; y <= now.getFullYear(); y++) {
      axis.push(String(y));
    }
  }

  return axis.map((key) => {
    const b = buckets.get(key);
    const y = b && b.liters > 0 ? b.km / b.liters : null;
    return { x: labelFor(key, mode), y };
  });
}

function bucketKey(d: Date, mode: "month" | "year") {
  return mode === "month"
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    : String(d.getFullYear());
}

function labelFor(key: string, mode: "month" | "year") {
  if (mode === "year") return key;
  const [, mm] = key.split("-");
  return MONTH_NAMES[parseInt(mm, 10) - 1];
}
