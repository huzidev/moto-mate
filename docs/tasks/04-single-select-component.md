# 04 · DRY: one styled `<Select>` component

## Problem
Image #7 shows the custom-reminder "Type" dropdown has the same oversized-
caret problem. Fixing it per-file is three-strikes bait.

## Goal
Introduce **one** reusable `<Select>` component. All `<select>` usages in
the app go through it. Fixing the caret once fixes it everywhere.

## Implementation
- `src/components/Select.tsx` — thin wrapper over the native element:
  ```tsx
  export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
    return <select {...props} className={cn(selectClass, props.className)} />;
  }
  ```
- `selectClass` = `inputClass` + arrow styles from task 03a.
- Replace raw `<select>` in:
  - `src/app/dashboard/motorbikes/[id]/service/page.tsx` (service type)
  - `src/app/dashboard/motorbikes/[id]/reminders/page.tsx` (custom reminder
    type)
  - any other hits a grep for `<select` surfaces.

## Why not merge with FormField
FormField is the label+hint wrapper. Select is the input itself. Different
responsibility — merging bloats FormField.

## Acceptance
- Zero direct `<select>` in `src/app/**` (grep check).
- Visual: both dropdowns render identical caret styling.
- Keyboard + screen reader behaviour unchanged (native element preserved).

## Out of scope
- Custom combobox with search. Native is fine for ≤ 10 options.
