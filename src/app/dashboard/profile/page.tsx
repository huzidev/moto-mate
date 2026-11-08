import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/constants";
import { Card } from "@/components/Card";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, emailVerifiedAt: true },
  });
  if (!user) redirect(ROUTES.signin);

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Your account details. Editing coming soon.
      </p>

      <Card padding="lg" className="mt-6">
        <dl className="divide-y divide-[var(--border)]">
          <Row label="Name" value={user.name ?? "—"} />
          <Row label="Email" value={user.email} />
          <Row label="Phone" value={user.phone ?? "—"} />
          <Row label="Verified" value={user.emailVerifiedAt ? "Yes" : "No"} />
        </dl>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="text-[var(--foreground)]">{value}</dd>
    </div>
  );
}
