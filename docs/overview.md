# Overview

Where MotoMate stands today. Read `vision.md` for the why, `engineering.md`
for the how.

## Stack

Next.js 16 (App Router, server actions) · TypeScript · Tailwind v4 · Prisma 6
· Postgres · Auth.js v5 (Credentials + JWT) · bcryptjs · Resend · Vercel Cron.
Deploy target: Vercel. Dev DB: local Postgres.

## Design system

Amber-500 brand accent on a dark-first neutral palette (CSS vars in
`globals.css`, exposed to Tailwind via `@theme`). Reusable primitives:
`Button` / `LinkButton` (primary · secondary · ghost · danger), `Card`,
`FormField` + `inputClass`, `PasswordInput` (eye toggle), `PasswordFields`
(live match + collapsing length hint), `AuthShell`.

## Data model (prisma/schema.prisma)

- **User** · name, email, phone?, passwordHash, emailVerifiedAt
- **AuthCode** · bcrypt-hashed 6-digit codes, purpose = EMAIL_VERIFICATION | PASSWORD_RESET, 10-min TTL, 5-attempt cap
- **Motorbike** · name, make, model, year, plate?, city?, imageUrl?
- **OdometerLog** · trip delta in km; lifetime = sum (meter resets irrelevant)
- **ServiceEvent** · type (OIL_CHANGE | TUNE | CUSTOM), label?, atLifetimeKm, performedAt, note?
- **ServiceReminder** · intervalKm, maxDays?, active, lastNotifiedKm / lastNotifiedAt
- **FuelLog** · liters, totalCost?, atLifetimeKm, filledAt, note?, receiptUrl?

## Auth

- Signup → create user (unverified) → emails 6-digit code → `/verify-email`
- Signin rejects unverified users and auto-reissues a code to `/verify-email`
- Forgot → emails code → `/reset-password` (code + new password + confirm, same page)
- 60-second resend cooldown enforced in `issueCode()`
- `PasswordFields` client component blocks submission on mismatch (passwords never leave the browser → not wiped by server redirect)

## Features

- **Garage** — bike list with hero lifetime-km cards, empty-state hero, card type "Motorbike" active · "Car" coming-soon
- **Add bike** — name, make, model, year, starting km (writes an initial OdometerLog)
- **Bike detail** — hero lifetime km (amber `text-5xl`), service counters with progress bars + due/soon/ok chips, fuel economy stat cards + history, recent trips, service history
- **Log a trip** — delta input; after save, runs the email trigger
- **Reminders config** — edit interval + max days, toggle active, delete, add custom. Each card has an inline **Mark done** (defaults km=lifetime, date=today) that writes a ServiceEvent and clears the notification flag
- **Record service** (standalone `/service` page) — same effect, ad-hoc
- **Log fuel** — liters, optional total cost, lifetime km, date, note
- **Fuel economy** — tank-to-tank km/L (last tank + rolling avg), total liters, total spent

## Emails (`src/lib/email-templates.ts`)

Branded HTML wrapper (table-based, inline styles, Gmail-safe). Three templates:
- Verification (6-digit code box)
- Password reset (6-digit code box)
- Service reminder (status chip + stat row + CTA button to bike page)

## Reminder trigger

- **On every odometer log** → `checkRemindersForBike(id)` fires one email per crossed reminder, stamps `lastNotifiedAt/Km`
- **Daily Vercel Cron** at 07:00 UTC → `/api/cron/check-reminders` iterates all bikes for the time-based ("oil oxidized") case
- **Recording a service** (either path) clears `lastNotified*` on matching reminders → next crossing re-fires
- De-dup rule: one email per reminder per service cycle

## Env (`.env`, validated in `src/lib/env.ts`)

Required: `DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`.
Optional: `APP_URL` (defaults `http://localhost:3000`), `CRON_SECRET` (required in prod), `CLOUDINARY_*` (gated), `OPENROUTER_API_KEY` (gated).
Empty strings coerced to undefined before parse.

## Docs

- `docs/vision.md` — product intent
- `docs/engineering.md` — house style (DRY three-strikes, server-first, dep ladder, file-size budget, zod validation, anti-patterns)
- `CLAUDE.md` — short brief loaded by new sessions, points at both

## Not built yet

- Cloudinary receipt uploads on fuel / service logs
- AI insights via OpenRouter (weather + ride context → contextual service tips)
- Edit / delete past OdometerLog, FuelLog, ServiceEvent entries
- Public cars support (motorbike-only today, "Car" shows coming-soon in UI)
- Multi-user tooling (team / shared garage) — single-user is the current contract
