import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ServiceType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROUTES, SERVICE_TYPES } from "@/constants";
import { FormField, inputClass } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

const schema = z.object({
  type: z.enum(["OIL_CHANGE", "TUNE", "CUSTOM"]),
  label: z.string().trim().max(60).optional().or(z.literal("")),
  atLifetimeKm: z.coerce.number().int().min(0).max(10_000_000),
  performedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export default async function RecordServicePage({
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
    prisma.odometerLog.findMany({
      where: { motorbikeId: id },
      select: { km: true },
    }),
  ]);
  if (!bike) notFound();

  const lifetimeKm = logs.reduce((s, l) => s + l.km, 0);
  const today = new Date().toISOString().slice(0, 10);

  async function recordService(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);

    const owned = await prisma.motorbike.findFirst({
      where: { id, userId: s.user.id },
      select: { id: true },
    });
    if (!owned) notFound();

    const parsed = schema.parse(Object.fromEntries(formData));
    await prisma.serviceEvent.create({
      data: {
        motorbikeId: id,
        type: parsed.type as ServiceType,
        label: parsed.label || null,
        atLifetimeKm: parsed.atLifetimeKm,
        performedAt: new Date(parsed.performedAt),
        note: parsed.note || null,
      },
    });

    revalidatePath(ROUTES.motorbike(id));
    revalidatePath(ROUTES.reminders(id));
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
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Record a service</h1>
          <p className="mt-1 text-sm text-muted">
            Logs when a service was done. Resets the counter for any matching reminder.
          </p>
        </div>
      </div>

      <Card padding="lg">
        <form action={recordService} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Service type" htmlFor="type" required>
              <select
                id="type"
                name="type"
                defaultValue="OIL_CHANGE"
                className={inputClass}
              >
                <option value="OIL_CHANGE">{SERVICE_TYPES.OIL_CHANGE.label}</option>
                <option value="TUNE">{SERVICE_TYPES.TUNE.label}</option>
                <option value="CUSTOM">{SERVICE_TYPES.CUSTOM.label}</option>
              </select>
            </FormField>
            <FormField label="Label" htmlFor="label" hint="Required for Custom; optional for other types.">
              <input
                id="label"
                name="label"
                maxLength={60}
                placeholder="e.g. chain lube"
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
                defaultValue={lifetimeKm}
                className={inputClass}
              />
            </FormField>
            <FormField label="Date" htmlFor="performedAt" required>
              <input
                id="performedAt"
                name="performedAt"
                type="date"
                required
                defaultValue={today}
                max={today}
                className={inputClass}
              />
            </FormField>
          </div>

          <FormField label="Note" htmlFor="note" hint="Optional — shop name, parts used, mileage context.">
            <input
              id="note"
              name="note"
              maxLength={300}
              placeholder="Shell Advance 10W40 at local shop"
              className={inputClass}
            />
          </FormField>

          <Button type="submit" full size="lg">
            Save service
          </Button>
        </form>
      </Card>
    </div>
  );
}
