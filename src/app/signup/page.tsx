import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { ROUTES } from "@/constants";
import { AuthShell } from "@/components/AuthShell";
import { FormField, inputClass } from "@/components/FormField";
import { Button } from "@/components/Button";

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(60),
  email: z.string().trim().email().toLowerCase(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  password: z.string().min(8, "At least 8 characters"),
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
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid input";
      return redirect(
        `${ROUTES.signup}?error=${encodeURIComponent(msg)}&name=${encodeURIComponent(String(raw.name ?? ""))}&email=${encodeURIComponent(String(raw.email ?? ""))}&phone=${encodeURIComponent(String(raw.phone ?? ""))}`,
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return redirect(
        `${ROUTES.signup}?error=${encodeURIComponent("An account with that email already exists.")}&email=${encodeURIComponent(parsed.data.email)}`,
      );
    }

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        passwordHash: await hashPassword(parsed.data.password),
      },
    });

    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: ROUTES.dashboard,
    });
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
        <FormField label="Password" htmlFor="password" required hint="Minimum 8 characters.">
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
        <Button type="submit" full size="lg">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
