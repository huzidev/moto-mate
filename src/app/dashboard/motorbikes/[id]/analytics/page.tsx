import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bucketFuelForChart } from "@/lib/fuel";
import { bucketExpensesForChart } from "@/lib/expenses";
import { ROUTES } from "@/constants";
import { Card } from "@/components/Card";
import { BackLink } from "@/components/BackLink";
import { FuelChart } from "@/components/FuelChart";
import { ExpenseChart } from "@/components/ExpenseChart";

type Tab = "fuel" | "expenses";

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab: Tab = sp.tab === "expenses" ? "expenses" : "fuel";

  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.signin);

  const bike = await prisma.motorbike.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true },
  });
  if (!bike) notFound();

  const [fuelLogs, expenses] = await Promise.all([
    prisma.fuelLog.findMany({
      where: { motorbikeId: bike.id },
      orderBy: { filledAt: "asc" },
    }),
    prisma.expense.findMany({
      where: { motorbikeId: bike.id },
      orderBy: { spentAt: "asc" },
    }),
  ]);

  const fuelMonth = bucketFuelForChart(fuelLogs, "month");
  const fuelYear = bucketFuelForChart(fuelLogs, "year");
  const expMonth = bucketExpensesForChart(expenses, "month");
  const expYear = bucketExpensesForChart(expenses, "year");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <BackLink href={ROUTES.motorbike(id)} label={bike.name} />
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Analytics</h1>
      </div>

      <Tabs baseHref={ROUTES.analytics(id)} current={tab} />

      <Card padding="md">
        {tab === "fuel" ? (
          <FuelChart monthData={fuelMonth} yearData={fuelYear} />
        ) : (
          <ExpenseChart monthData={expMonth} yearData={expYear} />
        )}
      </Card>
    </div>
  );
}

function Tabs({ baseHref, current }: { baseHref: string; current: Tab }) {
  const tab = (key: Tab, label: string) => {
    const href = key === "fuel" ? baseHref : `${baseHref}?tab=${key}`;
    const active = current === key;
    return (
      <Link
        key={key}
        href={href}
        className={
          "rounded-md px-3 py-1.5 text-sm font-medium transition " +
          (active
            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
            : "text-muted hover:text-foreground")
        }
      >
        {label}
      </Link>
    );
  };
  return (
    <div className="flex w-fit gap-1 rounded-lg bg-surface-muted p-1">
      {tab("fuel", "Fuel")}
      {tab("expenses", "Expenses")}
    </div>
  );
}
