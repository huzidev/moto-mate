import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBikeWithStats } from "@/lib/motorbikes";
import { bucketFuelForChart, computeFuelStats } from "@/lib/fuel";
import { bucketExpensesForChart, computeExpenseStats } from "@/lib/expenses";
import { ROUTES } from "@/constants";
import { Card } from "@/components/Card";
import { LinkButton } from "@/components/Button";
import { EditLink } from "@/components/EditLink";
import { ServiceCounterList } from "@/components/ServiceCounterList";
import { LineChart } from "@/components/LineChart";
import { InfoTip } from "@/components/InfoTip";
import { BackLink } from "@/components/BackLink";
import { DeleteRowButton } from "@/components/DeleteRowButton";
import {
  deleteExpense,
  deleteFuelLog,
  deleteOdometerLog,
  deleteServiceEvent,
} from "@/lib/log-actions";

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
  const fuelMonthData = bucketFuelForChart(fuelLogs, "month");

  const expenses = await prisma.expense.findMany({
    where: { motorbikeId: bike.id },
    orderBy: { spentAt: "desc" },
  });
  const expenseStats = computeExpenseStats(expenses);
  const expenseMonthData = bucketExpensesForChart(expenses, "month");

  const meta = [bike.make, bike.model, bike.year].filter(Boolean).join(" · ") || "No details yet";

  const tripCount = bike.odometerLogs.length;

  return (
    <div className="space-y-10">
      <header>
        <BackLink href={ROUTES.dashboard} label="Garage" />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{bike.name}</h1>
              <EditLink href={ROUTES.editMotorbike(bike.id)} label="Edit bike" />
            </div>
            <p className="mt-1 text-sm text-muted">{meta}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              Lifetime mileage
              <InfoTip label="About lifetime mileage">
                Built from {tripCount} {tripCount === 1 ? "trip log" : "trip logs"}.
                Odometer resets don't affect this number.
              </InfoTip>
            </div>
            <div className="mt-1 flex items-baseline justify-end gap-1.5">
              <span className="text-5xl font-semibold tabular-nums text-brand-500">
                {bike.lifetimeKm.toLocaleString()}
              </span>
              <span className="text-sm text-muted">km</span>
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
        <ServiceCounterList
          counters={bike.counters.map((c) => ({
            id: c.reminder.id,
            typeLabel: c.typeLabel,
            intervalKm: c.reminder.intervalKm,
            sinceKm: c.sinceKm,
            sinceDays: c.sinceDays,
            status: c.status,
          }))}
        />
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Fuel economy</h2>
          <div className="flex items-center gap-2">
            <LinkButton
              href={`${ROUTES.analytics(bike.id)}`}
              variant="ghost"
              size="sm"
            >
              View analytics →
            </LinkButton>
            <LinkButton href={ROUTES.logFuel(bike.id)} size="sm">
              + Log fuel
            </LinkButton>
          </div>
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
            <Card padding="md" className="mt-4">
              <LineChart
                data={fuelMonthData}
                seriesLabel="km / L"
                mini
                emptyLabel="Not enough data yet."
              />
            </Card>
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
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted">{l.filledAt.toLocaleDateString()}</span>
                      <EditLink href={ROUTES.editFuel(bike.id, l.id)} label="Edit fillup" />
                      <DeleteRowButton
                        action={deleteFuelLog.bind(null, l.id)}
                        entityLabel="fillup"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Expenses</h2>
          <div className="flex items-center gap-2">
            <LinkButton
              href={`${ROUTES.analytics(bike.id)}?tab=expenses`}
              variant="ghost"
              size="sm"
            >
              View analytics →
            </LinkButton>
            <LinkButton href={ROUTES.logExpense(bike.id)} size="sm">
              + Log expense
            </LinkButton>
          </div>
        </div>
        {expenses.length === 0 ? (
          <Card padding="md" className="mt-4 text-sm text-muted">
            No expenses logged yet. Repairs, parts, accessories — anything that
            cost money lands here.
          </Card>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Total spent"
                value={expenseStats.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                sub="across all logged"
                accent
              />
              <StatCard
                label="Entries"
                value={String(expenseStats.count)}
                sub={expenseStats.count === 1 ? "expense" : "expenses"}
              />
              <StatCard
                label="Last"
                value={
                  expenseStats.lastSpent
                    ? expenseStats.lastSpent.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })
                    : "—"
                }
                sub={expenseStats.lastSpent ? expenseStats.lastSpent.spentAt.toLocaleDateString() : ""}
              />
            </div>
            <Card padding="md" className="mt-4">
              <LineChart
                data={expenseMonthData}
                seriesLabel="Spent"
                yFormat="integer"
                mini
                emptyLabel="No spend yet."
              />
            </Card>
            <Card padding="none" className="mt-4 overflow-hidden">
              <ul className="divide-y divide-[var(--border)]">
                {expenses.slice(0, 10).map((e) => (
                  <li key={e.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium tabular-nums">
                        {e.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      {e.category && (
                        <span className="ml-2 text-xs text-muted">· {e.category}</span>
                      )}
                      {e.reason && (
                        <span className="ml-2 truncate text-xs text-muted">· {e.reason}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted">{e.spentAt.toLocaleDateString()}</span>
                      <EditLink href={ROUTES.editExpense(bike.id, e.id)} label="Edit expense" />
                      <DeleteRowButton
                        action={deleteExpense.bind(null, e.id)}
                        entityLabel="expense"
                      />
                    </div>
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
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[var(--muted)]">
                      {l.loggedAt.toLocaleDateString()}
                    </span>
                    <EditLink href={ROUTES.editTrip(bike.id, l.id)} label="Edit trip" />
                    <DeleteRowButton
                      action={deleteOdometerLog.bind(null, l.id)}
                      entityLabel="trip"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Service history</h2>
          <LinkButton href={ROUTES.recordService(bike.id)} size="sm">
            + Log service
          </LinkButton>
        </div>
        {bike.serviceEvents.length === 0 ? (
          <Card padding="md" className="mt-4 text-sm text-[var(--muted)]">
            No services recorded yet. Mark one done on the reminders page.
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
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[var(--muted)]">
                      {e.performedAt.toLocaleDateString()}
                    </span>
                    <EditLink href={ROUTES.editService(bike.id, e.id)} label="Edit service" />
                    <DeleteRowButton
                      action={deleteServiceEvent.bind(null, e.id)}
                      entityLabel="service entry"
                    />
                  </div>
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

