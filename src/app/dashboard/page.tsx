import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROUTES, VEHICLE_TYPES } from "@/constants";
import { LinkButton } from "@/components/Button";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const bikes = await prisma.motorbike.findMany({
    where: { userId },
    include: { odometerLogs: { select: { km: true } } },
    orderBy: { createdAt: "desc" },
  });

  const bikesWithKm = bikes.map((b) => ({
    ...b,
    lifetimeKm: b.odometerLogs.reduce((s, l) => s + l.km, 0),
  }));

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your garage</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Every ride, every service, every km. In one place.
            </p>
          </div>
          {bikesWithKm.length > 0 && (
            <LinkButton href={ROUTES.addMotorbike} size="md">
              + Add motorbike
            </LinkButton>
          )}
        </div>

        {bikesWithKm.length === 0 ? (
          <EmptyGarage />
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bikesWithKm.map((b) => (
              <li key={b.id}>
                <Link
                  href={ROUTES.motorbike(b.id)}
                  className="group flex h-full flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-brand-500 hover:shadow-md"
                >
                  <div>
                    <div className="text-base font-semibold">{b.name}</div>
                    <div className="mt-0.5 text-xs text-[var(--muted)]">
                      {[b.make, b.model, b.year].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-semibold tabular-nums">
                        {b.lifetimeKm.toLocaleString()}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        lifetime km
                      </div>
                    </div>
                    <span className="text-xs text-[var(--muted)] transition group-hover:text-brand-500">
                      Open →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {bikesWithKm.length === 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[var(--muted)]">What's coming</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-3 text-sm text-[var(--muted)]">
              <div className="font-medium text-[var(--foreground)]">{VEHICLE_TYPES.car.label}</div>
              <div className="text-xs">Coming soon.</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyGarage() {
  return (
    <div className="mt-6 rounded-2xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]/40 px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-2xl">
        🏍️
      </div>
      <h3 className="mt-4 text-base font-semibold">Add your first motorbike</h3>
      <p className="mx-auto mt-1 max-w-xs text-sm text-[var(--muted)]">
        Set it up once and we'll track every km, every fill-up, and nag you when service is due.
      </p>
      <div className="mt-5 flex items-center justify-center gap-3">
        <LinkButton href={ROUTES.addMotorbike} size="md">
          + Add motorbike
        </LinkButton>
        <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
          Car · coming soon
        </span>
      </div>
    </div>
  );
}
