import type { ReactNode } from "react";

export const inputClass =
  "h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] " +
  "px-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] " +
  "outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

// ponytail: native <select> with a hand-rolled chevron so it doesn't render the
// browser's giant default caret. Swap for a custom combobox only if we need search.
export const selectClass =
  inputClass +
  " appearance-none pr-10 bg-no-repeat" +
  " bg-[position:right_0.875rem_center] bg-[length:12px_12px]" +
  " bg-[url(\"data:image/svg+xml;utf8,<svg_xmlns='http://www.w3.org/2000/svg'_viewBox='0_0_24_24'_fill='none'_stroke='%23A8A29E'_stroke-width='2.5'_stroke-linecap='round'_stroke-linejoin='round'><path_d='M6_9_12_15_18_9'/></svg>\")]";

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
