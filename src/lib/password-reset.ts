import crypto from "crypto";
import { prisma } from "./prisma";
import { sendEmail } from "./resend";
import { hashPassword } from "./password";
import { APP } from "@/constants";

const TOKEN_TTL_MINUTES = 30;

export async function createResetTokenAndEmail(email: string, baseUrl: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // ponytail: don't leak which emails exist — always return as if we sent.
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000);

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const link = `${baseUrl}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: `Reset your ${APP.name} password`,
    html: `
      <p>Hi ${user.name ?? ""},</p>
      <p>Click the link below to reset your password. It expires in ${TOKEN_TTL_MINUTES} minutes.</p>
      <p><a href="${link}">${link}</a></p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
}

export async function consumeResetToken(token: string, newPassword: string) {
  const row = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new Error("This reset link is invalid or has expired.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);
}
