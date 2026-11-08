# 06 · Reusable confirm modal

## Problem
Image #9: "Delete reminder" is a plain text link that nukes data on click.
No confirmation. Same risk will apply to deleting logs (task 17) and other
destructive actions.

## Goal
One **reusable** modal primitive used by every destructive / confirming
action in the app.

## API (minimal, sufficient)
```tsx
<ConfirmModal
  open={open}
  onClose={() => setOpen(false)}
  title="Delete reminder?"
  description="This clears the oil-change reminder. It can be re-added later."
  confirmLabel="Delete"
  confirmVariant="danger"   // uses existing Button variants
  onConfirm={async () => { ... }}   // async, handles pending state
/>
```

Also expose `<Modal>` (same primitive without the confirm/cancel wiring)
for later generic use (edit forms from task 02 can reuse this).

## Implementation
- `src/components/Modal.tsx` — client component.
- Backdrop: `fixed inset-0 bg-black/60 backdrop-blur-sm`.
- Panel: centered card using existing `<Card>`.
- Close on backdrop click + `Escape` + "Cancel" button.
- Focus trap: small enough to roll our own with a `useEffect` that focuses
  the first button on open; full trap is overkill for 2-button dialogs.
  ponytail: add a real focus trap library only if a modal grows to a real
  form.
- No animation library — Tailwind `transition` + `opacity`/`scale` classes
  toggled on `open`.

## Wiring
- Delete-reminder button on `reminders/page.tsx` becomes a client
  component that opens `<ConfirmModal>` and calls the existing
  `deleteReminder` server action on confirm.
- Same modal reused by: Mark done (task 13), delete log/fuel/service
  (task 17).

## Acceptance
- Delete reminder requires a modal confirmation.
- Modal closes on backdrop click, Escape, or Cancel.
- Server action only fires on explicit Delete.
- Component is reused by at least one other feature in the same PR / task.

## Out of scope
- Toast notifications. Server actions + `revalidatePath` are the feedback
  channel for now.
