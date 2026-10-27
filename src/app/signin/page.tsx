import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn, auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { issueCode } from "@/lib/auth-codes";
import { ROUTES } from "@/constants";
import { AuthShell } from "@/components/AuthShell";
import { FormField, inputClass } from "@/components/FormField";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/Button";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string; verified?: string; reset?: string }>;
}) {
  if (await auth()) redirect(ROUTES.dashboard);
  const sp = await searchParams;

  async function doSignIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: ROUTES.dashboard,
      });
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (msg.includes("NEXT_REDIRECT")) throw err;

      // Unverified → fire a fresh code and route to verify page.
      if (msg.includes("UNVERIFIED:")) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          await issueCode({
            userId: user.id,
            purpose: "EMAIL_VERIFICATION",
            email: user.email,
            name: user.name,
          });
        }
        redirect(`${ROUTES.verifyEmail}?email=${encodeURIComponent(email)}`);
      }

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
        {sp.verified && (
          <div className="rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-300">
            Email verified — sign in to continue.
          </div>
        )}
        {sp.reset && (
          <div className="rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-300">
            Password updated — sign in with your new password.
          </div>
        )}
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
            <Link href={ROUTES.forgotPassword} className="text-xs text-brand-500 hover:text-brand-600">
              Forgot?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="current-password"
            minLength={8}
          />
        </div>
        <Button type="submit" full size="lg">
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
