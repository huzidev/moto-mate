import { APP } from "@/constants";

/**
 * Shared, inline-styled HTML wrapper. Email clients ignore <style> tags
 * widely, so every rule is attribute-inlined and layout is table-based.
 */
function shell({ title, bodyInner }: { title: string; bodyInner: string }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0c0a09;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f5f4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding:28px 32px 0 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background:#f97316;color:#ffffff;width:36px;height:36px;border-radius:8px;text-align:center;font-weight:700;font-size:16px;line-height:36px;vertical-align:middle;">M</td>
                  <td style="padding-left:10px;font-weight:600;font-size:15px;color:#0c0a09;">${APP.name}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px 32px;">
              ${bodyInner}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#fafaf9;border-top:1px solid #e7e5e4;color:#78716c;font-size:12px;line-height:1.6;">
              You received this because someone used this email at ${APP.name}.
              If that wasn't you, ignore this message — the code expires on its own.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function codeBox(code: string) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
      <tr>
        <td align="center" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;">
          <div style="font-size:12px;color:#9a3412;letter-spacing:2px;text-transform:uppercase;font-weight:600;margin-bottom:6px;">Your code</div>
          <div style="font-size:34px;letter-spacing:10px;font-weight:700;color:#9a3412;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${code}</div>
        </td>
      </tr>
    </table>`;
}

export function verificationEmail({ name, code }: { name: string; code: string }) {
  const inner = `
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:600;line-height:1.3;">Welcome, ${escapeHtml(name)}.</h1>
    <p style="margin:0 0 4px 0;font-size:14px;line-height:1.6;color:#44403c;">
      One last step — enter the code below in your browser to confirm your email and finish creating your account.
    </p>
    ${codeBox(code)}
    <p style="margin:0;font-size:13px;color:#78716c;">This code expires in 10 minutes.</p>
  `;
  return {
    subject: `Your ${APP.name} verification code: ${code}`,
    html: shell({ title: `Verify your ${APP.name} account`, bodyInner: inner }),
  };
}

export function passwordResetEmail({ name, code }: { name: string; code: string }) {
  const inner = `
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:600;line-height:1.3;">Reset your password</h1>
    <p style="margin:0 0 4px 0;font-size:14px;line-height:1.6;color:#44403c;">
      Hi ${escapeHtml(name)} — use the code below on the reset page to pick a new password.
    </p>
    ${codeBox(code)}
    <p style="margin:0;font-size:13px;color:#78716c;">
      This code expires in 10 minutes. If you didn't ask for this, you can safely ignore the email.
    </p>
  `;
  return {
    subject: `Your ${APP.name} password reset code: ${code}`,
    html: shell({ title: `Reset your ${APP.name} password`, bodyInner: inner }),
  };
}

export function reminderEmail(args: {
  name: string;
  bikeName: string;
  reminderLabel: string;
  status: "soon" | "due";
  trigger: "km" | "time";
  sinceKm: number;
  intervalKm: number;
  sinceDays: number | null;
  maxDays: number | null;
  bikeUrl: string;
}) {
  const dueText =
    args.status === "due"
      ? `is due for a <strong>${escapeHtml(args.reminderLabel)}</strong>`
      : `is coming up on a <strong>${escapeHtml(args.reminderLabel)}</strong>`;

  const chipColor =
    args.status === "due"
      ? { bg: "#fee2e2", border: "#fecaca", text: "#991b1b", word: "Due now" }
      : { bg: "#fff7ed", border: "#fed7aa", text: "#9a3412", word: "Coming up" };

  const stat = (label: string, value: string) => `
    <td align="left" style="padding:8px 0;">
      <div style="font-size:11px;color:#78716c;text-transform:uppercase;letter-spacing:1px;">${label}</div>
      <div style="font-size:15px;color:#0c0a09;font-weight:600;margin-top:2px;">${value}</div>
    </td>`;

  const inner = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="background:${chipColor.bg};border:1px solid ${chipColor.border};border-radius:999px;padding:4px 10px;color:${chipColor.text};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">
          ${chipColor.word}${args.trigger === "time" ? " · time-based" : ""}
        </td>
      </tr>
    </table>

    <h1 style="margin:14px 0 6px 0;font-size:22px;font-weight:600;line-height:1.3;">
      ${escapeHtml(args.bikeName)} ${dueText}.
    </h1>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#44403c;">
      Hi ${escapeHtml(args.name)} — a quick heads up so you can book it before it bites.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:14px 18px;">
      <tr>
        ${stat("Since last", `${args.sinceKm.toLocaleString()} km`)}
        ${stat("Interval", `${args.intervalKm.toLocaleString()} km`)}
        ${
          args.maxDays
            ? stat("Days since", `${args.sinceDays ?? 0} / ${args.maxDays}d`)
            : ""
        }
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:22px 0 4px 0;">
      <tr>
        <td style="background:#f97316;border-radius:10px;">
          <a href="${args.bikeUrl}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">
            Open ${escapeHtml(args.bikeName)} in ${APP.name} →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:12px 0 0 0;font-size:12px;color:#78716c;">
      Record the service once it's done and we'll start a fresh countdown.
    </p>
  `;

  return {
    subject: `${args.bikeName} · ${args.status === "due" ? "service due" : "service coming up"} (${escapeHtml(args.reminderLabel)})`,
    html: shell({ title: `Service reminder — ${APP.name}`, bodyInner: inner }),
  };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
