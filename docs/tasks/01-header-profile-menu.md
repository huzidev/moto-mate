# 01 · Header profile menu

## Problem
Current header (`src/app/dashboard/layout.tsx:19-36`) shows the user's name as
plain text next to a "Sign out" button. Looks unfinished and wastes space.

## Goal
Replace name + button with a round **profile avatar** on the right. Clicking
(or hovering, see decision) opens a small menu.

## Menu contents (first cut)
- Header strip: `Hi, {firstName}` + email underneath, muted.
- `Profile` → `/dashboard/profile` (new stub page: name, email, phone, maybe
  password change later — just a shell for now, real fields can come in a
  later task).
- `Garage` → `ROUTES.dashboard` (only shown when not already there).
- `Sign out` → calls existing `doSignOut` server action.

Add route constants: `ROUTES.profile = "/dashboard/profile"`.

## Avatar
- Circle, 32–36px, `bg-brand-500/15`, brand-500 text, initials from name
  (`"HI"` from `Huzaifa Iqbal`) or first letter of email as fallback.
- No image upload yet — initials only. ponytail: swap for uploaded photo
  when Cloudinary user-avatars land.

## Behaviour
- Click to toggle (not hover — hover menus are flaky on touch, and the user
  said "on hover" but click-menus are the convention; call this out when
  reviewing).
- Close on outside click + `Escape`.
- Keyboard focusable, `aria-haspopup="menu"`, menu items are `<Link>` /
  `<button>`.

## Files to touch
- `src/app/dashboard/layout.tsx` — swap right-side block for `<UserMenu … />`.
- `src/components/UserMenu.tsx` — new client component. Props: `name`,
  `email`, `onSignOut` (server action form).
- `src/constants/index.ts` — add `ROUTES.profile`.
- `src/app/dashboard/profile/page.tsx` — new stub page: read-only name /
  email / phone, "edit coming soon" placeholder.

## Acceptance
- Header right side is an avatar only.
- Menu opens, shows greeting + options, closes on outside click & Escape.
- `Sign out` still calls the server action.
- No full session passed to client — only `name` + `email`.

## Out of scope
- Avatar image upload.
- Actual profile editing (fields are read-only in this task).
