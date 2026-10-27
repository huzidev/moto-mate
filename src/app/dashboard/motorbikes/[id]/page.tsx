import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBikeWithStats } from "@/lib/motorbikes";
import { ROUTES } from "@/constants";

const statusStyle = {
  due: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  soon: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  ok: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{bike.name}</h1>
          <p className="text-sm text-zinc-500">
            {[bike.make, bike.model, bike.year, bike.plate, bike.city].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold tabular-nums">{bike.lifetimeKm.toLocaleString()}</div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">lifetime km</div>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Service counters</h2>
          <Link href={ROUTES.reminders(bike.id)} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            Configure
          </Link>
        </div>
        {bike.counters.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No active reminders.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {bike.counters.map((c) => (
              <li
                key={c.reminder.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.typeLabel}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${statusStyle[c.status]}`}>
                    {c.status}
                  </span>
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  <span className="tabular-nums">{c.sinceKm.toLocaleString()}</span> / {c.reminder.intervalKm.toLocaleString()} km
                  {c.sinceDays != null && <> · {c.sinceDays}d</>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent trips</h2>
          <Link
            href={ROUTES.logTrip(bike.id)}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Log a trip
          </Link>
        </div>
        {bike.odometerLogs.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No logs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {bike.odometerLogs.slice(0, 10).map((l) => (
              <li key={l.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <span className="font-medium tabular-nums">+{l.km.toLocaleString()} km</span>
                  {l.note && <span className="ml-2 text-zinc-500">{l.note}</span>}
                </div>
                <span className="text-xs text-zinc-500">
                  {l.loggedAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Service history</h2>
          <Link
            href={ROUTES.recordService(bike.id)}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Record service
          </Link>
        </div>
        {bike.serviceEvents.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No services recorded yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {bike.serviceEvents.map((e) => (
              <li key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">{e.label ?? e.type.replace("_", " ").toLowerCase()}</span>
                  <span className="ml-2 text-zinc-500 tabular-nums">@ {e.atLifetimeKm.toLocaleString()} km</span>
                </div>
                <span className="text-xs text-zinc-500">{e.performedAt.toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
