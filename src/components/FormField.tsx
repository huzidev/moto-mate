import type { ReactNode } from "react";

export const inputClass =
  "h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] " +
  "px-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] " +
  "outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

// ponytail: native <select> with a hand-rolled chevron so it doesn't render the
// browser's giant default caret. The chevron SVG lives in globals.css because
// Tailwind's arbitrary bg-[url(data:...)] breaks on the embedded angle brackets.
// Swap for a custom combobox only if we need search.
export const selectClass = inputClass + " appearance-none pr-10 select-chevron";

export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-[var(--foreground)]">
        {label}
        {required && <span className="ml-0.5 text-brand-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
