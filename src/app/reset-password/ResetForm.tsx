"use client";

import { useState } from "react";
import { FormField, inputClass } from "@/components/FormField";
import { PasswordFields } from "@/components/PasswordFields";
import { Button } from "@/components/Button";

export function ResetForm({
  action,
  email,
  error,
  resent,
}: {
  action: (formData: FormData) => void | Promise<void>;
  email: string;
  error?: string;
  resent?: boolean;
}) {
  const [passwordsValid, setPasswordsValid] = useState(false);

  return (
    <form
      action={action}
      className="space-y-4"
      onSubmit={(e) => {
        if (!passwordsValid) e.preventDefault();
      }}
    >
      <input type="hidden" name="email" value={email} />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      {resent && !error && (
        <div className="rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-300">
          A new code has been sent.
        </div>
      )}

      <FormField label="Verification code" htmlFor="code" required>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          placeholder="123456"
          className={`${inputClass} tracking-[0.4em] text-center font-mono text-lg`}
        />
      </FormField>

      <PasswordFields
        passwordLabel="New password"
        confirmLabel="Confirm new password"
        onValidityChange={setPasswordsValid}
      />

      <Button type="submit" full size="lg" disabled={!passwordsValid}>
        Update password
      </Button>
    </form>
  );
}
