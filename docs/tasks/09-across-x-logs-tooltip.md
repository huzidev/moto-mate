# 09 · "across X logs" → info icon with tooltip

## Problem
Image #11: muted text `across 3 logs` under fuel stats reads as noise, not
information. Too chatty.

## Goal
Replace inline muted line with a small **info icon** (`ⓘ` / `?`). On hover
/ focus, show a tooltip explaining the stat ("Rolling average across 3
logged tanks").

## Implementation
- `src/components/InfoTip.tsx` — reusable client component.
  - Trigger: `<button type="button" aria-describedby=…>` with a tiny SVG.
  - Tooltip: positioned absolutely under the trigger, shown on hover or
    keyboard focus.
  - Pure Tailwind + CSS; no popover library.
  - ponytail: swap to Radix popover only if positioning gets painful
    (overflow clipping inside a card).
- Replace the "across N logs" div next to fuel stat cards with
  `<InfoTip>Rolling average across {n} tanks</InfoTip>`.

## Acceptance
- No more inline "across 3 logs" text.
- Icon visible; hover and keyboard focus both open the tip.
- Screen reader announces tooltip content via `aria-describedby`.

## Out of scope
- Touch tooltips (tap to open). Nice-to-have; skip until a mobile audit
  turns up a specific user need.
