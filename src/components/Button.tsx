import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition " +
  "disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-[var(--background)]";

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:bg-brand-700",
  secondary:
    "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] " +
    "hover:bg-[var(--surface-muted)]",
  ghost:
    "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  full,
  children,
  ...rest
}: ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}) {
  return (
    <button
      {...rest}
      className={`${base} ${sizes[size]} ${variants[variant]} ${full ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  full,
  href,
  children,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
  full?: boolean;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${base} ${sizes[size]} ${variants[variant]} ${full ? "w-full" : ""} ${className}`}
    >
      {children}
    </Link>
  );
}
