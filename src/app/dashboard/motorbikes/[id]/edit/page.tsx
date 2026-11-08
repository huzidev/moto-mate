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
  name: z.string().trim().min(1).max(60),
  make: z.string().trim().max(40).optional().or(z.literal("")),
  model: z.string().trim().max(40).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("")),
  plate: z.string().trim().max(20).optional().or(z.literal("")),
  city: z.string().trim().max(60).optional().or(z.literal("")),
});

export default async function EditMotorbikePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);

  const bike = await prisma.motorbike.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      name: true,
      make: true,
      model: true,
      year: true,
      plate: true,
      city: true,
    },
  });
  if (!bike) notFound();

  async function editMotorbike(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);

    const owned = await prisma.motorbike.findFirst({
      where: { id, userId: s.user.id },
      select: { id: true },
    });
    if (!owned) notFound();

    const parsed = schema.parse(Object.fromEntries(formData));
    await prisma.motorbike.update({
      where: { id },
      data: {
        name: parsed.name,
        make: parsed.make || null,
        model: parsed.model || null,
        year: typeof parsed.year === "number" ? parsed.year : null,
        plate: parsed.plate || null,
        city: parsed.city || null,
      },
    });

    revalidatePath(ROUTES.motorbike(id));
    redirect(ROUTES.motorbike(id));
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6">
        <Link href={ROUTES.motorbike(id)} className="text-xs text-muted hover:text-foreground">
          ← {bike.name}
        </Link>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Edit bike</h1>
      </div>

      <Card padding="lg">
        <form action={editMotorbike} className="space-y-5">
          <FormField label="Name" htmlFor="name" required hint="How you'll see it in your garage.">
            <input
              id="name"
              name="name"
              required
              maxLength={60}
              defaultValue={bike.name}
              className={inputClass}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Make" htmlFor="make">
              <input
                id="make"
                name="make"
                maxLength={40}
                defaultValue={bike.make ?? ""}
                placeholder="Honda"
                className={inputClass}
              />
            </FormField>
            <FormField label="Model" htmlFor="model">
              <input
                id="model"
                name="model"
                maxLength={40}
                defaultValue={bike.model ?? ""}
                placeholder="CB150F"
                className={inputClass}
              />
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
                defaultValue={bike.year ?? ""}
                placeholder="2022"
                className={inputClass}
              />
            </FormField>
            <FormField label="Plate" htmlFor="plate">
              <input
                id="plate"
                name="plate"
                maxLength={20}
                defaultValue={bike.plate ?? ""}
                placeholder="ABC-123"
                className={inputClass}
              />
            </FormField>
          </div>

          <FormField
            label="City"
            htmlFor="city"
            hint="Where it lives — helps future AI tips factor local weather."
          >
            <input
              id="city"
              name="city"
              maxLength={60}
              defaultValue={bike.city ?? ""}
              placeholder="Karachi"
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
