import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/constants";
import { FormField, inputClass } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

const schema = z.object({
  liters: z.coerce.number().positive().max(500),
  totalCost: z.coerce.number().min(0).max(1_000_000).optional().or(z.literal("")),
  atLifetimeKm: z.coerce.number().int().min(0).max(10_000_000),
  filledAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export default async function LogFuelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);

  const [bike, logs] = await Promise.all([
    prisma.motorbike.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, name: true },
    }),
    prisma.odometerLog.findMany({ where: { motorbikeId: id }, select: { km: true } }),
  ]);
  if (!bike) notFound();

  const lifetimeKm = logs.reduce((s, l) => s + l.km, 0);
  const today = new Date().toISOString().slice(0, 10);

  async function logFuel(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);
    const owned = await prisma.motorbike.findFirst({
      where: { id, userId: s.user.id },
      select: { id: true },
    });
    if (!owned) notFound();

    const parsed = schema.parse(Object.fromEntries(formData));
    await prisma.fuelLog.create({
      data: {
        motorbikeId: id,
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href={ROUTES.motorbike(id)}
            className="text-xs text-muted hover:text-foreground"
          >
            ← {bike.name}
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Log a fillup</h1>
          <p className="mt-1 text-sm text-muted">
            For accurate km/L, fill the tank to full every time you log.
          </p>
        </div>
      </div>

      <Card padding="lg">
        <form action={logFuel} className="space-y-5">
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
                placeholder="7.5"
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
                placeholder="2250"
                className={inputClass}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="At lifetime km"
              htmlFor="atLifetimeKm"
              required
              hint="Odometer wraps are fine — this is lifetime, auto-filled."
            >
              <input
                id="atLifetimeKm"
                name="atLifetimeKm"
                type="number"
                min={0}
                max={10000000}
                required
                defaultValue={lifetimeKm}
                className={inputClass}
              />
            </FormField>
            <FormField label="Date" htmlFor="filledAt" required>
              <input
                id="filledAt"
                name="filledAt"
                type="date"
                required
                defaultValue={today}
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
              placeholder="Shell V-Power, filled to brim"
              className={inputClass}
            />
          </FormField>

          <Button type="submit" full size="lg">
            Save fillup
          </Button>
        </form>
      </Card>
    </div>
  );
}
