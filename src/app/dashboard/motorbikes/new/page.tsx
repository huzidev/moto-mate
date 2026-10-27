import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/constants";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  make: z.string().trim().max(40).optional().or(z.literal("")),
  model: z.string().trim().max(40).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("")),
  plate: z.string().trim().max(20).optional().or(z.literal("")),
});

const input =
  "h-10 w-full rounded-md border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const label = "block text-xs font-medium text-zinc-500";

export default async function NewMotorbikePage() {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);

  async function addBike(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect(ROUTES.signin);

    const parsed = schema.parse(Object.fromEntries(formData));
    await prisma.motorbike.create({
      data: {
        userId: s.user.id,
        name: parsed.name,
        make: parsed.make || null,
        model: parsed.model || null,
        year: typeof parsed.year === "number" ? parsed.year : null,
        plate: parsed.plate || null,
      },
    });
    redirect(ROUTES.dashboard);
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
        <div className="space-y-1">
          <label htmlFor="name" className={label}>Name <span className="text-red-500">*</span></label>
          <input id="name" name="name" required maxLength={60} placeholder="My Ride" className={input} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="make" className={label}>Make</label>
            <input id="make" name="make" maxLength={40} placeholder="Honda" className={input} />
          </div>
          <div className="space-y-1">
            <label htmlFor="model" className={label}>Model</label>
            <input id="model" name="model" maxLength={40} placeholder="CB150F" className={input} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="year" className={label}>Year</label>
            <input id="year" name="year" type="number" min={1900} max={2100} placeholder="2022" className={input} />
          </div>
          <div className="space-y-1">
            <label htmlFor="plate" className={label}>Plate</label>
            <input id="plate" name="plate" maxLength={20} placeholder="ABC-123" className={input} />
          </div>
        </div>

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
