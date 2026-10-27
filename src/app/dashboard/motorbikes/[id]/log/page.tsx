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
        <form action={logTrip} className="space-y-5">
          <FormField
            label="Kilometers ridden"
            htmlFor="km"
            required
            hint="How far you rode since your last log. Odometer resets don't matter — we only store deltas."
          >
            <input
              id="km"
              name="km"
              type="number"
              min={1}
              max={100000}
              required
              autoFocus
              placeholder="120"
              className={inputClass}
            />
          </FormField>
          <FormField label="Note" htmlFor="note" hint="Optional — route, conditions, anything useful later.">
            <input
              id="note"
              name="note"
              maxLength={200}
              placeholder="City ride, light rain"
              className={inputClass}
            />
          </FormField>
          <Button type="submit" full size="lg">
            Save log
          </Button>
        </form>
      </Card>
    </div>
  );
}
