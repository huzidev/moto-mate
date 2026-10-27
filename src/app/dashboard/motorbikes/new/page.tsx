import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedDefaultReminders } from "@/lib/motorbikes";
import { ROUTES } from "@/constants";
import { FormField, inputClass } from "@/components/FormField";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  make: z.string().trim().max(40).optional().or(z.literal("")),
  model: z.string().trim().max(40).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("")),
  plate: z.string().trim().max(20).optional().or(z.literal("")),
  city: z.string().trim().max(60).optional().or(z.literal("")),
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
        plate: parsed.plate || null,
        city: parsed.city || null,
      },
    });
    await seedDefaultReminders(bike.id);
    redirect(ROUTES.motorbike(bike.id));
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Add motorbike</h1>
        <Link href={ROUTES.dashboard} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          Cancel
        </Link>
      </div>

      <form
        action={addBike}
        className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <FormField label="Name" htmlFor="name" required>
          <input id="name" name="name" required maxLength={60} placeholder="My Ride" className={inputClass} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Make" htmlFor="make">
            <input id="make" name="make" maxLength={40} placeholder="Honda" className={inputClass} />
          </FormField>
          <FormField label="Model" htmlFor="model">
            <input id="model" name="model" maxLength={40} placeholder="CB150F" className={inputClass} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Year" htmlFor="year">
            <input id="year" name="year" type="number" min={1900} max={2100} placeholder="2022" className={inputClass} />
          </FormField>
          <FormField label="Plate" htmlFor="plate">
            <input id="plate" name="plate" maxLength={20} placeholder="ABC-123" className={inputClass} />
          </FormField>
        </div>

        <FormField label="City" htmlFor="city" hint="Used later for weather-aware AI service tips.">
          <input id="city" name="city" maxLength={60} placeholder="Karachi" className={inputClass} />
        </FormField>

        <button
          type="submit"
          className="h-10 w-full rounded-md bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Save motorbike
        </button>
      </form>
    </div>
  );
}
