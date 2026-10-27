import Link from "next/link";
import { APP, ROUTES } from "@/constants";

export default function CheckEmailPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold">Check your inbox</h1>
        <p className="text-sm text-zinc-500">
          We sent a sign-in link to your email. Open it on this device to continue to {APP.name}.
        </p>
        <p className="text-xs text-zinc-400">
          No email after a minute? Check spam, or{" "}
          <Link href={ROUTES.signin} className="underline hover:text-zinc-900 dark:hover:text-zinc-100">
            try again
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
