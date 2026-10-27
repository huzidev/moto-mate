"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PasswordInput } from "./PasswordInput";

export function PasswordFields({
  passwordLabel = "Password",
  confirmLabel = "Confirm password",
  passwordName = "password",
  confirmName = "confirm",
  minLength = 8,
  onValidityChange,
}: {
  passwordLabel?: string;
  confirmLabel?: string;
  passwordName?: string;
  confirmName?: string;
  minLength?: number;
  onValidityChange?: (valid: boolean) => void;
}) {
  const [p, setP] = useState("");
  const [c, setC] = useState("");

  const lengthOk = p.length >= minLength;
  const confirmTouched = c.length > 0;
  const match = confirmTouched && p === c;
  const valid = lengthOk && match;

  useEffect(() => {
    onValidityChange?.(valid);
  }, [valid, onValidityChange]);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={passwordName} className="block text-xs font-medium">
          {passwordLabel} <span className="text-brand-500">*</span>
        </label>
        <PasswordInput
          id={passwordName}
          name={passwordName}
          required
          minLength={minLength}
          autoComplete="new-password"
          value={p}
          onChange={(e) => setP(e.target.value)}
        />
        <Collapse show={!lengthOk}>
          <p className="pt-0.5 text-xs text-muted">At least {minLength} characters.</p>
        </Collapse>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={confirmName} className="block text-xs font-medium">
          {confirmLabel} <span className="text-brand-500">*</span>
        </label>
        <PasswordInput
          id={confirmName}
          name={confirmName}
          required
          minLength={minLength}
          autoComplete="new-password"
          value={c}
          onChange={(e) => setC(e.target.value)}
        />
        <Collapse show={confirmTouched}>
          <p className={`pt-0.5 text-xs transition-colors ${match ? "text-emerald-500" : "text-red-500"}`}>
            {match ? "Passwords match ✓" : "Passwords don't match"}
          </p>
        </Collapse>
      </div>
    </div>
  );
}

/**
 * Zero-height-to-content collapse using the CSS grid trick.
 * Keeps layout stable, animates height + opacity together.
 */
function Collapse({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out ${
        show ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="min-h-0">{children}</div>
    </div>
  );
}
