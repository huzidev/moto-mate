import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { ROUTES } from "@/constants";
import { createResetTokenAndEmail } from "@/lib/password-reset";
import { AuthShell } from "@/components/AuthShell";
import { FormField, inputClass } from "@/components/FormField";
import { Button } from "@/components/Button";

const schema = z.object({ email: z.string().trim().email() });

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const sp = await searchParams;

  async function sendReset(formData: FormData) {
    "use server";
    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (parsed.success) {
      const h = await headers();
      const host = h.get("host") ?? "localhost:3000";
      const proto = h.get("x-forwarded-proto") ?? "http";
      await createResetTokenAndEmail(parsed.data.email, `${proto}://${host}`);
    }
    // Always redirect to the same page — don't leak which emails exist.
    redirect(`${ROUTES.forgotPassword}?sent=1`);
  }

  return (
    <AuthShell
      title={sp.sent ? "Check your inbox" : "Forgot your password?"}
      subtitle={
        sp.sent
          ? "If that email is registered, we sent a reset link. It expires in 30 minutes."
          : "Enter your email and we'll send a reset link."
      }
      footer={
        <>
          Remembered it?{" "}
          <Link href={ROUTES.signin} className="font-medium text-brand-500 hover:text-brand-600">
            Sign in
          </Link>
        </>
      }
    >
      {sp.sent ? (
        <p className="text-sm text-[var(--muted)]">
          Didn't get it? Check spam, or{" "}
          <Link href={ROUTES.forgotPassword} className="text-brand-500 hover:text-brand-600">
            try again
          </Link>
          .
        </p>
      ) : (
        <form action={sendReset} className="space-y-4">
          <FormField label="Email" htmlFor="email" required>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className={inputClass}
            />
          </FormField>
          <Button type="submit" full size="lg">
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
