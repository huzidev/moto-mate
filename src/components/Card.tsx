import type { ReactNode } from "react";

const base =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_1px_0_rgba(0,0,0,0.02)]";

export function Card({
  className = "",
  padding = "md",
  children,
}: {
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const pad = { none: "", sm: "p-4", md: "p-6", lg: "p-8" }[padding];
  return <div className={`${base} ${pad} ${className}`}>{children}</div>;
}

export function Divider() {
  return <hr className="my-6 border-[var(--border)]" />;
}
