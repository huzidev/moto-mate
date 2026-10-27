import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueCode, consumeCode } from "@/lib/auth-codes";
import { ROUTES } from "@/constants";
import { AuthShell } from "@/components/AuthShell";
import { FormField, inputClass } from "@/components/FormField";
import { Button } from "@/components/Button";

const codeSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
});

const resendSchema = z.object({ email: z.string().trim().email().toLowerCase() });

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; resent?: string }>;
}) {
  const sp = await searchParams;
  const email = sp.email ?? "";

  if (!email) redirect(ROUTES.signin);

  async function verify(formData: FormData) {
    "use server";
    const parsed = codeSchema.safeParse(Object.fromEntries(formData));
    const emailParam = String(formData.get("email") ?? "");
    const back = (msg: string) =>
      redirect(`${ROUTES.verifyEmail}?email=${encodeURIComponent(emailParam)}&error=${encodeURIComponent(msg)}`);

    if (!parsed.success) return back(parsed.error.issues[0]?.message ?? "Invalid code");

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return back("No account found for that email.");

    try {
      await consumeCode({ userId: user.id, purpose: "EMAIL_VERIFICATION", code: parsed.data.code });
    } catch (e) {
      return back((e as Error).message);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    // ponytail: can't auto-signin here (we don't have the password); send to signin
    // with a success flag. User enters password once and lands in dashboard.
    redirect(`${ROUTES.signin}?verified=1&email=${encodeURIComponent(user.email)}`);
  }

  async function resend(formData: FormData) {
    "use server";
    const parsed = resendSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return;
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || user.emailVerifiedAt) {
      return redirect(`${ROUTES.verifyEmail}?email=${encodeURIComponent(parsed.data.email)}&resent=1`);
    }
    await issueCode({
      userId: user.id,
      purpose: "EMAIL_VERIFICATION",
      email: user.email,
      name: user.name,
    });
    redirect(`${ROUTES.verifyEmail}?email=${encodeURIComponent(user.email)}&resent=1`);
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email}. Enter it below.`}
      footer={
        <>
          Wrong email?{" "}
          <Link href={ROUTES.signup} className="font-medium text-brand-500 hover:text-brand-600">
            Go back
          </Link>
        </>
      }
    >
      <form action={verify} className="space-y-4">
        <input type="hidden" name="email" value={email} />

        {sp.error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {sp.error}
          </div>
        )}
        {sp.resent && !sp.error && (
          <div className="rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-300">
            A new code has been sent.
          </div>
        )}

        <FormField label="Verification code" htmlFor="code" required>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            placeholder="123456"
            className={`${inputClass} tracking-[0.4em] text-center font-mono text-lg`}
          />
        </FormField>

        <Button type="submit" full size="lg">
          Verify & continue
        </Button>
      </form>

      <form action={resend} className="mt-4 text-center text-xs text-muted">
        <input type="hidden" name="email" value={email} />
        Didn't get it?{" "}
        <button type="submit" className="font-medium text-brand-500 hover:text-brand-600">
          Resend code
        </button>
      </form>
    </AuthShell>
  );
}
