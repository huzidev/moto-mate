import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { APP, ROUTES } from "@/constants";

// Every page under /dashboard is per-user and auth-gated — never prerender.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect(ROUTES.signin);

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: ROUTES.home });
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <Link href={ROUTES.dashboard} className="font-semibold">
          {APP.name}
        </Link>
        <form action={doSignOut}>
          <button className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            Sign out ({session.user.email})
          </button>
        </form>
      </header>
      <div className="flex flex-1 flex-col px-6 py-8">{children}</div>
    </div>
  );
}
