# 07 · Service counters: show max 3 + "Show more"

## Problem
Image #10: a user with many reminders gets a long wall of service-counter
cards on the bike detail page.

## Goal
On the bike detail page (`src/app/dashboard/motorbikes/[id]/page.tsx`),
render **at most 3** counter cards by default. If more exist, show a
`Show more (N)` button that reveals the rest.

## Ordering
Priority order so the most urgent surface first:
1. Status `due` (overdue / zero or negative remaining).
2. Status `soon` (inside `SERVICE_DEFAULTS.reminderWindowKm`).
3. Status `ok`, nearer to due first.

## Implementation
- Compute the status + sort server-side (same place the counters are built
  today).
- Split into `primary` (first 3) and `rest`.
- Small client component `<ServiceCounterList primary={…} rest={…} />` —
  renders primary unconditionally; renders rest when `showAll` toggled.
- Button label: `Show more (3)` → clicked → `Show less`.

## Acceptance
- ≤ 3 cards shown by default.
- "Show more" reveals every remaining counter.
- Sort: due → soon → ok (verified by seeding one of each).
- `Configure` button placement unchanged.

## Out of scope
- Pagination, virtualization. User-level counter counts max out at ~10.
