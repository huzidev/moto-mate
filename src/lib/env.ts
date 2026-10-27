import { z } from "zod";

const schema = z.object({
  // Database (Vercel Postgres exposes both; Prisma uses the pooled one)
  POSTGRES_PRISMA_URL: z.string().url(),
  POSTGRES_URL_NON_POOLING: z.string().url(),

  // Auth
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),

  // Resend
  RESEND_API_KEY: z.string().startsWith("re_"),
  RESEND_FROM: z.string().email(),

  // Cloudinary (feature-gated — asserted in src/lib/cloudinary.ts when used)
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),

  // OpenRouter (feature-gated — asserted in src/lib/openrouter.ts when used)
  OPENROUTER_API_KEY: z.string().startsWith("sk-or-").optional(),
  OPENROUTER_MODEL: z.string().default("openai/gpt-4o-mini"),
});

export const env = schema.parse(process.env);
