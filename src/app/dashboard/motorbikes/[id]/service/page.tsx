import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ServiceType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clearNotificationsForServiceEvent } from "@/lib/reminder-notifications";
import { ROUTES, SERVICE_TYPES } from "@/constants";
import { FormField, inputClass } from "@/components/FormField";
import { Select } from "@/components/Select";
import { SubmitButton } from "@/components/SubmitButton";
import { Card } from "@/components/Card";
import { BackLink } from "@/components/BackLink";

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
    await clearNotificationsForServiceEvent({
      motorbikeId: id,
      type: parsed.type as ServiceType,
      label: parsed.label || null,
    });

    revalidatePath(ROUTES.motorbike(id));
    revalidatePath(ROUTES.reminders(id));
    redirect(ROUTES.motorbike(id));
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6">
        <BackLink href={ROUTES.motorbike(id)} label={bike.name} />
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Log a service</h1>
        <p className="mt-1 text-sm text-muted">
          Records a one-off service. If a matching reminder exists, its counter
          resets too.
        </p>
      </div>

      <Card padding="lg">
        <form action={recordService} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Service type" htmlFor="type" required>
              <Select id="type" name="type" defaultValue="OIL_CHANGE">
                <option value="OIL_CHANGE">{SERVICE_TYPES.OIL_CHANGE.label}</option>
                <option value="TUNE">{SERVICE_TYPES.TUNE.label}</option>
                <option value="CUSTOM">{SERVICE_TYPES.CUSTOM.label}</option>
              </Select>
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

          <SubmitButton full size="lg" pendingLabel="Saving…">
            Save service
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
