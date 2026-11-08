import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ServiceType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clearNotificationsForServiceEvent } from "@/lib/reminder-notifications";
import { ROUTES, SERVICE_TYPES } from "@/constants";
import { Card } from "@/components/Card";
import { FormField, inputClass } from "@/components/FormField";
import { Select } from "@/components/Select";
import { SubmitButton } from "@/components/SubmitButton";
import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/Modal";
import { BackLink } from "@/components/BackLink";
import { MarkDoneBlock } from "@/components/MarkDoneBlock";

const updateSchema = z.object({
  id: z.string().min(1),
  intervalKm: z.coerce.number().int().min(50).max(100_000),
  maxDays: z.coerce.number().int().min(1).max(3650).optional().or(z.literal("")),
  active: z.string().optional().transform((v) => v === "on"),
});

const addSchema = z.object({
  type: z.enum(["OIL_CHANGE", "TUNE", "CUSTOM"]),
  label: z.string().trim().max(40).optional().or(z.literal("")),
  intervalKm: z.coerce.number().int().min(50).max(100_000),
  maxDays: z.coerce.number().int().min(1).max(3650).optional().or(z.literal("")),
});

const markDoneArgSchema = z.object({
  reminderId: z.string().min(1),
  atLifetimeKm: z.number().int().min(0).max(10_000_000),
  performedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type Filter = "all" | "active" | "inactive";

async function ensureOwnership(bikeId: string, userId: string) {
  const owned = await prisma.motorbike.findFirst({
    where: { id: bikeId, userId },
    select: { id: true, name: true },
  });
  if (!owned) notFound();
  return owned;
}

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function RemindersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const filter: Filter =
    sp.filter === "active" ? "active" : sp.filter === "inactive" ? "inactive" : "all";

  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);
  const bike = await ensureOwnership(id, session.user.id);

  const [reminders, allEvents, logs] = await Promise.all([
    prisma.serviceReminder.findMany({
      where: { motorbikeId: id },
      orderBy: [{ active: "desc" }, { type: "asc" }, { createdAt: "asc" }],
    }),
    prisma.serviceEvent.findMany({
      where: { motorbikeId: id },
      orderBy: { performedAt: "desc" },
    }),
    prisma.odometerLog.findMany({
      where: { motorbikeId: id },
      select: { km: true },
    }),
  ]);

  const activeCount = reminders.filter((r) => r.active).length;
  const inactiveCount = reminders.length - activeCount;
  const visible = reminders.filter((r) =>
    filter === "all" ? true : filter === "active" ? r.active : !r.active,
  );

  const lifetimeKm = logs.reduce((s, l) => s + l.km, 0);
  const today = toDateInput(new Date());

  const lastEventFor = (r: (typeof reminders)[number]) =>
    allEvents.find(
      (e) => e.type === r.type && (r.type !== "CUSTOM" || e.label === r.label),
    );

  async function updateReminder(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);
    await ensureOwnership(id, s.user.id);

    const parsed = updateSchema.parse(Object.fromEntries(formData));
    await prisma.serviceReminder.updateMany({
      where: { id: parsed.id, motorbikeId: id },
      data: {
        intervalKm: parsed.intervalKm,
        maxDays: typeof parsed.maxDays === "number" ? parsed.maxDays : null,
        active: parsed.active,
      },
    });
    revalidatePath(ROUTES.reminders(id));
    revalidatePath(ROUTES.motorbike(id));
  }

  async function reactivateReminder(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);
    await ensureOwnership(id, s.user.id);

    const reminderId = String(formData.get("id") ?? "");
    await prisma.serviceReminder.updateMany({
      where: { id: reminderId, motorbikeId: id },
      data: { active: true },
    });
    revalidatePath(ROUTES.reminders(id));
    revalidatePath(ROUTES.motorbike(id));
  }

  async function deleteReminder(reminderId: string) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);
    await ensureOwnership(id, s.user.id);

    await prisma.serviceReminder.deleteMany({
      where: { id: reminderId, motorbikeId: id },
    });
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

  async function markDone(
    reminderId: string,
    atLifetimeKm: number,
    performedAt: string,
  ) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);
    await ensureOwnership(id, s.user.id);

    const parsed = markDoneArgSchema.parse({ reminderId, atLifetimeKm, performedAt });
    const reminder = await prisma.serviceReminder.findFirst({
      where: { id: parsed.reminderId, motorbikeId: id },
    });
    if (!reminder) notFound();

    await prisma.serviceEvent.create({
      data: {
        motorbikeId: id,
        type: reminder.type,
        label: reminder.label,
        atLifetimeKm: parsed.atLifetimeKm,
        performedAt: new Date(parsed.performedAt),
      },
    });
    await clearNotificationsForServiceEvent({
      motorbikeId: id,
      type: reminder.type,
      label: reminder.label,
    });
    revalidatePath(ROUTES.reminders(id));
    revalidatePath(ROUTES.motorbike(id));
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div>
        <BackLink href={ROUTES.motorbike(id)} label={bike.name} />
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Reminders</h1>
        <p className="mt-1 text-sm text-muted">
          Set service intervals and record when each service was last done. We&apos;ll email
          you when a reminder is due by distance or time — whichever hits first.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-muted">Reminders</h2>
          <FilterBar
            baseHref={ROUTES.reminders(id)}
            filter={filter}
            counts={{ all: reminders.length, active: activeCount, inactive: inactiveCount }}
          />
        </div>

        {visible.length === 0 ? (
          <Card padding="md" className="text-sm text-muted">
            {reminders.length === 0
              ? "No reminders yet — add one below."
              : `No ${filter} reminders.`}
          </Card>
        ) : (
          visible.map((r) => {
            const last = lastEventFor(r);
            const label = r.label ?? SERVICE_TYPES[r.type].label;

            if (!r.active) {
              return (
                <Card key={r.id} padding="md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{label}</div>
                      <div className="mt-0.5 text-xs text-muted">
                        {last ? (
                          <>
                            Last done at{" "}
                            <span className="tabular-nums text-[var(--foreground)]">
                              {last.atLifetimeKm.toLocaleString()} km
                            </span>{" "}
                            · {last.performedAt.toLocaleDateString()}
                          </>
                        ) : (
                          <>Never recorded.</>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={reactivateReminder}>
                        <input type="hidden" name="id" value={r.id} />
                        <SubmitButton variant="secondary" size="sm" pendingLabel="Enabling…">
                          Re-activate
                        </SubmitButton>
                      </form>
                      <ConfirmModal
                        title="Delete reminder?"
                        description={
                          <>
                            This clears{" "}
                            <strong className="text-[var(--foreground)]">{label}</strong>.
                            It can be re-added later.
                          </>
                        }
                        confirmLabel="Delete"
                        confirmVariant="danger"
                        onConfirm={deleteReminder.bind(null, r.id)}
                      >
                        <Button type="button" variant="danger" size="sm">
                          Delete
                        </Button>
                      </ConfirmModal>
                    </div>
                  </div>
                </Card>
              );
            }

            return (
              <Card key={r.id} padding="md" className="space-y-5">
                <form action={updateReminder} className="space-y-4">
                  <input type="hidden" name="id" value={r.id} />
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-muted">
                        {r.type.replace("_", " ").toLowerCase()}
                      </div>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
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
                    <SubmitButton variant="secondary" size="sm" pendingLabel="Saving…">
                      Save
                    </SubmitButton>
                  </div>
                </form>

                <div className="rounded-lg bg-surface-muted p-4">
                  <div className="text-xs text-muted">
                    {last ? (
                      <>
                        Last done at{" "}
                        <span className="font-medium tabular-nums text-foreground">
                          {last.atLifetimeKm.toLocaleString()} km
                        </span>{" "}
                        · {last.performedAt.toLocaleDateString()}
                      </>
                    ) : (
                      <>Never recorded.</>
                    )}
                  </div>
                  <MarkDoneBlock
                    reminderId={r.id}
                    reminderLabel={label}
                    defaultKm={lifetimeKm}
                    defaultDate={today}
                    action={markDone}
                  />
                </div>

                <div className="flex justify-end">
                  <ConfirmModal
                    title="Delete reminder?"
                    description={
                      <>
                        This clears{" "}
                        <strong className="text-[var(--foreground)]">{label}</strong>.
                        It can be re-added later.
                      </>
                    }
                    confirmLabel="Delete"
                    confirmVariant="danger"
                    onConfirm={deleteReminder.bind(null, r.id)}
                  >
                    <Button type="button" variant="danger" size="sm">
                      Delete reminder
                    </Button>
                  </ConfirmModal>
                </div>
              </Card>
            );
          })
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted">Add a custom reminder</h2>
        <Card padding="md" className="mt-4">
          <form action={addReminder} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Type" htmlFor="type" required>
                <Select id="type" name="type" defaultValue="CUSTOM">
                  <option value="OIL_CHANGE">Oil change</option>
                  <option value="TUNE">Tune / major service</option>
                  <option value="CUSTOM">Custom</option>
                </Select>
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
            <SubmitButton size="md" pendingLabel="Adding…">
              + Add reminder
            </SubmitButton>
          </form>
        </Card>
      </section>
    </div>
  );
}

function FilterBar({
  baseHref,
  filter,
  counts,
}: {
  baseHref: string;
  filter: Filter;
  counts: { all: number; active: number; inactive: number };
}) {
  const tab = (key: Filter, label: string, count: number) => {
    const href = key === "all" ? baseHref : `${baseHref}?filter=${key}`;
    const active = filter === key;
    return (
      <Link
        key={key}
        href={href}
        className={
          "rounded-md px-2.5 py-1 text-xs font-medium transition " +
          (active
            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
            : "text-muted hover:text-foreground")
        }
      >
        {label} <span className="tabular-nums opacity-70">({count})</span>
      </Link>
    );
  };
  return (
    <div className="flex gap-1 rounded-lg bg-surface-muted p-1">
      {tab("all", "All", counts.all)}
      {tab("active", "Active", counts.active)}
      {tab("inactive", "Inactive", counts.inactive)}
    </div>
  );
}
