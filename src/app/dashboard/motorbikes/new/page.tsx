import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedDefaultReminders } from "@/lib/motorbikes";
import { ROUTES } from "@/constants";
import { FormField, inputClass } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  make: z.string().trim().max(40).optional().or(z.literal("")),
  model: z.string().trim().max(40).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("")),
  startingKm: z.coerce.number().int().min(0).max(1_000_000).optional().or(z.literal("")),
});

export default async function NewMotorbikePage() {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);

  async function addBike(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);

    const parsed = schema.parse(Object.fromEntries(formData));
    const bike = await prisma.motorbike.create({
      data: {
        userId: s.user.id,
        name: parsed.name,
        make: parsed.make || null,
        model: parsed.model || null,
        year: typeof parsed.year === "number" ? parsed.year : null,
      },
    });

    const startingKm = typeof parsed.startingKm === "number" ? parsed.startingKm : 0;
    if (startingKm > 0) {
      await prisma.odometerLog.create({
        data: { motorbikeId: bike.id, km: startingKm, note: "Starting km" },
      });
    }

    await seedDefaultReminders(bike.id);
    redirect(ROUTES.motorbike(bike.id));
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Add motorbike</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Just the essentials. You can fill in more later.
          </p>
        </div>
        <Link
          href={ROUTES.dashboard}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          Cancel
        </Link>
      </div>

      <Card padding="lg">
        <form action={addBike} className="space-y-5">
          <FormField label="Name" htmlFor="name" required hint="How you'll see it in your garage.">
            <input id="name" name="name" required maxLength={60} placeholder="My ride" className={inputClass} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Make" htmlFor="make">
              <input id="make" name="make" maxLength={40} placeholder="Honda" className={inputClass} />
            </FormField>
            <FormField label="Model" htmlFor="model">
              <input id="model" name="model" maxLength={40} placeholder="CB150F" className={inputClass} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Year" htmlFor="year">
              <input
                id="year"
                name="year"
                type="number"
                min={1900}
                max={2100}
                placeholder="2022"
                className={inputClass}
              />
            </FormField>
            <FormField
              label="Starting km"
              htmlFor="startingKm"
              hint="If you've already ridden it, start the counter from here."
            >
              <input
                id="startingKm"
                name="startingKm"
                type="number"
                min={0}
                max={1_000_000}
                placeholder="0"
                className={inputClass}
              />
            </FormField>
          </div>

          <Button type="submit" full size="lg">
            Save motorbike
          </Button>
        </form>
      </Card>
    </div>
  );
}
