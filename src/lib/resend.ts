import { Resend } from "resend";
import { env } from "./env";

export const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail(args: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: env.RESEND_FROM,
    ...args,
  });
}
