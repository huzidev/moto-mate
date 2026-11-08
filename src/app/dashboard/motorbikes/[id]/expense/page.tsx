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

export default async function LogExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);

  const [bike, { _sum }] = await Promise.all([
    prisma.motorbike.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, name: true },
    }),
    prisma.odometerLog.aggregate({
      where: { motorbikeId: id },
      _sum: { km: true },
    }),
  ]);
  if (!bike) notFound();

  const lifetimeKm = _sum.km ?? 0;
  const today = new Date().toISOString().slice(0, 10);

  async function logExpense(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);
    const owned = await prisma.motorbike.findFirst({
      where: { id, userId: s.user.id },
      select: { id: true },
    });
    if (!owned) notFound();

    const parsed = schema.parse(Object.fromEntries(formData));
    await prisma.expense.create({
      data: {
        motorbikeId: id,
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
        <BackLink href={ROUTES.motorbike(id)} label={bike.name} />
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Log an expense</h1>
        <p className="mt-1 text-sm text-muted">
          Repairs, parts, accessories — anything that cost money and isn&apos;t a
          fillup or scheduled service.
        </p>
      </div>

      <Card padding="lg">
        <form action={logExpense} className="space-y-5">
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
                placeholder="1300"
                className={inputClass}
              />
            </FormField>
            <FormField label="Category" htmlFor="category" hint="Free text — group however you like.">
              <input
                id="category"
                name="category"
                maxLength={40}
                placeholder="Repair"
                className={inputClass}
              />
            </FormField>
          </div>

          <FormField label="Reason" htmlFor="reason" hint="What you bought or fixed.">
            <input
              id="reason"
              name="reason"
              maxLength={500}
              placeholder="Rectifier replacement — low rpm cutouts"
              className={inputClass}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="At lifetime km"
              htmlFor="atLifetimeKm"
              hint="Optional — leave blank if you don't know."
            >
              <input
                id="atLifetimeKm"
                name="atLifetimeKm"
                type="number"
                min={0}
                max={10000000}
                defaultValue={lifetimeKm}
                className={inputClass}
              />
            </FormField>
            <FormField label="Date" htmlFor="spentAt" required>
              <input
                id="spentAt"
                name="spentAt"
                type="date"
                required
                defaultValue={today}
                max={today}
                className={inputClass}
              />
            </FormField>
          </div>

          <SubmitButton full size="lg" pendingLabel="Saving…">
            Save expense
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
