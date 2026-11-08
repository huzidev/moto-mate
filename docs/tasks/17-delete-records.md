# 17 · Delete records (odometer logs, fuel logs, service events, expenses)

## Problem
Companion to task 02 (edit). Users mistype; they need to delete bad rows.
No delete today for logs/fuel/services.

## Goal
Each row in each history list on the bike detail page gets a **delete**
button next to the edit button from task 02.

## UX
- Icon button (trash), right-aligned next to edit.
- Click → opens `<ConfirmModal>` from task 06 with `danger` variant:
  > "Delete this fuel entry? This can't be undone."
  Confirm → server action → `revalidatePath`.

## Server actions
Add to the existing lib files (or `src/lib/logs.ts` if we grouped there in
task 02):

- `deleteOdometerLog(id)` — `auth()`, ownership via join, `prisma.odometerLog.delete`.
- `deleteFuelLog(id)`
- `deleteServiceEvent(id)` — also call `clearNotificationsForServiceEvent`
  with its old type/label after delete? Actually: if we delete a service
  event, reminder "last done" metrics regenerate from remaining events,
  so no clear needed. BUT if this was the only event clearing a reminder's
  `lastNotifiedAt/Km`, the next cron tick may re-fire an email. Accept
  that — re-firing is correct behaviour after the "last done" disappears.
- `deleteExpense(id)` (from task 15)
- `deleteMotorbike(id)` — optional; punt unless asked. Note: Prisma schema
  has `onDelete: Cascade` on related rows, so a bike delete nukes
  everything.

Each: `revalidatePath(ROUTES.motorbike(bikeId))`.

## Acceptance
- Delete button on every history row for every entity.
- Confirmation modal (reused from task 06) required.
- Deletes propagate to derived state (lifetime km, rolling avg, counters)
  on next render.

## Out of scope
- Soft delete / undo. If needed later, add a `deletedAt` column and
  filter — but YAGNI for a single-user app.
- Bulk delete.
