import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRemindersForBike } from "@/lib/reminder-notifications";
import { ROUTES } from "@/constants";
import { Card } from "@/components/Card";
import { LogTripForm } from "@/components/LogTripForm";

const schema = z.object({
  km: z.coerce.number().int().min(1).max(100_000),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export default async function LogTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);

  const bike = await prisma.motorbike.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true },
  });
  if (!bike) notFound();

  const { _sum } = await prisma.odometerLog.aggregate({
    where: { motorbikeId: id },
    _sum: { km: true },
  });
  const lifetimeKm = _sum.km ?? 0;

  async function logTrip(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);

    const owned = await prisma.motorbike.findFirst({
      where: { id, userId: s.user.id },
      select: { id: true },
    });
    if (!owned) notFound();

    const parsed = schema.parse(Object.fromEntries(formData));
    await prisma.odometerLog.create({
      data: {
        motorbikeId: id,
        km: parsed.km,
        note: parsed.note || null,
      },
    });

    // Fire-and-ignore errors — log succeeded, user shouldn't see a 500 if email fails.
    try {
      await checkRemindersForBike(id);
    } catch (e) {
      console.error("[log] reminder check failed:", e);
    }

    revalidatePath(ROUTES.motorbike(id));
    redirect(ROUTES.motorbike(id));
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Log a trip</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{bike.name}</p>
        </div>
        <Link
          href={ROUTES.motorbike(id)}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          Cancel
        </Link>
      </div>

      <Card padding="lg">
        <LogTripForm action={logTrip} lifetimeKm={lifetimeKm} />
      </Card>
    </div>
  );
}
