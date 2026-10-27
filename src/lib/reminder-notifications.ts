import { prisma } from "./prisma";
import { sendEmail } from "./resend";
import { reminderEmail } from "./email-templates";
import { env } from "./env";
import { ROUTES, SERVICE_DEFAULTS, SERVICE_TYPES } from "@/constants";
import type { ServiceType } from "@prisma/client";

type ActiveReminder = Awaited<ReturnType<typeof loadBikeContext>>["reminders"][number];

async function loadBikeContext(bikeId: string) {
  const bike = await prisma.motorbike.findUnique({
    where: { id: bikeId },
    include: {
      user: { select: { email: true, name: true } },
      reminders: { where: { active: true } },
      serviceEvents: { orderBy: { performedAt: "desc" } },
      odometerLogs: { select: { km: true } },
    },
  });
  if (!bike) throw new Error(`Bike ${bikeId} not found`);
  return bike;
}

function matchEvent(r: { type: ServiceType; label: string | null }, e: { type: ServiceType; label: string | null }) {
  if (r.type !== e.type) return false;
  if (r.type !== "CUSTOM") return true;
  return (r.label ?? null) === (e.label ?? null);
}

/**
 * Walk every active reminder on this bike. If any has crossed into "soon" or "due"
 * and we haven't already notified in the current cycle, email the user and record
 * the notification. Called from the log-trip action and the daily cron.
 */
export async function checkRemindersForBike(bikeId: string) {
  const bike = await loadBikeContext(bikeId);
  if (bike.reminders.length === 0) return { notified: 0 };

  const lifetimeKm = bike.odometerLogs.reduce((s, l) => s + l.km, 0);
  const now = new Date();
  let notified = 0;

  for (const r of bike.reminders) {
    if (r.lastNotifiedAt) continue;

    const lastEvent = bike.serviceEvents.find((e) => matchEvent(r, e));
    const atLast = lastEvent?.atLifetimeKm ?? 0;
    const sinceKm = Math.max(0, lifetimeKm - atLast);
    const sinceDays = lastEvent
      ? Math.floor((now.getTime() - lastEvent.performedAt.getTime()) / 86_400_000)
      : null;

    const kmDue = sinceKm >= r.intervalKm;
    const kmSoon = !kmDue && r.intervalKm - sinceKm <= SERVICE_DEFAULTS.reminderWindowKm;
    const daysDue = r.maxDays != null && sinceDays != null && sinceDays >= r.maxDays;

    if (!kmDue && !kmSoon && !daysDue) continue;

    const status: "due" | "soon" = kmDue || daysDue ? "due" : "soon";
    const trigger: "km" | "time" = daysDue && !kmDue ? "time" : "km";

    try {
      await sendEmail({
        to: bike.user.email,
        ...reminderEmail({
          name: bike.user.name,
          bikeName: bike.name,
          reminderLabel: r.label ?? SERVICE_TYPES[r.type].label,
          status,
          trigger,
          sinceKm,
          intervalKm: r.intervalKm,
          sinceDays,
          maxDays: r.maxDays,
          bikeUrl: `${env.APP_URL}${ROUTES.motorbike(bike.id)}`,
        }),
      });
      await prisma.serviceReminder.update({
        where: { id: r.id },
        data: { lastNotifiedAt: now, lastNotifiedKm: lifetimeKm },
      });
      notified++;
      if (process.env.NODE_ENV !== "production") {
        console.log(`[reminders] notified ${bike.user.email} · ${bike.name} · ${r.type}/${r.label ?? ""} · ${status}`);
      }
    } catch (e) {
      console.error("[reminders] send failed:", e);
    }
  }

  return { notified };
}

/** For every bike in the system, check reminders. Used by the daily cron. */
export async function checkRemindersForAllBikes() {
  const bikes = await prisma.motorbike.findMany({ select: { id: true } });
  let total = 0;
  for (const b of bikes) {
    try {
      const r = await checkRemindersForBike(b.id);
      total += r.notified;
    } catch (e) {
      console.error(`[reminders] bike ${b.id} failed:`, e);
    }
  }
  return { bikes: bikes.length, notified: total };
}

/**
 * When a service event is recorded, matching reminders should be allowed to
 * notify again on the next crossing. Clears lastNotified* on reminders that
 * match (type + label-for-CUSTOM).
 */
export async function clearNotificationsForServiceEvent(opts: {
  motorbikeId: string;
  type: ServiceType;
  label: string | null;
}) {
  await prisma.serviceReminder.updateMany({
    where: {
      motorbikeId: opts.motorbikeId,
      type: opts.type,
      ...(opts.type === "CUSTOM" ? { label: opts.label } : {}),
    },
    data: { lastNotifiedAt: null, lastNotifiedKm: null },
  });
}

// Reference the unused type parameter so tsc doesn't warn when ActiveReminder changes shape.
export type { ActiveReminder };
