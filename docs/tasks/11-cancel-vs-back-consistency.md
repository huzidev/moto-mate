# 11 · Match the "Cancel" button on Log a trip to the `← Back` style

## Problem
Image #14 / #15: every other subpage uses a muted `← {bike.name}` back link
in the top-left (see `service/page.tsx:83-87`). Only `log/page.tsx` has a
right-aligned "Cancel" text link. Inconsistent.

## Goal
Replace the "Cancel" link on `src/app/dashboard/motorbikes/[id]/log/page.tsx`
with the same back-link pattern used on `service/page.tsx`:

```tsx
<Link href={ROUTES.motorbike(id)} className="text-xs text-muted hover:text-foreground">
  ← {bike.name}
</Link>
```

Position it above the `<h1>`, not in the right corner.

## Checklist — audit all subpages while we're here
- `log/page.tsx` → fix.
- `fuel/page.tsx` → verify it matches.
- `service/page.tsx` → already correct.
- `reminders/page.tsx` → verify.
- `new/page.tsx` (add bike) → verify / add if missing.

Three or more copies of this snippet across files → extract to a tiny
`<BackLink href label />` in `src/components/BackLink.tsx` (three-strikes
applies).

## Acceptance
- Every bike subpage has the same back-link pattern in the same position.
- No "Cancel" button anywhere; back-link does the same job.

## Out of scope
- Browser-history-based back (`router.back()`). Explicit href is safer —
  clicking from a deep link shouldn't go to a previous origin.
