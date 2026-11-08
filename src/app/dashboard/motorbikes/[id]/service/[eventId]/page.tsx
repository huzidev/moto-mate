import Link from "next/link";
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

const schema = z.object({
  type: z.enum(["OIL_CHANGE", "TUNE", "CUSTOM"]),
  label: z.string().trim().max(60).optional().or(z.literal("")),
  atLifetimeKm: z.coerce.number().int().min(0).max(10_000_000),
  performedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id, eventId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);

  const event = await prisma.serviceEvent.findFirst({
    where: { id: eventId, motorbike: { id, userId: session.user.id } },
    select: {
      id: true,
      type: true,
      label: true,
      atLifetimeKm: true,
      performedAt: true,
      note: true,
      motorbike: { select: { name: true } },
    },
  });
  if (!event) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const performedAtDate = event.performedAt.toISOString().slice(0, 10);

  async function updateService(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);

    const owned = await prisma.serviceEvent.findFirst({
      where: { id: eventId, motorbike: { id, userId: s.user.id } },
      select: { id: true },
    });
    if (!owned) notFound();

    const parsed = schema.parse(Object.fromEntries(formData));
    await prisma.serviceEvent.update({
      where: { id: eventId },
      data: {
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
        <Link href={ROUTES.motorbike(id)} className="text-xs text-muted hover:text-foreground">
          ← {event.motorbike.name}
        </Link>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Edit service</h1>
      </div>

      <Card padding="lg">
        <form action={updateService} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Service type" htmlFor="type" required>
              <Select id="type" name="type" defaultValue={event.type}>
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
                defaultValue={event.label ?? ""}
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
                defaultValue={event.atLifetimeKm}
                className={inputClass}
              />
            </FormField>
            <FormField label="Date" htmlFor="performedAt" required>
              <input
                id="performedAt"
                name="performedAt"
                type="date"
                required
                defaultValue={performedAtDate}
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
              defaultValue={event.note ?? ""}
              placeholder="Shell Advance 10W40 at local shop"
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
