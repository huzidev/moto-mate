"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type LineChartPoint = { x: string; y: number | null };

const BRAND = "#f97316";

/**
 * Generic area/line chart. Data in, chart out. Shared by fuel (task 8) and
 * expenses (task 15). ponytail: recharts' Tooltip API is config-only, no
 * className hook — so contentStyle/itemStyle/labelStyle are necessary here
 * and are the only style objects in the repo.
 */
export function LineChart({
  data,
  seriesLabel,
  format,
  yPrefix = "",
  ySuffix = "",
  height,
  color = BRAND,
  emptyLabel = "No data yet — log a few entries to see the trend.",
  mini = false,
}: {
  data: LineChartPoint[];
  seriesLabel: string;
  format?: (y: number) => string;
  yPrefix?: string;
  ySuffix?: string;
  height?: number;
  color?: string;
  emptyLabel?: string;
  /** Teaser mode: no axes/grid/tooltip, shorter default height. */
  mini?: boolean;
}) {
  const gradientId = useId();
  const fmt = format ?? ((y: number) => y.toFixed(1));
  const effectiveHeight = height ?? (mini ? 80 : 240);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--muted)]"
        style={{ height: effectiveHeight }}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div style={{ height: effectiveHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={mini ? { top: 2, right: 2, left: 2, bottom: 2 } : { top: 10, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {!mini && (
            <>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="x"
                stroke="var(--muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${yPrefix}${fmt(Number(v))}${ySuffix}`}
                width={44}
              />
              <Tooltip
                cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--foreground)",
                }}
                labelStyle={{ color: "var(--muted)" }}
                itemStyle={{ color: "var(--foreground)" }}
                formatter={(value) => [`${yPrefix}${fmt(Number(value))}${ySuffix}`, seriesLabel]}
              />
            </>
          )}
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
