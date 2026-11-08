# 03 · Service-type select styling + pending state on forms

Two issues bundled because they live on the same page
(`src/app/dashboard/motorbikes/[id]/service/page.tsx`).

## 3a · The dropdown arrow is huge
Image #4: the native `<select>` renders with a jumbo caret because our
`inputClass` adds padding but no custom arrow treatment.

### Fix
- Add a `selectClass` (or `inputClass` variant) in `src/components/FormField.tsx`:
  - `appearance-none`
  - `bg-no-repeat bg-right`
  - inline SVG caret via Tailwind arbitrary value: `bg-[url('data:image/svg+xml;...')]`
  - right-side padding to make room (`pr-10`).
- Export and use it for every `<select>`: service page, reminders page
  custom-type picker.

## 3b · Save / Mark done buttons don't signal progress
Image #6: clicking "Save" or "Mark done" and nothing happens visibly →
users double-click, double-submit.

### Fix
- Add a tiny client wrapper around `<button type="submit">` that uses
  `useFormStatus()` to:
  - set `disabled` while `pending`
  - swap label to "Saving…" / "Marking…"
  - reduce opacity (`opacity-60 cursor-not-allowed`)
- Live in `src/components/SubmitButton.tsx`. Props: `children`, `pending?`
  (override), plus pass-through variants like existing `Button`.
- Replace plain `<Button type="submit">` across server-action forms:
  - log/page.tsx (Save log)
  - fuel/page.tsx (Log fuel)
  - service/page.tsx (Save service)
  - reminders/page.tsx (Save, Mark done, Add reminder)
  - new/page.tsx (Add motorbike)

## Acceptance
- No oversized caret on any `<select>`.
- Submit buttons disable + label-change during the server action.
- No duplicate submissions possible (button disabled prevents re-click).

## Out of scope
- Full form library (react-hook-form). ponytail: `useFormStatus` is enough
  until fields need cross-field validation beyond zod.
