# MotoMate — agent brief

Before writing or changing code in this repo, **read `docs/engineering.md`**.
It defines the conventions this project is built on and is not optional
context — it's the house style.

Short version of the rules (full detail in that doc):

- **Server-first.** React Server Components by default. `"use client"` only
  for genuine interactivity, and only at the leaf.
- **Mutations = Server Actions.** Route handlers only for webhooks / cron /
  external callers.
- **Session via `auth()`** from `src/lib/auth.ts`. Layout gates + action
  re-checks. Scope every user-owned query by `userId`.
- **Caching is explicit.** Opt in with `revalidate` / tags; invalidate with
  `revalidatePath` / `revalidateTag` after mutations.
- **File layout:** `app/` routes stay thin · `components/` presentational ·
  `hooks/` client logic · `lib/` server logic · `constants/` single source of
  truth for routes, labels, defaults · `types/` shared types.
- **DRY, three-strikes.** Duplicate twice; extract on the third. Shared
  values go in `constants/`, shared logic in `lib/` or `hooks/`.
- **File size budget ~150 lines.** If a file balloons, it's doing two things.
  Split it. No "god files".
- **Dependency ladder:** skip → reuse → stdlib → framework → installed dep →
  only then add a new package.
- **Validate all input with zod.** No `any`, no `as` casting on user input.
- **Tailwind only.** No CSS-in-JS, no inline style objects. Dark mode pairs
  with every surface class.
- **Mark deliberate shortcuts** with a `ponytail:` comment and the upgrade
  trigger, so future-you knows it's a decision, not an oversight.

Anti-patterns to refuse:

- Thousand-line page/component files.
- Client components fetching from `/api/*` when a parent RSC can pass the
  data down.
- Hard-coded route strings (`"/dashboard"` instead of `ROUTES.dashboard`).
- Adding a dependency without climbing the ladder.
- Instantiating `PrismaClient` anywhere other than `src/lib/prisma.ts`.

If a request would violate one of these, call it out and propose the
compliant version before coding.
