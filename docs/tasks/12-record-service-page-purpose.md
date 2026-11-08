# 12 · "Record a service" page — keep, rework, or kill?

## Problem (as reported)
User: "on Record a service page if we click on save service it's adding
the entry? why??"

What the page does today (`src/app/dashboard/motorbikes/[id]/service/page.tsx`):
1. Creates a `ServiceEvent` row (the entry).
2. Clears `lastNotified*` on any matching reminder — so the reminder stops
   showing as "due" and the counter resets.

This is the intended behaviour. The confusion is probably: **there are two
places that do the same thing** — this page, and "Mark done" inline on
each reminder card (reminders page). Two doors, one effect.

## The real question for the user

**Q1 — What's the role of `/service`?**
  (a) **Kill it.** "Mark done" on the reminders page is enough for 95% of
      cases. Record-service duplicates it and confuses UX. (Lazy choice.)
  (b) **Keep it, repurpose.** Use `/service` for *ad-hoc* services that
      don't have a matching reminder (e.g. one-off clutch cable replace).
      Drop the type picker; always `CUSTOM`. Won't clear any reminders.
  (c) **Keep as-is**, just add a confirmation modal before save so the user
      knows an entry will be created.

My recommendation: **(a) kill it.** The reminders page already lets users
Mark done, and task 13 is making that path better anyway. One mental model
beats two.

**Q2 — If kept (b or c), where does the user reach it from?**
  Currently reached how? Grep says only from the hero CTA buttons on the
  bike detail page. If repurposed, we should rename it in the UI
  ("Record a one-off service") to signal it's the escape hatch.

## Scope once answered
- **If (a):** delete `service/page.tsx`, remove `ROUTES.recordService`,
  remove any CTA to it, verify nothing else links.
- **If (b):** strip the type `<select>`, keep `CUSTOM` only, skip the
  reminder-clearing side effect, rename the page heading.
- **If (c):** just add the confirm modal from task 06 before save.

## Acceptance
- One clear answer in the project, no duplicated door.
- No accidental double-entries. (A single Save creates exactly one
  ServiceEvent — this is already the case; the confusion was UX, not a
  bug.)
