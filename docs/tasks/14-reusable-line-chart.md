# 14 · Reusable `<LineChart>` component (shared primitive)

## Context
This is the primitive **task 08** and **task 15** both depend on. Carve it
out as its own task so the chart gets reviewed once.

## Reference
Images #18 / #19: smooth area/line, gradient fill, hover tooltip anchored
to a vertical guide, point marker at hover position.

## Component API
```tsx
<LineChart
  data={[{ x: "Jan", y: 32.4 }, ...]}
  seriesLabel="km / L"
  format={(y) => y.toFixed(1)}
  yPrefix=""
  ySuffix=" km/L"
  height={240}
  rangeToggle={              // optional
    { options: ["Month", "Year"], value, onChange }
  }
/>
```

## Library
Default proposal: **recharts** (see task 08 question 3). If the project
decides on hand-rolled SVG instead, do that here and tasks 08 / 15 get
the win for free.

## Styling
- Match the mock: gradient fill fading to transparent at bottom.
- Line stroke uses `--brand-500` by default; props can override.
- Dark-mode first — pair every surface class with its `dark:` variant.
- Tooltip positioned inside the card; truncate / wrap long labels.

## Empty state
When `data.length === 0`, render:
```
<div className="flex h-60 items-center justify-center text-sm text-muted">
  No data yet — log a few entries to see the trend.
</div>
```

## Loading / streaming
If a parent needs async data, use Suspense + a skeleton. The component
itself is purely presentational — it takes data in, renders chart out.

## Server rendering note
If recharts explodes on SSR (it uses `window` for sizing), wrap with
`next/dynamic` + `{ ssr: false }` at the usage site only, not inside the
component.

## Acceptance
- Lives at `src/components/LineChart.tsx`.
- No data fetching inside.
- Used by task 08 (fuel) and task 15 (expenses).
- Looks visually close to the reference mocks.

## Out of scope
- Bar chart, pie chart. If needed later, separate components with a
  shared `ChartShell` for axes.
