# 00 · Shipped — what landed and where

All 17 planned tasks shipped, plus mid-course corrections. Numeric files
(`01-…` through `17-…`) are the original plans; this is the result log.

## Tasks

| # | Task | Commit | Notes |
|---|------|--------|-------|
| 01 | Header profile menu | `e2afd59` | Avatar + dropdown. Commit grouped with the docs by a repo hook. |
| 02 | Edit past logs | `3291d97` | `<EditLink>` + dedicated edit routes for odometer / fuel / service. |
| 03 | Pending submit button + select caret | `3258583` → `7ed360e` | `<SubmitButton>` via `useFormStatus`; caret moved to plain CSS after Tailwind JIT choked on the data URL. |
| 04 | `<Select>` wrapper | `9f0e25c` | Zero raw `<select>` in `src/app/**`. |
| 05 | Live lifetime-km preview | `9e0d354` | `LogTripForm` client leaf; server page passes `lifetimeKm` + action. |
| 06 | `Modal` + `ConfirmModal` | `63d0e82` | Child-as-trigger via `cloneElement`. Delete reminder was first user. |
| 07 | Service counters, cap at 3 | `8d250e6` | Server-side sort due → soon → ok; `<ServiceCounterList>` client toggle. |
| 08 | Fuel chart (km/L) | `a71341d` | Month/year toggle, null-gap bucketing. |
| 09 | `<InfoTip>` for "across N logs" | `1fb5e7d` | Replaced noisy muted line with a `?` icon. |
| 10 | Edit bike details | `b4bcb56` | Exposes `plate` + `city` that `new/page.tsx` never offered. |
| 11 | `<BackLink>` | `8f51236` | 8 copies collapsed; "Cancel" outliers on log + new conformed. |
| 12 | `/service` reversal | `2f875b2` then `a1223e0` | Killed, then restored — reminders-only path left no clean way to log one-off services. |
| 13 | Reminders redesign | `0e194e7` | URL filter tabs, state-aware cards, `<MarkDoneBlock>` w/ confirm. **Debt:** file is ~480 lines. |
| 14 | `<LineChart>` primitive | `c061156` | Built before 08 at user's call. Later gained `mini` + `yFormat` props. |
| 15 | Expense tracker | `835f915` | New `Expense` model + `/expense` create/edit + chart. **Needs migration** (see below). |
| 16 | Chart placement | `82778db` → `2399b43` | Started hybrid (mini inline + `/analytics`), landed on no-mini + per-section `View analytics →` buttons. |
| 17 | Delete rows | `ffaff00` | `<DeleteRowButton>` + 4 scoped server actions in `src/lib/log-actions.ts`. |

## Mid-course corrections

- **Task 03 CSS fix** (`7ed360e`) — Tailwind JIT can't parse `bg-[url("data:image/svg+xml;utf8,<…>")]`; the chevron moved to `.select-chevron` in `globals.css`.
- **Task 12 reversal** (`a1223e0`) — "Mark done on reminders only" sounded clean but left no path for one-off services. `/service` restored.
- **Task 15 chart error** (`9080e45`) — Server Component can't pass a `format` lambda to a Client Component. Added `yFormat: "decimal" | "integer"` as a serializable alternative.
- **Task 16 mini charts dropped** (`2399b43`) — `<LineChart>` with a single non-null point renders nothing visible, and the empty-state card was more noise than value. Charts now live only on `/analytics`.
- **Service history "Mark done" button** (`b78e373`) — leftover from task 12's first pass; removed.

## New components introduced

`UserMenu`, `EditLink`, `SubmitButton`, `Select`, `LogTripForm`, `Modal` / `ConfirmModal`, `ServiceCounterList`, `LineChart`, `FuelChart`, `ExpenseChart`, `InfoTip`, `BackLink`, `MarkDoneBlock`, `DeleteRowButton`.

Plus one shared action module: `src/lib/log-actions.ts` (four typed deletes).

## New routes

`/dashboard/profile`, `/dashboard/motorbikes/[id]/edit`, `/dashboard/motorbikes/[id]/log/[logId]`, `/…/fuel/[fuelId]`, `/…/service/[eventId]`, `/…/expense`, `/…/expense/[expenseId]`, `/…/analytics`.

## Punch list still open

1. **Expense migration** — repo doesn't use Prisma migrations. Applied locally via `prisma db push`. For a prod deploy, baseline the schema first (snippet in task 15 commit's follow-up conversation).
2. **`reminders/page.tsx` is ~480 lines** — ponytail comment in commit `0e194e7` proposes a split into `ReminderCard` / `AddReminderForm` / `FilterBar` next time it's touched.
3. **Commit `e2afd59`** bundled 17 task-plan docs with task 01's implementation under "plans generated - phase 2" — a local repo hook did that. Cosmetic.

## Dependencies added

- `recharts ^3.10.1` (task 14).

Nothing else.
