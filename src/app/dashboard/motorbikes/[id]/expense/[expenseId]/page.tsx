import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/constants";
import { FormField, inputClass } from "@/components/FormField";
import { SubmitButton } from "@/components/SubmitButton";
import { Card } from "@/components/Card";
import { BackLink } from "@/components/BackLink";

const schema = z.object({
  amount: z.coerce.number().positive().max(10_000_000),
  category: z.string().trim().max(40).optional().or(z.literal("")),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
  atLifetimeKm: z.coerce.number().int().min(0).max(10_000_000).optional().or(z.literal("")),
  spentAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
});

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>;
}) {
  const { id, expenseId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, motorbike: { id, userId: session.user.id } },
    select: {
      id: true,
      amount: true,
      category: true,
      reason: true,
      atLifetimeKm: true,
      spentAt: true,
      motorbike: { select: { name: true } },
    },
  });
  if (!expense) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const spentAtDate = expense.spentAt.toISOString().slice(0, 10);

  async function updateExpense(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);

    const owned = await prisma.expense.findFirst({
      where: { id: expenseId, motorbike: { id, userId: s.user.id } },
      select: { id: true },
    });
    if (!owned) notFound();

    const parsed = schema.parse(Object.fromEntries(formData));
    await prisma.expense.update({
      where: { id: expenseId },
      data: {
        amount: parsed.amount,
        category: parsed.category || null,
        reason: parsed.reason || null,
        atLifetimeKm:
          typeof parsed.atLifetimeKm === "number" ? parsed.atLifetimeKm : null,
        spentAt: new Date(parsed.spentAt),
      },
    });

    revalidatePath(ROUTES.motorbike(id));
    redirect(ROUTES.motorbike(id));
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6">
        <BackLink href={ROUTES.motorbike(id)} label={expense.motorbike.name} />
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Edit expense</h1>
      </div>

      <Card padding="lg">
        <form action={updateExpense} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount" htmlFor="amount" required>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                max="10000000"
                required
                autoFocus
                defaultValue={expense.amount}
                className={inputClass}
              />
            </FormField>
            <FormField label="Category" htmlFor="category">
              <input
                id="category"
                name="category"
                maxLength={40}
                defaultValue={expense.category ?? ""}
                placeholder="Repair"
                className={inputClass}
              />
            </FormField>
          </div>

          <FormField label="Reason" htmlFor="reason">
            <input
              id="reason"
              name="reason"
              maxLength={500}
              defaultValue={expense.reason ?? ""}
              placeholder="Rectifier replacement — low rpm cutouts"
              className={inputClass}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="At lifetime km" htmlFor="atLifetimeKm">
              <input
                id="atLifetimeKm"
                name="atLifetimeKm"
                type="number"
                min={0}
                max={10000000}
                defaultValue={expense.atLifetimeKm ?? ""}
                className={inputClass}
              />
            </FormField>
            <FormField label="Date" htmlFor="spentAt" required>
              <input
                id="spentAt"
                name="spentAt"
                type="date"
                required
                defaultValue={spentAtDate}
                max={today}
                className={inputClass}
              />
            </FormField>
          </div>

          <SubmitButton full size="lg" pendingLabel="Saving…">
            Save changes
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
