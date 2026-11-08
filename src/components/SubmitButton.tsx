"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./Button";

type Props = Omit<ComponentProps<typeof Button>, "type" | "disabled"> & {
  pendingLabel?: string;
};

export function SubmitButton({ children, pendingLabel, ...rest }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button {...rest} type="submit" disabled={pending}>
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
