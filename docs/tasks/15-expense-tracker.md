# 15 · Expense tracker (non-service, non-fuel costs)

## Problem
User's example: "changed my motorbike rectifier, cost 1300 rupees, reason:
bike turning off at low rpm." Today there's no place for this — it's not
a planned service, it's not fuel.

## Data model (new)
Prisma model `Expense`:

```prisma
model Expense {
  id          String    @id @default(cuid())
  motorbikeId String
  motorbike   Motorbike @relation(fields: [motorbikeId], references: [id], onDelete: Cascade)
  amount      Decimal   @db.Decimal(10, 2)
  currency    String    @default("PKR")       // vision: single-user, local
  category    String?                          // free text or enum — start free
  reason      String?   @db.Text
  atLifetimeKm Int?
  spentAt     DateTime  @default(now())
  receiptUrl  String?                          // Cloudinary later
  createdAt   DateTime  @default(now())
}
```

Migration + `prisma migrate dev`.

## UI
- New section on bike detail: `Expenses` with `+ Log expense` button.
- New route: `src/app/dashboard/motorbikes/[id]/expenses/page.tsx`
  (form page, same pattern as fuel / log / service).
- Fields: amount*, category (free text, placeholder "Repair"), reason,
  at lifetime km (defaults to current), date (defaults to today).
- History list on bike detail: same visual pattern as Fuel history.

## Server action
`logExpense(formData)` in `src/lib/expenses.ts`:
- `auth()` re-check.
- Ownership check.
- zod schema.
- `prisma.expense.create`.
- `revalidatePath(ROUTES.motorbike(id))`.

Also `editExpense` + `deleteExpense` to match tasks 02 and 17.

## Chart view
Same `<LineChart>` from task 14. Y = amount spent per bucket. Month / year
toggle, same as fuel.

## Constants
- `ROUTES.logExpense(id)`, `ROUTES.expensesChart(id)` (or render inline
  — see task 16 for placement).

## Acceptance
- Can log an expense with amount, reason, date, km.
- Expenses appear on the bike detail page in a history list.
- Chart renders spend over time.
- Edit / delete via tasks 02 / 17's modal patterns.

## Out of scope
- Multi-currency conversion.
- Receipt image upload (Cloudinary).
- Category taxonomy — free-text field is fine until repetition shows a
  pattern worth normalizing.
