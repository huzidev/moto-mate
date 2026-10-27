import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueCode, RateLimitedError } from "@/lib/auth-codes";
import { ROUTES } from "@/constants";
import { AuthShell } from "@/components/AuthShell";
import { FormField, inputClass } from "@/components/FormField";
import { Button } from "@/components/Button";

const schema = z.object({ email: z.string().trim().email().toLowerCase() });

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  async function sendReset(formData: FormData) {
    "use server";
    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      redirect(`${ROUTES.forgotPassword}?error=${encodeURIComponent("Enter a valid email.")}`);
    }
    const email = parsed.data!.email;

    const user = await prisma.user.findUnique({ where: { email } });
    // ponytail: don't leak which emails exist — always redirect to the reset page.
    if (user) {
      try {
        await issueCode({
          userId: user.id,
          purpose: "PASSWORD_RESET",
          email: user.email,
          name: user.name,
        });
      } catch (e) {
        if (e instanceof RateLimitedError) {
          return redirect(
            `${ROUTES.resetPassword}?email=${encodeURIComponent(email)}&error=${encodeURIComponent(e.message)}`,
          );
        }
        // Email send failure or anything else — surface so the user doesn't sit in silence.
        return redirect(
          `${ROUTES.forgotPassword}?error=${encodeURIComponent((e as Error).message)}`,
        );
      }
    }

    redirect(`${ROUTES.resetPassword}?email=${encodeURIComponent(email)}`);
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send a 6-digit reset code."
      footer={
        <>
          Remembered it?{" "}
          <Link href={ROUTES.signin} className="font-medium text-brand-500 hover:text-brand-600">
            Sign in
          </Link>
        </>
      }
    >
      <form action={sendReset} className="space-y-4">
        {sp.error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {sp.error}
          </div>
        )}
        <FormField label="Email" htmlFor="email" required>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClass}
          />
        </FormField>
        <Button type="submit" full size="lg">
          Send reset code
        </Button>
      </form>
    </AuthShell>
  );
}
