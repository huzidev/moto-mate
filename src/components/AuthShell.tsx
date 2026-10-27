import Link from "next/link";
import type { ReactNode } from "react";
import { APP, ROUTES } from "@/constants";
import { Card } from "./Card";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <Link
        href={ROUTES.home}
        className="mb-8 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white">
          M
        </span>
        {APP.name}
      </Link>
      <Card className="w-full max-w-sm" padding="lg">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </Card>
      {footer && <div className="mt-5 text-sm text-[var(--muted)]">{footer}</div>}
    </main>
  );
}
