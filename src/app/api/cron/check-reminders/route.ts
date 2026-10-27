import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { checkRemindersForAllBikes } from "@/lib/reminder-notifications";

// Vercel Cron hits this with: Authorization: Bearer $CRON_SECRET
// Also accepts the same header locally for manual curl testing.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = env.CRON_SECRET ? `Bearer ${env.CRON_SECRET}` : null;

  // In prod, CRON_SECRET must be set and must match. In dev with no secret, allow.
  if (process.env.NODE_ENV === "production") {
    if (!expected) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }
    if (auth !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (expected && auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await checkRemindersForAllBikes();
  return NextResponse.json({ ok: true, ...result });
}
