import type { ComponentProps } from "react";
import { selectClass } from "./FormField";

/** Native <select> with the shared chevron + input styling. */
export function Select({ className = "", children, ...rest }: ComponentProps<"select">) {
  return (
    <select {...rest} className={`${selectClass} ${className}`}>
      {children}
    </select>
  );
}
