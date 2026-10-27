import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROUTES, VEHICLE_TYPES } from "@/constants";
import { VehicleStartCard } from "@/components/VehicleStartCard";

export default async function DashboardPage() {
  const session = await auth();
  const bikes = await prisma.motorbike.findMany({
    where: { userId: session!.user!.id! },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10">
      <section>
        <h2 className="text-lg font-semibold">Your vehicles</h2>
        {bikes.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Nothing yet — add one below.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {bikes.map((b) => (
              <li key={b.id}>
                <Link
                  href={ROUTES.motorbike(b.id)}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-100"
                >
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-zinc-500">
                    {[b.make, b.model, b.year].filter(Boolean).join(" · ") || "—"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Add a vehicle</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <VehicleStartCard
            label={VEHICLE_TYPES.motorbike.label}
            href={ROUTES.addMotorbike}
          />
          <VehicleStartCard label={VEHICLE_TYPES.car.label} comingSoon />
        </div>
      </section>
    </div>
  );
}
