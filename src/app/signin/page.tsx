import { signIn } from "@/lib/auth";
import { APP, ROUTES } from "@/constants";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function SignInPage() {
  if (await auth()) redirect(ROUTES.dashboard);

  async function sendLink(formData: FormData) {
    "use server";
    await signIn("resend", {
      email: String(formData.get("email")),
      redirectTo: ROUTES.dashboard,
    });
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <form
        action={sendLink}
        className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div>
          <h1 className="text-xl font-semibold">Sign in to {APP.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">We'll email you a magic link.</p>
        </div>
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="h-10 w-full rounded-md border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
        />
        <button
          type="submit"
          className="h-10 w-full rounded-md bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Send magic link
        </button>
      </form>
    </main>
  );
}
