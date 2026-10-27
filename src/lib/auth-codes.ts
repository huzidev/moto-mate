import crypto from "crypto";
import { AuthCodePurpose } from "@prisma/client";
import { prisma } from "./prisma";
import { hashPassword, verifyPassword } from "./password";
import { sendEmail } from "./resend";
import { verificationEmail, passwordResetEmail } from "./email-templates";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

export class RateLimitedError extends Error {
  constructor(public retryInSeconds: number) {
    super(`Please wait ${retryInSeconds}s before requesting another code.`);
    this.name = "RateLimitedError";
  }
}

function sixDigit() {
  // crypto.randomInt is uniform; 100000..999999 keeps the length fixed.
  return crypto.randomInt(100_000, 1_000_000).toString();
}

/**
 * Issue a new code for (user, purpose), invalidate any outstanding ones,
 * and email it. Returns nothing meaningful — on success, user sees email.
 */
export async function issueCode(opts: {
  userId: string;
  purpose: AuthCodePurpose;
  email: string;
  name: string;
}) {
  // Cooldown: don't let anyone spam resend. First-ever issue has no prior row, so no delay.
  const latest = await prisma.authCode.findFirst({
    where: { userId: opts.userId, purpose: opts.purpose },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (latest) {
    const elapsed = Math.floor((Date.now() - latest.createdAt.getTime()) / 1000);
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      throw new RateLimitedError(RESEND_COOLDOWN_SECONDS - elapsed);
    }
  }

  const code = sixDigit();
  const codeHash = await hashPassword(code);

  await prisma.$transaction([
    prisma.authCode.updateMany({
      where: { userId: opts.userId, purpose: opts.purpose, usedAt: null },
      data: { usedAt: new Date() }, // retire old codes silently
    }),
    prisma.authCode.create({
      data: {
        userId: opts.userId,
        purpose: opts.purpose,
        codeHash,
        expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
      },
    }),
  ]);

  const tpl =
    opts.purpose === "EMAIL_VERIFICATION"
      ? verificationEmail({ name: opts.name, code })
      : passwordResetEmail({ name: opts.name, code });

  await sendEmail({ to: opts.email, ...tpl });
}

/**
 * Verify a plain code. Throws on invalid/expired/exhausted.
 * On success: marks code used, returns the userId.
 */
export async function consumeCode(opts: {
  userId: string;
  purpose: AuthCodePurpose;
  code: string;
}): Promise<void> {
  const row = await prisma.authCode.findFirst({
    where: { userId: opts.userId, purpose: opts.purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!row) throw new Error("No active code — request a new one.");
  if (row.expiresAt < new Date()) throw new Error("This code has expired — request a new one.");
  if (row.attempts >= MAX_ATTEMPTS)
    throw new Error("Too many wrong attempts — request a new code.");

  const ok = await verifyPassword(opts.code, row.codeHash);
  if (!ok) {
    await prisma.authCode.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    const left = MAX_ATTEMPTS - (row.attempts + 1);
    throw new Error(
      left > 0 ? `Wrong code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many wrong attempts — request a new code.",
    );
  }

  await prisma.authCode.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });
}
