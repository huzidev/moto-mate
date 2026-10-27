import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/constants";
import { FormField, inputClass } from "@/components/FormField";

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
    <div className="mx-auto w-full max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Log a trip · {bike.name}</h1>
        <Link href={ROUTES.motorbike(id)} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          Cancel
        </Link>
      </div>

      <form
        action={logTrip}
        className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <FormField
          label="Kilometers ridden"
          htmlFor="km"
          required
          hint="How far you rode since your last log. The meter resetting doesn't matter — we only store deltas."
        >
          <input id="km" name="km" type="number" min={1} max={100000} required placeholder="120" className={inputClass} />
        </FormField>

        <FormField label="Note" htmlFor="note" hint="Optional — route, conditions, anything useful later.">
          <input id="note" name="note" maxLength={200} placeholder="City ride, light rain" className={inputClass} />
        </FormField>

        <button
          type="submit"
          className="h-10 w-full rounded-md bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Save log
        </button>
      </form>
    </div>
  );
}
