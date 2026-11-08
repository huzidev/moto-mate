import type { Expense } from "@prisma/client";
import type { LineChartPoint } from "@/components/LineChart";

export type ExpenseStats = {
  count: number;
  totalSpent: number;
  lastSpent: Expense | null;
};

export function computeExpenseStats(expenses: Expense[]): ExpenseStats {
  const count = expenses.length;
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const lastSpent = expenses.length
    ? [...expenses].sort((a, b) => b.spentAt.getTime() - a.spentAt.getTime())[0]
    : null;
  return { count, totalSpent, lastSpent };
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;

/** Bucket expenses by month (last 12) or year (first expense → now). */
export function bucketExpensesForChart(
  input: Expense[],
  mode: "month" | "year",
): LineChartPoint[] {
  if (input.length === 0) return [];
  const sorted = [...input].sort((a, b) => a.spentAt.getTime() - b.spentAt.getTime());

  const buckets = new Map<string, number>();
  for (const e of sorted) {
    const key = bucketKey(e.spentAt, mode);
    buckets.set(key, (buckets.get(key) ?? 0) + e.amount);
  }

  const now = new Date();
  const axis: string[] = [];
  if (mode === "month") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      axis.push(bucketKey(d, "month"));
    }
  } else {
    const firstYear = sorted[0].spentAt.getFullYear();
    for (let y = firstYear; y <= now.getFullYear(); y++) {
      axis.push(String(y));
    }
  }

  return axis.map((key) => {
    const total = buckets.get(key);
    return { x: labelFor(key, mode), y: total ?? null };
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
