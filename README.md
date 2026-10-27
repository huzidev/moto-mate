# MotoMate

Track mileage, fuel, and service reminders for a motorbike (cars coming later).
The digital odometer on my bike resets to 0, so this stores lifetime distance
and nags me by email when the next oil change / tune is due.

## Stack

- Next.js 16 (App Router, SSR + Server Actions) · TypeScript · Tailwind v4
- Prisma 6 · Vercel Postgres
- Auth.js v5 (NextAuth) · magic-link via Resend
- Cloudinary (receipt uploads)
- OpenRouter (AI for log parsing / summaries)
- Deployed on Vercel

## Setup

```bash
cp .env.example .env.local
# fill the values (AUTH_SECRET: openssl rand -base64 32)

npm install
npx prisma db push        # or: npm run db:migrate (named migration)
npm run dev
```

## Structure

```
src/
  app/                      # routes (SSR by default)
    page.tsx                  landing
    signin/                   magic-link form (server action)
    dashboard/                session-gated layout + page
    api/auth/[...nextauth]/   NextAuth handlers
  components/               # presentational, props-driven
  constants/                # routes, labels, service defaults — single source of truth
  lib/                      # prisma, auth, resend, cloudinary, openrouter, env
prisma/schema.prisma
```

## Conventions

- Server-first: data lives in RSC + server actions. `"use client"` only for interactivity.
- Reusable logic → `lib/`. Reusable UI → `components/`. Reusable values → `constants/`.
- No new deps unless stdlib / native / already-installed can't do it.
- Env is validated once in `src/lib/env.ts` — add new keys there, nowhere else.
