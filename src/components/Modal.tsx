"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { MouseEvent, ReactElement, ReactNode } from "react";
import { Button } from "./Button";

type ConfirmVariant = "primary" | "danger";

/** Generic shell: backdrop + centered panel. Closes on Escape and backdrop click. */
export function Modal({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  function onBackdropClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        ref={panelRef}
        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Click the `children` trigger → confirmation dialog appears.
 * `onConfirm` can be a server action; it runs on Confirm and the modal closes
 * once it resolves. During the call both buttons disable so the user can't
 * double-fire or cancel mid-flight.
 */
export function ConfirmModal({
  children,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  onConfirm,
}: {
  children: ReactElement;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ConfirmVariant;
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const titleId = useId();

  if (!isValidElement<{ onClick?: () => void }>(children)) {
    throw new Error("ConfirmModal expects a single React element as its trigger child.");
  }
  const trigger = cloneElement(children, { onClick: () => setOpen(true) });

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  // ponytail: autofocus Cancel for destructive, Confirm for primary — matches OS
  // convention and keeps "Enter" from accidentally nuking data.
  const dangerous = confirmVariant === "danger";

  return (
    <>
      {trigger}
      <Modal
        open={open}
        onClose={() => {
          if (!pending) setOpen(false);
        }}
        labelledBy={titleId}
      >
        <h2 id={titleId} className="text-base font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        {description && (
          <div className="mt-2 text-sm text-[var(--muted)]">{description}</div>
        )}
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
            data-autofocus={dangerous ? true : undefined}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={dangerous ? "danger" : "primary"}
            onClick={handleConfirm}
            disabled={pending}
            data-autofocus={dangerous ? undefined : true}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </Modal>
    </>
  );
}
