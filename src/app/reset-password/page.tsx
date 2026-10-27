import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ROUTES } from "@/constants";
import { consumeResetToken } from "@/lib/password-reset";
import { AuthShell } from "@/components/AuthShell";
import { FormField, inputClass } from "@/components/FormField";
import { Button } from "@/components/Button";

const schema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const sp = await searchParams;

  if (!sp.token) {
    return (
      <AuthShell title="Reset link missing" subtitle="This URL is incomplete.">
        <Link href={ROUTES.forgotPassword} className="text-sm text-brand-500 hover:text-brand-600">
          Request a new reset link →
        </Link>
      </AuthShell>
    );
  }

  async function doReset(formData: FormData) {
    "use server";
    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid input";
      return redirect(
        `${ROUTES.resetPassword}?token=${encodeURIComponent(String(formData.get("token")))}&error=${encodeURIComponent(msg)}`,
      );
    }
    try {
      await consumeResetToken(parsed.data.token, parsed.data.password);
    } catch (e) {
      return redirect(
        `${ROUTES.resetPassword}?token=${encodeURIComponent(parsed.data.token)}&error=${encodeURIComponent((e as Error).message)}`,
      );
    }
    redirect(`${ROUTES.signin}?reset=1`);
  }

  return (
    <AuthShell title="Set a new password" subtitle="Pick something only you'd remember.">
      <form action={doReset} className="space-y-4">
        <input type="hidden" name="token" value={sp.token} />
        {sp.error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {sp.error}
          </div>
        )}
        <FormField label="New password" htmlFor="password" required hint="Minimum 8 characters.">
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </FormField>
        <FormField label="Confirm new password" htmlFor="confirm" required>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </FormField>
        <Button type="submit" full size="lg">
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
