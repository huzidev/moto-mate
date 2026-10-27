# Vision

## Why this exists

I ride a motorbike. Its digital odometer resets to 0 for reasons I don't
understand. That makes it impossible to know, by looking at the dash, when
the next oil change or tune is due — and makes it impossible to compute real
fuel average over time.

MotoMate solves one problem: **I always know the real lifetime mileage of my
bike, and the system nags me when service is actually due** — on km, on time,
or on environmental factors (hot/humid cities wear parts faster).

## For whom

Right now: just me. Single-user, personal utility.

Later: anyone with a bike or car who's annoyed by the same thing. Multi-user
is a horizon, not a current requirement. Build decisions should favor the
single-user case without painting us into a corner.

## What it does (today, in order of priority)

1. **Lifetime mileage** across odometer resets. Each log is a delta ridden
   since the last log; resets are irrelevant.
2. **Service reminders.** User sets intervals per bike per service type
   (oil change, tune, custom). Email when due by km *or* by time.
3. **Fuel tracking** → compute km/L average over time.
4. **AI-assisted recommendations** (OpenRouter): factor in ride weather and
   environment so advice is contextual, not generic ("oil can oxidize even
   if you didn't hit 1000 km").
5. **Receipt uploads** (Cloudinary) attached to fuel / service entries.

## What it is NOT

- Not a fleet tool, not a mechanic's dashboard, not a parts marketplace.
- Not a social app. No sharing, no public profiles.
- Not a replacement for the owner's manual. It tracks what the user tells
  it; it does not read diagnostic codes.

## Vehicle types

Motorbike is the only enabled type at launch. "Car" exists in the UI as
*coming soon* to signal where this is headed, but zero car-specific code
ships until a car-owning user actually wants it.

## Non-negotiables

- **Email reminders must be reliable.** If the system misses a notification,
  it's failed its one job.
- **Entering a log must be fast** — a few taps, no friction. If logging a
  trip takes more than 10 seconds, people stop logging, and the app dies.
- **Data belongs to the user.** Export must stay trivial (plain SQL /
  CSV-friendly schema).
