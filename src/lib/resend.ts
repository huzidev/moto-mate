import { Resend } from "resend";
import { env } from "./env";

export const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail(args: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const res = await resend.emails.send({
    from: env.RESEND_FROM,
    ...args,
  });

  // Resend SDK returns { data, error } — a thrown Error is better than a silent failure.
  if (res.error) {
    console.error("[resend] send failed:", res.error);
    throw new Error(`Email failed: ${res.error.message ?? res.error.name ?? "unknown"}`);
  }

  return res.data;
}
