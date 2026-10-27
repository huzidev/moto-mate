import Link from "next/link";
import { APP, ROUTES } from "@/constants";

// Landing stays env-independent on purpose: a public page shouldn't require
// a database connection to render. Auth-gated routing happens in /signin and
// /dashboard, both of which pull in auth lazily.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        {APP.name}
      </h1>
      <p className="mt-4 max-w-md text-zinc-600 dark:text-zinc-400">
        {APP.tagline}
      </p>
      <Link
        href={ROUTES.signin}
        className="mt-8 inline-flex h-11 items-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Sign in
      </Link>
    </main>
  );
}
