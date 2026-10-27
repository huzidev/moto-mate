import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBikeWithStats } from "@/lib/motorbikes";
import { computeFuelStats } from "@/lib/fuel";
import { ROUTES } from "@/constants";
import { Card } from "@/components/Card";
import { LinkButton } from "@/components/Button";

const statusStyle = {
  due: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  soon: "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  ok: "bg-[var(--surface-muted)] text-[var(--muted)]",
};

export default async function MotorbikeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);

  const bike = await getBikeWithStats(id, session.user.id);
  if (!bike) notFound();

  const fuelLogs = await prisma.fuelLog.findMany({
    where: { motorbikeId: bike.id },
    orderBy: { filledAt: "desc" },
  });
  const fuel = computeFuelStats(fuelLogs);

  const meta = [bike.make, bike.model, bike.year].filter(Boolean).join(" · ") || "No details yet";

  const tripCount = bike.odometerLogs.length;

  return (
    <div className="space-y-10">
      <header>
        <Link
          href={ROUTES.dashboard}
          className="text-xs text-muted hover:text-foreground"
        >
          ← Garage
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{bike.name}</h1>
            <p className="mt-1 text-sm text-muted">{meta}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Lifetime mileage
            </div>
            <div className="mt-1 flex items-baseline justify-end gap-1.5">
              <span className="text-5xl font-semibold tabular-nums text-brand-500">
                {bike.lifetimeKm.toLocaleString()}
              </span>
              <span className="text-sm text-muted">km</span>
            </div>
            <div className="mt-0.5 text-xs text-muted">
              across {tripCount} {tripCount === 1 ? "log" : "logs"}
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Service counters</h2>
          <LinkButton href={ROUTES.reminders(bike.id)} variant="secondary" size="sm">
            Configure
          </LinkButton>
        </div>
        {bike.counters.length === 0 ? (
          <Card padding="md" className="mt-4 text-sm text-[var(--muted)]">
            No active reminders. Add some to get notified.
          </Card>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bike.counters.map((c) => {
              const pct = Math.min(100, Math.round((c.sinceKm / c.reminder.intervalKm) * 100));
              return (
                <li key={c.reminder.id}>
                  <Card padding="md">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.typeLabel}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle[c.status]}`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-[var(--muted)]">
                      <span className="tabular-nums text-[var(--foreground)]">
                        {c.sinceKm.toLocaleString()}
                      </span>{" "}
                      / {c.reminder.intervalKm.toLocaleString()} km
                      {c.sinceDays != null && <> · {c.sinceDays}d</>}
                    </div>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                      <div
                        className={`h-full transition-all ${
                          c.status === "due"
                            ? "bg-red-500"
                            : c.status === "soon"
                              ? "bg-brand-500"
                              : "bg-[var(--border-strong)]"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Fuel economy</h2>
          <LinkButton href={ROUTES.logFuel(bike.id)} size="sm">
            + Log fuel
          </LinkButton>
        </div>
        {fuel.logs.length === 0 ? (
          <Card padding="md" className="mt-4 text-sm text-muted">
            No fuel logged yet. Log your first fillup to start tracking km/L.
          </Card>
        ) : fuel.logs.length === 1 ? (
          <Card padding="md" className="mt-4 text-sm text-muted">
            Baseline recorded ({fuel.logs[0].liters.toFixed(2)} L).
            Log one more fillup to see km/L.
          </Card>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Last tank"
                value={formatKmPerL(fuel.lastTankKmPerLiter)}
                sub="km / L"
                accent
              />
              <StatCard
                label="Rolling avg"
                value={formatKmPerL(fuel.rollingKmPerLiter)}
                sub="km / L"
              />
              <StatCard
                label="Fuel used"
                value={fuel.totalLiters.toFixed(1)}
                sub="L across tracked tanks"
              />
              <StatCard
                label="Spent"
                value={fuel.totalCost != null ? fuel.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
                sub="total recorded"
              />
            </div>
            <Card padding="none" className="mt-4 overflow-hidden">
              <ul className="divide-y divide-[var(--border)]">
                {fuel.logs.slice().reverse().slice(0, 10).map((l) => (
                  <li key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <span className="font-medium tabular-nums">{l.liters.toFixed(2)} L</span>
                      <span className="ml-2 text-xs text-muted tabular-nums">@ {l.atLifetimeKm.toLocaleString()} km</span>
                      {l.totalCost != null && (
                        <span className="ml-2 text-xs text-muted tabular-nums">· {l.totalCost.toLocaleString()}</span>
                      )}
                      {l.note && <span className="ml-2 text-xs text-muted">· {l.note}</span>}
                    </div>
                    <span className="text-xs text-muted">{l.filledAt.toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recent trips</h2>
          <LinkButton href={ROUTES.logTrip(bike.id)} size="sm">
            + Log a trip
          </LinkButton>
        </div>
        {bike.odometerLogs.length === 0 ? (
          <Card padding="md" className="mt-4 text-sm text-[var(--muted)]">
            Nothing logged yet.
          </Card>
        ) : (
          <Card padding="none" className="mt-4 overflow-hidden">
            <ul className="divide-y divide-[var(--border)]">
              {bike.odometerLogs.slice(0, 10).map((l) => (
                <li key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <span className="font-medium tabular-nums">+{l.km.toLocaleString()} km</span>
                    {l.note && (
                      <span className="ml-2 text-[var(--muted)]">· {l.note}</span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--muted)]">
                    {l.loggedAt.toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Service history</h2>
          <LinkButton href={ROUTES.recordService(bike.id)} variant="secondary" size="sm">
            Record service
          </LinkButton>
        </div>
        {bike.serviceEvents.length === 0 ? (
          <Card padding="md" className="mt-4 text-sm text-[var(--muted)]">
            No services recorded yet.
          </Card>
        ) : (
          <Card padding="none" className="mt-4 overflow-hidden">
            <ul className="divide-y divide-[var(--border)]">
              {bike.serviceEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <span className="font-medium">
                      {e.label ?? e.type.replace("_", " ").toLowerCase()}
                    </span>
                    <span className="ml-2 text-[var(--muted)] tabular-nums">
                      @ {e.atLifetimeKm.toLocaleString()} km
                    </span>
                  </div>
                  <span className="text-xs text-[var(--muted)]">
                    {e.performedAt.toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card padding="md">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-semibold tabular-nums ${accent ? "text-brand-500" : ""}`}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </Card>
  );
}

function formatKmPerL(x: number | null) {
  if (x == null || !isFinite(x)) return "—";
  return x.toFixed(1);
}

