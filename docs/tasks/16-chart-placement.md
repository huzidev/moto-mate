# 16 · Where do charts live?

## Problem
Fuel chart (task 08) and expense chart (task 15) both need a home. Two
reasonable homes:

**A — Inline on the bike detail page.**
Each section (Fuel economy, Expenses) gets its own chart above / between
the stat cards and the history list.
- Pros: one page, zero navigation, matches current layout.
- Cons: page gets long. We're already past the 150-line budget on
  `motorbikes/[id]/page.tsx` (284 lines). More content = more splitting.

**B — Dedicated analytics route.**
`src/app/dashboard/motorbikes/[id]/analytics/page.tsx`, tabbed:
`Fuel` · `Expenses` · (later) `Service frequency`.
- Pros: analytics stays separate from "here's the state of my bike". Bike
  detail stays scannable.
- Cons: extra click. Multi-tab shell needed.

## Recommendation
**C — Hybrid.**
- Inline a **compact mini-chart** (120px high, no axis labels) on bike
  detail per section, teaser-style.
- "View analytics" link from each section → analytics page with the full
  chart, toggles, tooltips.

Low-cost, matches the pattern dashboards tend to converge to.

## Open question for the user
Please pick A, B, or C before task 08 / 15 chart placement work starts.

- If **A**: skip the analytics route, do everything inline.
- If **B**: scaffold `/analytics` with tabs; bike detail links to it.
- If **C**: both. Mini-chart inline + full view on `/analytics`.

## Routes (if B or C)
- `ROUTES.analytics(id) = "/dashboard/motorbikes/${id}/analytics"`.

## Acceptance (once picked)
- Decision captured in this file and reflected in tasks 08 and 15.
- No duplicate chart code across inline and full views (both use the
  same `<LineChart>` from task 14).

## Out of scope
- Cross-bike analytics (multi-bike dashboard). Vision doc = single user,
  likely one bike at a time; revisit when a second bike exists.
