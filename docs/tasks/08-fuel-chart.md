# 08 · Fuel chart (graphical view)

## Problem
Fuel history today is a flat list. User wants a **chart** — month + year
views, smooth transitions, looking like image #18 / #19.

## Shape (proposed, needs sign-off — see questions)
- Chart type: area/line with soft gradient fill, à la the screenshots.
- X axis: time bucket (month or year depending on view).
- Y axis: **km / L** by default (fuel economy is the thing the user
  actually cares about per vision doc). Secondary candidates below.
- Range toggle: `Month` (last 12 months by month) · `Year` (lifetime by
  year).
- Hover tooltip: bucket label + value, like the mock.

## Component plan
- `src/components/LineChart.tsx` — generic, reusable. Props:
  `data: { x: string; y: number }[]`, `label`, `format?: (y)=>string`.
  Shared across fuel (this task) and expense tracker (task 15) and any
  future metric.
- Library choice: see question 3 below. Default proposal: **recharts** —
  already a React-first solution, small bundle (~90kb gz) relative to
  what it ships, SSR-friendly through `next/dynamic`.
- Chart lives on bike detail inside the Fuel economy card, under the stat
  row, above the history list. OR on a dedicated analytics page — see
  task 16.

## Data
- Server-fetch fuel logs for the bike.
- Bucket by month / year on the server. Compute km/L per bucket:
  - liters known per log
  - delta km per log (lifetime km diff between consecutive logs)
  - bucket = sum(delta km) / sum(liters)
- Empty buckets rendered as gaps (not zeros — a zero would imply "car
  used no fuel", not "no data").

## Open questions (please answer before I build)

**Q1 — Primary metric.** Y axis is one of:
  (a) km / L (fuel economy) — recommended
  (b) Liters consumed per bucket
  (c) Amount spent per bucket
  Or all three with a sub-tab?

**Q2 — Bucketing boundaries.** "Per month" means:
  (a) rolling last 12 months
  (b) current calendar year, month by month
  Which?

**Q3 — Library.**
  (a) recharts (recommended — easy, declarative, ~90kb)
  (b) visx / d3 (lower level, more control, bigger lift)
  (c) hand-rolled SVG (tiny, no deps, but we re-invent tooltips/gradients)

**Q4 — Placement.** Inline on the bike detail page, or a new
`/dashboard/motorbikes/[id]/analytics` route? Linked from task 16.

## Acceptance
- Reusable `<LineChart>` component.
- Fuel view has a month/year toggle.
- Hover tooltip matches the reference mock vibe.
- Empty state (0 logs) renders a friendly placeholder, not a broken chart.

## Out of scope
- Multiple series on one chart (yet).
- CSV export.
