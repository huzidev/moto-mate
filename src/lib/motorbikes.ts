import { ServiceType } from "@prisma/client";
import { prisma } from "./prisma";
import { SERVICE_DEFAULTS, SERVICE_TYPES } from "@/constants";

/** All derived numbers for a bike. Single source of truth for the UI. */
export async function getBikeWithStats(bikeId: string, userId: string) {
  const bike = await prisma.motorbike.findFirst({
    where: { id: bikeId, userId },
    include: {
      odometerLogs: { orderBy: { loggedAt: "desc" } },
      serviceEvents: { orderBy: { performedAt: "desc" } },
      reminders: { where: { active: true } },
    },
  });
  if (!bike) return null;

  const lifetimeKm = bike.odometerLogs.reduce((sum, l) => sum + l.km, 0);

  const counters = bike.reminders.map((r) => {
    const lastEvent = bike.serviceEvents.find(
      (e) => e.type === r.type && (r.type !== "CUSTOM" || e.label === r.label),
    );
    const atLast = lastEvent?.atLifetimeKm ?? 0;
    const sinceKm = lifetimeKm - atLast;
    const sinceDays = lastEvent
      ? Math.floor((Date.now() - lastEvent.performedAt.getTime()) / 86_400_000)
      : null;

    const kmDue = sinceKm >= r.intervalKm;
    const kmSoon = !kmDue && r.intervalKm - sinceKm <= SERVICE_DEFAULTS.reminderWindowKm;
    const daysDue = r.maxDays != null && sinceDays != null && sinceDays >= r.maxDays;

    return {
      reminder: r,
      typeLabel: r.label ?? SERVICE_TYPES[r.type].label,
      sinceKm,
      sinceDays,
      status: (daysDue || kmDue ? "due" : kmSoon ? "soon" : "ok") as "due" | "soon" | "ok",
    };
  });

  return { ...bike, lifetimeKm, counters };
}

/** Seed default km/time reminders when a bike is first created. */
export async function seedDefaultReminders(motorbikeId: string) {
  await prisma.serviceReminder.createMany({
    data: (Object.keys(SERVICE_TYPES) as ServiceType[])
      .filter((t) => t !== "CUSTOM")
      .map((t) => ({
        motorbikeId,
        type: t,
        intervalKm: SERVICE_TYPES[t].defaultIntervalKm,
        maxDays: SERVICE_TYPES[t].defaultMaxDays,
      })),
    skipDuplicates: true,
  });
}
