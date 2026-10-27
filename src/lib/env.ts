import { z } from "zod";

const schema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Auth
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),

  // Resend
  RESEND_API_KEY: z.string().startsWith("re_"),
  // Accepts "name@domain" OR "Display Name <name@domain>" — Resend validates on send.
  RESEND_FROM: z.string().min(3),

  // Cloudinary (feature-gated — asserted in src/lib/cloudinary.ts when used)
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),

  // OpenRouter (feature-gated — asserted in src/lib/openrouter.ts when used)
  OPENROUTER_API_KEY: z.string().startsWith("sk-or-").optional(),
  OPENROUTER_MODEL: z.string().default("openai/gpt-4o-mini"),
});

// Empty string from a .env file should count as "not set", so optional keys
// don't trip their format rules just because the line exists.
const cleaned = Object.fromEntries(
  Object.entries(process.env).map(([k, v]) => [k, v === "" ? undefined : v]),
);

const result = schema.safeParse(cleaned);
if (!result.success) {
  const issues = result.error.issues
    .map((i) => `  • ${i.path.join(".")} — ${i.message}`)
    .join("\n");
  throw new Error(
    `\n\n🚫 Environment is not configured.\n\n` +
      `${issues}\n\n` +
      `Fix: open .env, fill the missing values, then restart the dev server.\n` +
      `See .env.example for the full list and setup links.\n`,
  );
}

export const env = result.data;
