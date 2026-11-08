# 05 · Show current lifetime km on the log-trip page

## Problem
Image #8: `/dashboard/motorbikes/[id]/log` asks for "Kilometers ridden"
(delta) but never shows the user their **current** lifetime total — so it
feels disconnected from the source of truth on the bike detail page.

## Goal
Above or next to the input, show the current lifetime km as context:

```
Current lifetime: 2,473 km  →  after this log: 2,593 km
```

Second half updates live as the user types.

## Implementation
- `log/page.tsx` already fetches the bike; also fetch
  `prisma.odometerLog.aggregate({ _sum: { km: true } })` scoped to
  `motorbikeId`.
- Pass `lifetimeKm` into a small client component that:
  - renders the static "Current lifetime: X km"
  - watches the `km` input and renders "after this log: X + delta"
- Live client bit is tiny — a `useState` + `onChange` on the input is enough.
  Could promote the whole form to a client component OR wrap just the hint
  in one and read the input via `useId` / ref. Prefer: make the form a
  client component since the submit-button task (03b) already needs client
  wrappers.

## Acceptance
- Page shows current total prominently.
- "After this log" number updates as user types.
- Zero empty-state math (if no previous logs, lifetime = 0, still renders).

## Out of scope
- Showing per-trip average or similar — vision doc keeps logging to 10s max.
