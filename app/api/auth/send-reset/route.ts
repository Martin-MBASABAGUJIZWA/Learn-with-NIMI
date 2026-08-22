export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { sendAuthResetPassword } from "@/lib/email";
import { getServiceClient } from "@/lib/supabase/serviceClient";

// S1: In-memory rate limit — max 3 password-reset requests per email per 15 minutes.
const resetRateLimit = new Map<string, number[]>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const sb = getServiceClient();
  const body = await req.json().catch(() => ({})) as { email?: string };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  // Rate limit check
  const now = Date.now();
  const timestamps = (resetRateLimit.get(email) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    // Return generic success to avoid revealing rate limiting to an attacker
    return NextResponse.json({ ok: true });
  }
  timestamps.push(now);
  resetRateLimit.set(email, timestamps);

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nimipiko.com";

  const { data, error } = await sb.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${siteUrl}/reset-password` },
  });

  if (error) {
    // Don't reveal whether the email exists — always return success to the client
    console.error("[send-reset] generateLink error:", error.message);
    return NextResponse.json({ ok: true });
  }

  try {
    await sendAuthResetPassword(email, data.properties.action_link);
  } catch (err) {
    console.error("[send-reset] SendGrid error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Failed to send reset email. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
