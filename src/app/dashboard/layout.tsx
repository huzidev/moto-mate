import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { APP, ROUTES } from "@/constants";
import { Button } from "@/components/Button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect(ROUTES.signin);

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: ROUTES.home });
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
          <Link href={ROUTES.dashboard} className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500 text-white">
              M
            </span>
            {APP.name}
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-[var(--muted)] sm:inline">
              {session.user.name ?? session.user.email}
            </span>
            <form action={doSignOut}>
              <Button variant="ghost" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</div>
    </div>
  );
}
