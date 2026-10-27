import Link from "next/link";
import { APP, ROUTES } from "@/constants";
import { LinkButton } from "@/components/Button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link href={ROUTES.home} className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white">
            M
          </span>
          {APP.name}
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href={ROUTES.signin}
            className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Sign in
          </Link>
          <LinkButton href={ROUTES.signup} size="sm">
            Get started
          </LinkButton>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:py-24">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          Beta · built for one bike, scaling to many
        </span>
        <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Your bike's true <span className="text-brand-500">lifetime mileage</span>, even when the meter forgets.
        </h1>
        <p className="mt-5 max-w-xl text-base text-[var(--muted)] sm:text-lg">
          {APP.tagline} MotoMate stores every trip as a delta, so odometer resets
          don't lose your history — and it emails you the moment service is actually due.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <LinkButton href={ROUTES.signup} size="lg">
            Create your free account
          </LinkButton>
          <Link
            href={ROUTES.signin}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Already have one? Sign in →
          </Link>
        </div>

        <ul className="mt-14 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {[
            {
              title: "Lifetime mileage",
              body: "Log distance in deltas. Resets don't matter — the total always holds.",
            },
            {
              title: "Smart reminders",
              body: "Oil, tune, custom — emailed when due by km or by time.",
            },
            {
              title: "AI-aware wear",
              body: "Weather & environment factored in, so advice is contextual not generic.",
            },
          ].map((f) => (
            <li
              key={f.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left"
            >
              <div className="text-sm font-semibold">{f.title}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">{f.body}</div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-6 py-6 text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} {APP.name}
      </footer>
    </main>
  );
}
