# 02 · Edit past logs (fuel, trip, service)

## Problem
Image #3 shows fuel entries with wrong values (e.g. a trailing `· 1,000`
with no meaning) and no way to correct them. Also applies to odometer
trips and service events.

## Goal
Each row in the three history lists on the bike detail page
(`src/app/dashboard/motorbikes/[id]/page.tsx`) gets an **edit** affordance.
Clicking opens an edit form (modal or `/edit` route — see decision) with the
same fields as the "add" form, pre-filled.

## Scope (per entity)
- **OdometerLog**: edit `km` (delta), `note`. Changing `km` recomputes
  lifetime on next render (no stored total to update).
- **FuelLog**: edit `liters`, `totalCost`, `atLifetimeKm`, `filledAt`, `note`.
- **ServiceEvent**: edit `type`, `label`, `atLifetimeKm`, `performedAt`,
  `note`.

## UI pattern
- Row shows an **edit** icon button (pencil) on the right, next to delete
  (delete comes in task 17).
- Open an edit panel using the reusable modal from task 06. Same zod schema
  the create action uses, same `FormField`s.

## Server actions
Three new actions, same file-per-entity convention:
- `src/lib/motorbikes.ts` (or new `src/lib/logs.ts` if `motorbikes.ts` is
  already >150 lines) → `updateOdometerLog`, `updateFuelLog`,
  `updateServiceEvent`.
- Each: `auth()` re-check, ownership check via the join to Motorbike.userId,
  zod parse, `prisma.<model>.update`, `revalidatePath(ROUTES.motorbike(id))`.
- If editing a ServiceEvent changes `type`/`label`, re-run
  `clearNotificationsForServiceEvent` for the new combo.

## Side effects to not break
- Reminder "last done" readouts on the reminders page read ServiceEvents —
  edits to them should flow through on next render (they do, since those
  reads are per-request).
- Fuel rolling average is computed from FuelLogs — edits recompute on next
  render automatically.

## Acceptance
- Can edit each entry type from the bike detail page.
- Validation errors render inline; auth re-checked on the action.
- Edits appear on refresh without a hard reload (revalidatePath).

## Out of scope
- Delete (task 17).
- Bulk edit / multi-select.
- Edit history / audit trail.
