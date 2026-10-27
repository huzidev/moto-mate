import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { consumeCode, issueCode } from "@/lib/auth-codes";
import { hashPassword } from "@/lib/password";
import { ROUTES } from "@/constants";
import { AuthShell } from "@/components/AuthShell";
import { FormField, inputClass } from "@/components/FormField";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/Button";

const schema = z
  .object({
    email: z.string().trim().email().toLowerCase(),
    code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; resent?: string }>;
}) {
  const sp = await searchParams;
  const email = sp.email ?? "";

  if (!email) redirect(ROUTES.forgotPassword);

  async function doReset(formData: FormData) {
    "use server";
    const parsed = schema.safeParse(Object.fromEntries(formData));
    const emailParam = String(formData.get("email") ?? "");
    const back = (msg: string) =>
      redirect(`${ROUTES.resetPassword}?email=${encodeURIComponent(emailParam)}&error=${encodeURIComponent(msg)}`);

    if (!parsed.success) return back(parsed.error.issues[0]?.message ?? "Invalid input");

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return back("No account found for that email.");

    try {
      await consumeCode({ userId: user.id, purpose: "PASSWORD_RESET", code: parsed.data.code });
    } catch (e) {
      return back((e as Error).message);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    });

    redirect(`${ROUTES.signin}?reset=1&email=${encodeURIComponent(user.email)}`);
  }

  async function resend(formData: FormData) {
    "use server";
    const emailParam = String(formData.get("email") ?? "").trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: emailParam } });
    if (user) {
      await issueCode({
        userId: user.id,
        purpose: "PASSWORD_RESET",
        email: user.email,
        name: user.name,
      });
    }
    redirect(`${ROUTES.resetPassword}?email=${encodeURIComponent(emailParam)}&resent=1`);
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle={`Enter the 6-digit code sent to ${email} and choose a new password.`}
      footer={
        <>
          Wrong email?{" "}
          <Link href={ROUTES.forgotPassword} className="font-medium text-brand-500 hover:text-brand-600">
            Start over
          </Link>
        </>
      }
    >
      <form action={doReset} className="space-y-4">
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

        <FormField label="New password" htmlFor="password" required hint="At least 8 characters.">
          <PasswordInput
            id="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </FormField>

        <FormField label="Confirm new password" htmlFor="confirm" required>
          <PasswordInput
            id="confirm"
            name="confirm"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </FormField>

        <Button type="submit" full size="lg">
          Update password
        </Button>
      </form>

      <form action={resend} className="mt-4 text-center text-xs text-muted">
        <input type="hidden" name="email" value={email} />
        Didn't get the code?{" "}
        <button type="submit" className="font-medium text-brand-500 hover:text-brand-600">
          Resend
        </button>
      </form>
    </AuthShell>
  );
}
