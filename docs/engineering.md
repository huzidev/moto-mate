# Engineering conventions

Read before writing code. These rules exist to keep the app fast and the
codebase small. Deviations need a reason.

## 1. Rendering: server-first, client only when interactive

- **Default to React Server Components.** Pages, layouts, data reads — all RSC.
  No `"use client"` unless the file needs state, effects, refs, browser APIs,
  or event handlers that can't be a `<form action={serverAction}>`.
- **Mutations go through Server Actions**, not route handlers, unless a third
  party needs to call the endpoint. Server actions keep the type contract and
  avoid hand-written fetch calls.
- **Route handlers (`app/api/.../route.ts`) only for:** webhooks, OAuth
  callbacks, cron targets, external integrations.
- **`"use client"` is a leaf, not a layout.** Keep client components small
  and push them to the edges of the tree. Pass data in as props; don't fetch
  from inside a client component when a parent RSC can hand it over.
- **Suspense + streaming** over blocking loaders. If a page has a slow
  section, wrap it in `<Suspense>` and let the rest ship first.
- **`loading.tsx` and `error.tsx`** at the segment level for free UX.

## 2. Caching and revalidation

- Default `fetch()` behavior is uncached in Next 15+. If something is safe to
  cache, opt in explicitly (`cache: "force-cache"` or `next: { revalidate: N }`).
- Use `unstable_cache` / `cacheTag` for expensive DB reads that don't change
  per-user. Tag them so a mutation can invalidate precisely.
- After a mutation in a server action, call `revalidatePath(...)` or
  `revalidateTag(...)` — not a full page reload.
- Never cache per-user data globally. Scope by user id in the key.

## 3. Sessions and auth

- Session is read on the server via `auth()` from `src/lib/auth.ts`. One
  source of truth.
- **Layout-level gates** (e.g. `src/app/dashboard/layout.tsx`) are the primary
  protection. Server actions re-check `auth()` as defense-in-depth before any
  write — a redirect in the layout doesn't stop a direct POST.
- Don't pass the full session to client components. Pass only the fields the
  client needs (usually just `email` or `name`).
- Session persistence is Auth.js database sessions via the Prisma adapter.
  Don't invent a parallel session system.

## 4. File organization

```
src/
  app/            routes only. Pages/layouts stay thin — move logic out.
  components/     presentational, props-driven, reusable. No data fetching.
  hooks/          client-side reusable logic (useX). Create when a hook is used in 2+ places.
  lib/            server-side utilities + shared logic. prisma, auth, resend, cloudinary, env, etc.
  constants/      hard-coded values (routes, labels, defaults). Single source of truth.
  types/          shared types + module augmentations (e.g. next-auth.d.ts).
prisma/           schema and migrations.
docs/             this folder.
```

Rule of thumb: if you need the same string, number, or route in two places,
it belongs in `constants/`. If the same logic shows up in two places, it
belongs in `lib/` (server) or `hooks/` (client).

## 5. DRY — but not before you need it

- **Three-strikes rule**: duplicate once, duplicate twice, extract on the
  third. Premature abstraction is worse than a little repetition.
- When extracting: name the function by *what it means*, not *how it works*
  (`getActiveBikeForUser`, not `queryBikesWhereActive`).
- Shared constants (routes, labels, defaults) go in `src/constants/`. Import
  them, don't retype them. `ROUTES.dashboard`, not `"/dashboard"`.
- Shared server logic goes in `src/lib/`.
- Shared client hooks go in `src/hooks/` — but only once there's a real
  second caller.

## 6. File size budget

- A page or component file should rarely exceed **~150 lines**. If it does,
  the file is probably doing two things. Split it: extract subcomponents to
  `components/`, data fetching to `lib/`, event handlers to `hooks/`.
- No single file should be the home of "everything about X". If `motorbike.ts`
  has the schema, the queries, the mutations, the formatters, and the
  renderer — break it up.
- Comments inside the file should explain *why*, never *what*. Well-named
  functions already say what.

## 7. The dependency ladder

Before adding a package, climb the ladder:

1. Can we skip the feature entirely? (YAGNI)
2. Does something in this repo already do it? Reuse it.
3. Does the standard library / Web platform / Node do it?
4. Does Next.js, React, or Prisma already do it?
5. Does an already-installed dependency do it?
6. Only then: install something new.

Never install a package to save ten lines of code. Never install a UI
framework when Tailwind + a `<Component />` wrapper is enough.

## 8. Styling

- Tailwind v4. No new CSS files unless Tailwind genuinely can't express it.
- Repeated class strings → extract to a const in the same file, or a tiny
  component when it's used across files.
- No CSS-in-JS libraries. No style props objects.
- Dark mode is first-class — every text/surface class pairs with its
  `dark:` variant.

## 9. Data model and queries

- All DB access goes through `src/lib/prisma.ts`. Don't instantiate
  `PrismaClient` anywhere else.
- Queries live close to where they're used, but if the same query shows up
  twice, extract to `src/lib/<domain>.ts`.
- Scope every user-owned read with `where: { userId: session.user.id }`. No
  exceptions. Treat it as a security invariant.
- Never trust client-sent IDs for authorization — always compare against the
  session.

## 10. Validation

- All server-action and route-handler input goes through a zod schema. One
  schema per action, defined in the same file unless shared.
- No `any`, no `as` casting on user input. `schema.parse(...)` or
  `schema.safeParse(...)`.

## 11. Anti-patterns (don't do these)

- 2000-line page/component files with inline queries, inline components,
  inline styles, and inline business logic.
- Client components fetching data over `/api/*` when a parent server
  component could pass it as a prop.
- `useEffect` for data loading in RSC-capable code.
- Prop drilling across more than two levels — lift to a layout or use a
  server component higher in the tree.
- Duplicating route strings (`"/dashboard"`) — use `ROUTES.dashboard`.
- Catch-all `try/catch` that swallows errors. Let the error boundary handle it.
- Adding a dependency without climbing the ladder.

## 12. When something is intentionally simple

If a shortcut is deliberate (global lock, O(n²) scan on known-small data,
hard-coded constant that'll become user settings later), mark it with a
`ponytail:` comment and say what would trigger the upgrade:

```ts
// ponytail: constants in code; move to per-user settings when multi-user ships
export const SERVICE_DEFAULTS = { ... };
```

That turns a simplification into a tracked decision, not hidden tech debt.
