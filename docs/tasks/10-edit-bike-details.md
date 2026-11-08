# 10 · Edit bike details (name, make, model, year, plate, city, image)

## Problem
Image #12: bike header shows `Suzuki GS150 · Suzuki · Gs150 · 2019`. User
enters these at `Add bike` but there's no way to edit later.

## Goal
Edit the Motorbike row. Same fields as `new/page.tsx`:
`name`, `make`, `model`, `year`, `plate?`, `city?`, `imageUrl?`.

## UI
- On the bike detail page, "Configure" sits next to service counters.
  Add a small **pencil icon** next to the bike name in the hero, or an
  `Edit bike` link under "Configure". Pick one — pencil-next-to-name is
  the clearer affordance.
- Open an edit form:
  - Route: `src/app/dashboard/motorbikes/[id]/edit/page.tsx` (RSC page,
    identical form to `new/page.tsx`, pre-filled).
  - Add `ROUTES.editMotorbike(id)`.

## Server action
- `editMotorbike(formData)` in `src/lib/motorbikes.ts`:
  - `auth()` re-check.
  - Ownership check.
  - zod schema (import / share with `addMotorbike` if feasible — DRY).
  - `prisma.motorbike.update`.
  - `revalidatePath(ROUTES.motorbike(id))`.

## Out of scope
- `imageUrl` upload UI (depends on Cloudinary — overview flags that as
  not built yet). For this task: a plain URL text field is fine, or hide
  the field until Cloudinary lands. Prefer **hide** to avoid a dead-looking
  field.
- Delete bike (separate task — scope later).

## Acceptance
- From bike detail, user clicks pencil → lands on `/edit` → sees pre-filled
  form → saves → returns to detail with updated fields rendered.
- Form reuses the same `FormField`s and zod schema as `new/page.tsx` —
  same validation ceiling.
