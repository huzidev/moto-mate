"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { ROUTES } from "@/constants";

async function requireUserId() {
  const s = await auth();
  if (!s?.user?.id) redirect(ROUTES.signin);
  return s.user.id;
}

/**
 * Each delete scopes ownership through the Motorbike relation, so a forged
 * row id can never reach another user's data. findFirst-then-delete makes
 * the ownership check explicit; no-op if the row isn't visible.
 */

export async function deleteOdometerLog(id: string) {
  const userId = await requireUserId();
  const log = await prisma.odometerLog.findFirst({
    where: { id, motorbike: { userId } },
    select: { motorbikeId: true },
  });
  if (!log) return;
  await prisma.odometerLog.delete({ where: { id } });
  revalidatePath(ROUTES.motorbike(log.motorbikeId));
}

export async function deleteFuelLog(id: string) {
  const userId = await requireUserId();
  const log = await prisma.fuelLog.findFirst({
    where: { id, motorbike: { userId } },
    select: { motorbikeId: true },
  });
  if (!log) return;
  await prisma.fuelLog.delete({ where: { id } });
  revalidatePath(ROUTES.motorbike(log.motorbikeId));
}

/**
 * Deleting a service event may leave the reminder's lastNotified* stale,
 * so the next cron tick can re-fire. That's the intended behaviour — the
 * "last done" trail just vanished with the event.
 */
export async function deleteServiceEvent(id: string) {
  const userId = await requireUserId();
  const event = await prisma.serviceEvent.findFirst({
    where: { id, motorbike: { userId } },
    select: { motorbikeId: true },
  });
  if (!event) return;
  await prisma.serviceEvent.delete({ where: { id } });
  revalidatePath(ROUTES.motorbike(event.motorbikeId));
  revalidatePath(ROUTES.reminders(event.motorbikeId));
}

export async function deleteExpense(id: string) {
  const userId = await requireUserId();
  const expense = await prisma.expense.findFirst({
    where: { id, motorbike: { userId } },
    select: { motorbikeId: true },
  });
  if (!expense) return;
  await prisma.expense.delete({ where: { id } });
  revalidatePath(ROUTES.motorbike(expense.motorbikeId));
}
