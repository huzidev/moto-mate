# 13 · Reminders page: filter, states, destructive styling, modal confirms

## Problems bundled
All from the reminders page (`src/app/dashboard/motorbikes/[id]/reminders/page.tsx`):

1. "Save" on each reminder confuses — Mark done barely feels like a button.
2. No destructive styling on "Delete reminder" (image #9).
3. No filter — can't hide inactive / already-done reminders.
4. For "done" reminders, Save/Edit and the Active checkbox are still
   visible but meaningless.
5. "Mark done" writes immediately with no confirm — easy to misfire.

## Goal — single cohesive redesign of this page

### 13a · Filter bar
Top of the Active-reminders section, add a small filter toggle:

- `All` · `Active` · `Inactive` (done)

"Done" in our model means `active: false` OR status is currently `ok` with
a recent `ServiceEvent`. Pick the simpler rule: filter by `active` flag.
("Done for this cycle" lives in the counter badge, not the filter.)

### 13b · State-aware card
- **Active reminder:** show interval + max-days fields, Save button, Mark
  done section, delete button.
- **Inactive reminder:** collapse to a compact row — name, last done,
  `Re-activate` button, delete button. No Save, no Mark done, no Active
  checkbox.

### 13c · Button styling
- `Delete reminder` → use the existing `danger` variant on `<Button>`
  (red, clearly destructive).
- `Mark done` → keep brand/primary — it's the positive action.
- `Save` → keep `secondary` — it's config, not progress.

### 13d · Confirm modals
- `Mark done` opens the task-06 `<ConfirmModal>`:
  > "Mark Oil change done at 150 km on 2026-11-08?"
  Confirm fires the server action.
- `Delete reminder` opens `<ConfirmModal>` with `danger` variant
  (shared from task 06).

### 13e · Remove "Active" checkbox from done cards
Only show the Active toggle when the card is in its expanded/active state.
A user can re-activate via the compact row's "Re-activate" button.

## Server actions involved
All already exist on the reminders page — no new actions needed. Just:
- Pass `confirmLabel`, `onConfirm` into shared modal.
- Wrap the inline forms in client wrappers so modal → `form.requestSubmit()`.

## Acceptance
- Filter toggle shows / hides active vs inactive.
- Inactive cards are compact with no Save / Mark done buttons.
- Delete and Mark done both require modal confirmation.
- Delete button is visually red/danger.
- Save button stays, but no longer looks primary on cards that are in a
  "nothing to save" state (optional polish: disable Save until a field
  changed — handled by task 03b's pending state wrapper if we add a
  `dirty` check; stretch, not required).

## Out of scope
- Replacing the reminders page with a calendar view.
- Per-reminder notification channel config (email only for now).
