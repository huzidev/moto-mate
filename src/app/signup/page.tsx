import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { issueCode } from "@/lib/auth-codes";
import { ROUTES } from "@/constants";
import { AuthShell } from "@/components/AuthShell";
import { FormField, inputClass } from "@/components/FormField";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/Button";

const schema = z
  .object({
    name: z.string().trim().min(1, "Enter your name").max(60),
    email: z.string().trim().email().toLowerCase(),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string; name?: string; phone?: string }>;
}) {
  if (await auth()) redirect(ROUTES.dashboard);
  const sp = await searchParams;

  async function doSignUp(formData: FormData) {
    "use server";
    const raw = Object.fromEntries(formData);
    const parsed = schema.safeParse(raw);

    const back = (msg: string) =>
      redirect(
        `${ROUTES.signup}?error=${encodeURIComponent(msg)}&name=${encodeURIComponent(String(raw.name ?? ""))}&email=${encodeURIComponent(String(raw.email ?? ""))}&phone=${encodeURIComponent(String(raw.phone ?? ""))}`,
      );

    if (!parsed.success) return back(parsed.error.issues[0]?.message ?? "Invalid input");

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      // Unverified → let them re-verify. Verified → tell them to sign in.
      if (!existing.emailVerifiedAt) {
        await issueCode({
          userId: existing.id,
          purpose: "EMAIL_VERIFICATION",
          email: existing.email,
          name: existing.name,
        });
        return redirect(`${ROUTES.verifyEmail}?email=${encodeURIComponent(existing.email)}`);
      }
      return back("An account with that email already exists.");
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        passwordHash: await hashPassword(parsed.data.password),
      },
    });

    await issueCode({
      userId: user.id,
      purpose: "EMAIL_VERIFICATION",
      email: user.email,
      name: user.name,
    });

    redirect(`${ROUTES.verifyEmail}?email=${encodeURIComponent(user.email)}`);
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start tracking mileage, fuel, and service."
      footer={
        <>
          Already have one?{" "}
          <Link href={ROUTES.signin} className="font-medium text-brand-500 hover:text-brand-600">
            Sign in
          </Link>
        </>
      }
    >
      <form action={doSignUp} className="space-y-4">
        {sp.error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {sp.error}
          </div>
        )}
        <FormField label="Name" htmlFor="name" required>
          <input
            id="name"
            name="name"
            required
            maxLength={60}
            defaultValue={sp.name ?? ""}
            autoComplete="name"
            placeholder="Huzaifa"
            className={inputClass}
          />
        </FormField>
        <FormField label="Email" htmlFor="email" required>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={sp.email ?? ""}
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClass}
          />
        </FormField>
        <FormField label="Phone / WhatsApp" htmlFor="phone" hint="Optional. For future SMS/WhatsApp reminders.">
          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={30}
            defaultValue={sp.phone ?? ""}
            autoComplete="tel"
            placeholder="+92 300 1234567"
            className={inputClass}
          />
        </FormField>
        <FormField label="Password" htmlFor="password" required hint="At least 8 characters.">
          <PasswordInput
            id="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </FormField>
        <FormField label="Confirm password" htmlFor="confirm" required>
          <PasswordInput
            id="confirm"
            name="confirm"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </FormField>
        <Button type="submit" full size="lg">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
