"use client";

import { useState } from "react";
import { FormField, inputClass } from "@/components/FormField";
import { PasswordFields } from "@/components/PasswordFields";
import { Button } from "@/components/Button";

export function SignupForm({
  action,
  defaults,
  error,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults: { name: string; email: string; phone: string };
  error?: string;
}) {
  const [passwordsValid, setPasswordsValid] = useState(false);

  return (
    <form
      action={action}
      className="space-y-4"
      onSubmit={(e) => {
        // Belt + braces: button is also disabled, but Enter in a text field submits forms too.
        if (!passwordsValid) e.preventDefault();
      }}
    >
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      <FormField label="Name" htmlFor="name" required>
        <input
          id="name"
          name="name"
          required
          maxLength={60}
          defaultValue={defaults.name}
          autoComplete="name"
          placeholder="Huzaifa"
          className={inputClass}
        />
      </FormField>
      <FormField label="Email" htmlFor="email" required>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaults.email}
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClass}
        />
      </FormField>
      <FormField
        label="Phone / WhatsApp"
        htmlFor="phone"
        hint="Optional. For future SMS/WhatsApp reminders."
      >
        <input
          id="phone"
          name="phone"
          type="tel"
          maxLength={30}
          defaultValue={defaults.phone}
          autoComplete="tel"
          placeholder="+92 300 1234567"
          className={inputClass}
        />
      </FormField>

      <PasswordFields onValidityChange={setPasswordsValid} />

      <Button type="submit" full size="lg" disabled={!passwordsValid}>
        Create account
      </Button>
    </form>
  );
}
