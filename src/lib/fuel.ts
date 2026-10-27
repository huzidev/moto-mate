import type { FuelLog } from "@prisma/client";

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
