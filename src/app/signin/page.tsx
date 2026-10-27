import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn, auth } from "@/lib/auth";
import { ROUTES } from "@/constants";
import { AuthShell } from "@/components/AuthShell";
import { FormField, inputClass } from "@/components/FormField";
import { Button } from "@/components/Button";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  if (await auth()) redirect(ROUTES.dashboard);
  const sp = await searchParams;

  async function doSignIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: ROUTES.dashboard,
      });
    } catch (err) {
      if ((err as Error).message?.includes("NEXT_REDIRECT")) throw err;
      redirect(`${ROUTES.signin}?error=1&email=${encodeURIComponent(email)}`);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep tracking your ride."
      footer={
        <>
          New here?{" "}
          <Link href={ROUTES.signup} className="font-medium text-brand-500 hover:text-brand-600">
            Create an account
          </Link>
        </>
      }
    >
      <form action={doSignIn} className="space-y-4">
        {sp.error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            Invalid email or password.
          </div>
        )}
        <FormField label="Email" htmlFor="email" required>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={sp.email ?? ""}
            placeholder="you@example.com"
            className={inputClass}
          />
        </FormField>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-medium">
              Password <span className="text-brand-500">*</span>
            </label>
            <Link
              href={ROUTES.forgotPassword}
              className="text-xs text-brand-500 hover:text-brand-600"
            >
              Forgot?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            minLength={8}
            className={inputClass}
          />
        </div>
        <Button type="submit" full size="lg">
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
