import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ServiceType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROUTES, SERVICE_TYPES } from "@/constants";
import { Card } from "@/components/Card";
import { FormField, inputClass } from "@/components/FormField";
import { Button } from "@/components/Button";

const updateSchema = z.object({
  id: z.string().min(1),
  intervalKm: z.coerce.number().int().min(50).max(100_000),
  maxDays: z.coerce.number().int().min(1).max(3650).optional().or(z.literal("")),
  active: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

const addSchema = z.object({
  type: z.enum(["OIL_CHANGE", "TUNE", "CUSTOM"]),
  label: z.string().trim().max(40).optional().or(z.literal("")),
  intervalKm: z.coerce.number().int().min(50).max(100_000),
  maxDays: z.coerce.number().int().min(1).max(3650).optional().or(z.literal("")),
});

async function ensureOwnership(bikeId: string, userId: string) {
  const owned = await prisma.motorbike.findFirst({
    where: { id: bikeId, userId },
    select: { id: true, name: true },
  });
  if (!owned) notFound();
  return owned;
}

export default async function RemindersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);
  const bike = await ensureOwnership(id, session.user.id);

  const reminders = await prisma.serviceReminder.findMany({
    where: { motorbikeId: id },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });

  async function updateReminder(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);
    await ensureOwnership(id, s.user.id);

    const parsed = updateSchema.parse(Object.fromEntries(formData));
    await prisma.serviceReminder.update({
      where: { id: parsed.id },
      data: {
        intervalKm: parsed.intervalKm,
        maxDays: typeof parsed.maxDays === "number" ? parsed.maxDays : null,
        active: parsed.active,
      },
    });
    revalidatePath(ROUTES.reminders(id));
    revalidatePath(ROUTES.motorbike(id));
  }

  async function deleteReminder(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);
    await ensureOwnership(id, s.user.id);

    const rid = String(formData.get("id") ?? "");
    await prisma.serviceReminder.delete({ where: { id: rid } });
    revalidatePath(ROUTES.reminders(id));
    revalidatePath(ROUTES.motorbike(id));
  }

  async function addReminder(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);
    await ensureOwnership(id, s.user.id);

    const parsed = addSchema.parse(Object.fromEntries(formData));
    await prisma.serviceReminder.create({
      data: {
        motorbikeId: id,
        type: parsed.type as ServiceType,
        label: parsed.label || null,
        intervalKm: parsed.intervalKm,
        maxDays: typeof parsed.maxDays === "number" ? parsed.maxDays : null,
      },
    });
    revalidatePath(ROUTES.reminders(id));
    revalidatePath(ROUTES.motorbike(id));
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reminders · {bike.name}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            We'll email you when a reminder is due by distance or time — whichever hits first.
          </p>
        </div>
        <Link
          href={ROUTES.motorbike(id)}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          Back
        </Link>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-[var(--muted)]">Active reminders</h2>
        {reminders.length === 0 ? (
          <Card padding="md" className="text-sm text-[var(--muted)]">
            No reminders yet — add one below.
          </Card>
        ) : (
          reminders.map((r) => (
            <Card key={r.id} padding="md">
              <form action={updateReminder} className="space-y-4">
                <input type="hidden" name="id" value={r.id} />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {r.label ?? SERVICE_TYPES[r.type].label}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {r.type.replace("_", " ").toLowerCase()}
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted)]">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={r.active}
                      className="h-4 w-4 accent-brand-500"
                    />
                    Active
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Interval (km)" htmlFor={`km-${r.id}`} required>
                    <input
                      id={`km-${r.id}`}
                      name="intervalKm"
                      type="number"
                      min={50}
                      max={100000}
                      required
                      defaultValue={r.intervalKm}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField
                    label="Max days"
                    htmlFor={`days-${r.id}`}
                    hint="Blank = km-only."
                  >
                    <input
                      id={`days-${r.id}`}
                      name="maxDays"
                      type="number"
                      min={1}
                      max={3650}
                      defaultValue={r.maxDays ?? ""}
                      className={inputClass}
                    />
                  </FormField>
                </div>

                <div className="flex items-center justify-between">
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                  <form action={deleteReminder}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Delete
                    </Button>
                  </form>
                </div>
              </form>
            </Card>
          ))
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--muted)]">Add a custom reminder</h2>
        <Card padding="md" className="mt-4">
          <form action={addReminder} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Type" htmlFor="type" required>
                <select
                  id="type"
                  name="type"
                  defaultValue="CUSTOM"
                  className={inputClass}
                >
                  <option value="OIL_CHANGE">Oil change</option>
                  <option value="TUNE">Tune / major service</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </FormField>
              <FormField label="Label" htmlFor="label" hint="Only used for Custom type.">
                <input
                  id="label"
                  name="label"
                  maxLength={40}
                  placeholder="Chain lube"
                  className={inputClass}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Interval (km)" htmlFor="intervalKm" required>
                <input
                  id="intervalKm"
                  name="intervalKm"
                  type="number"
                  min={50}
                  max={100000}
                  required
                  placeholder="500"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Max days" htmlFor="maxDays">
                <input
                  id="maxDays"
                  name="maxDays"
                  type="number"
                  min={1}
                  max={3650}
                  placeholder="90"
                  className={inputClass}
                />
              </FormField>
            </div>
            <Button type="submit" size="md">
              + Add reminder
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
