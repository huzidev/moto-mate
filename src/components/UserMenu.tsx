"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROUTES } from "@/constants";

function initials(name: string | null, email: string) {
  const source = (name ?? "").trim();
  if (source) {
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }
  return email[0]?.toUpperCase() ?? "?";
}

function firstName(name: string | null, email: string) {
  return (name?.trim() || email.split("@")[0] || "there").split(/\s+/)[0];
}

const itemClass =
  "block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] " +
  "hover:bg-[var(--surface-muted)] focus-visible:bg-[var(--surface-muted)] " +
  "focus-visible:outline-none";

export function UserMenu({
  name,
  email,
  signOutAction,
}: {
  name: string | null;
  email: string;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const onDashboard = pathname === ROUTES.dashboard;

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/15 text-sm font-semibold text-brand-500 transition hover:bg-brand-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      >
        {initials(name, email)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg"
        >
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Hi, {firstName(name, email)}
            </p>
            <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{email}</p>
          </div>
          <div className="py-1">
            <Link
              href={ROUTES.profile}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              Profile
            </Link>
            {!onDashboard && (
              <Link
                href={ROUTES.dashboard}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                Garage
              </Link>
            )}
            <form action={signOutAction}>
              <button type="submit" role="menuitem" className={itemClass}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
