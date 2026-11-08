import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/constants";
import { FormField, inputClass } from "@/components/FormField";
import { SubmitButton } from "@/components/SubmitButton";
import { Card } from "@/components/Card";

const schema = z.object({
  km: z.coerce.number().int().min(1).max(100_000),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string; logId: string }>;
}) {
  const { id, logId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);

  const log = await prisma.odometerLog.findFirst({
    where: { id: logId, motorbike: { id, userId: session.user.id } },
    select: {
      id: true,
      km: true,
      note: true,
      motorbike: { select: { name: true } },
    },
  });
  if (!log) notFound();

  async function updateTrip(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);

    const owned = await prisma.odometerLog.findFirst({
      where: { id: logId, motorbike: { id, userId: s.user.id } },
      select: { id: true },
    });
    if (!owned) notFound();

    const parsed = schema.parse(Object.fromEntries(formData));
    await prisma.odometerLog.update({
      where: { id: logId },
      data: { km: parsed.km, note: parsed.note || null },
    });

    revalidatePath(ROUTES.motorbike(id));
    redirect(ROUTES.motorbike(id));
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6">
        <Link href={ROUTES.motorbike(id)} className="text-xs text-muted hover:text-foreground">
          ← {log.motorbike.name}
        </Link>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Edit trip</h1>
      </div>

      <Card padding="lg">
        <form action={updateTrip} className="space-y-5">
          <FormField label="Kilometers ridden" htmlFor="km" required hint="Delta since the previous log.">
            <input
              id="km"
              name="km"
              type="number"
              min={1}
              max={100000}
              required
              autoFocus
              defaultValue={log.km}
              className={inputClass}
            />
          </FormField>
          <FormField label="Note" htmlFor="note" hint="Optional — route, conditions, anything useful later.">
            <input
              id="note"
              name="note"
              maxLength={200}
              defaultValue={log.note ?? ""}
              placeholder="City ride, light rain"
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
