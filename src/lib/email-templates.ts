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

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
