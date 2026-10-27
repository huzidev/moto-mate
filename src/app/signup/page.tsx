import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { issueCode } from "@/lib/auth-codes";
import { ROUTES } from "@/constants";
import { AuthShell } from "@/components/AuthShell";
import { SignupForm } from "./SignupForm";

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
      <SignupForm
        action={doSignUp}
        defaults={{ name: sp.name ?? "", email: sp.email ?? "", phone: sp.phone ?? "" }}
        error={sp.error}
      />
    </AuthShell>
  );
}
