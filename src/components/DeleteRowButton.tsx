"use client";

import { ConfirmModal } from "./Modal";

export function DeleteRowButton({
  action,
  entityLabel,
}: {
  action: () => Promise<void> | void;
  entityLabel: string;
}) {
  return (
    <ConfirmModal
      title={`Delete this ${entityLabel}?`}
      description="This can't be undone."
      confirmLabel="Delete"
      confirmVariant="danger"
      onConfirm={action}
    >
      <button
        type="button"
        aria-label={`Delete ${entityLabel}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </ConfirmModal>
  );
}
