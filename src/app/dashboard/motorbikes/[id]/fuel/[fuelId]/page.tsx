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
  liters: z.coerce.number().positive().max(500),
  totalCost: z.coerce.number().min(0).max(1_000_000).optional().or(z.literal("")),
  atLifetimeKm: z.coerce.number().int().min(0).max(10_000_000),
  filledAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export default async function EditFuelPage({
  params,
}: {
  params: Promise<{ id: string; fuelId: string }>;
}) {
  const { id, fuelId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);

  const log = await prisma.fuelLog.findFirst({
    where: { id: fuelId, motorbike: { id, userId: session.user.id } },
    select: {
      id: true,
      liters: true,
      totalCost: true,
      atLifetimeKm: true,
      filledAt: true,
      note: true,
      motorbike: { select: { name: true } },
    },
  });
  if (!log) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const filledAtDate = log.filledAt.toISOString().slice(0, 10);

  async function updateFuel(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);

    const owned = await prisma.fuelLog.findFirst({
      where: { id: fuelId, motorbike: { id, userId: s.user.id } },
      select: { id: true },
    });
    if (!owned) notFound();

    const parsed = schema.parse(Object.fromEntries(formData));
    await prisma.fuelLog.update({
      where: { id: fuelId },
      data: {
        liters: parsed.liters,
        totalCost: typeof parsed.totalCost === "number" ? parsed.totalCost : null,
        atLifetimeKm: parsed.atLifetimeKm,
        filledAt: new Date(parsed.filledAt),
        note: parsed.note || null,
      },
    });

    revalidatePath(ROUTES.motorbike(id));
    redirect(ROUTES.motorbike(id));
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6">
        <BackLink href={ROUTES.motorbike(id)} label={log.motorbike.name} />
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Edit fillup</h1>
      </div>

      <Card padding="lg">
        <form action={updateFuel} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Liters" htmlFor="liters" required>
              <input
                id="liters"
                name="liters"
                type="number"
                step="0.01"
                min="0.1"
                max="500"
                required
                autoFocus
                defaultValue={log.liters}
                className={inputClass}
              />
            </FormField>
            <FormField label="Total cost" htmlFor="totalCost" hint="Optional. In your local currency.">
              <input
                id="totalCost"
                name="totalCost"
                type="number"
                step="0.01"
                min="0"
                max="1000000"
                defaultValue={log.totalCost ?? ""}
                placeholder="2250"
                className={inputClass}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="At lifetime km" htmlFor="atLifetimeKm" required>
              <input
                id="atLifetimeKm"
                name="atLifetimeKm"
                type="number"
                min={0}
                max={10000000}
                required
                defaultValue={log.atLifetimeKm}
                className={inputClass}
              />
            </FormField>
            <FormField label="Date" htmlFor="filledAt" required>
              <input
                id="filledAt"
                name="filledAt"
                type="date"
                required
                defaultValue={filledAtDate}
                max={today}
                className={inputClass}
              />
            </FormField>
          </div>

          <FormField label="Note" htmlFor="note" hint="Optional — station, grade, 'didn't fill to full', etc.">
            <input
              id="note"
              name="note"
              maxLength={300}
              defaultValue={log.note ?? ""}
              placeholder="Shell V-Power, filled to brim"
              className={inputClass}
            />
          </FormField>

          <SubmitButton full size="lg" pendingLabel="Saving…">
            Save changes
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
