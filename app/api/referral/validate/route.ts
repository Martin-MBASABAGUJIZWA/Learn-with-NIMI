import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { REFERRAL_CODE_LENGTH } from "@/lib/referralConstants";
import { getAuthUser } from "@/lib/supabaseRouteAuth";

// S5: In-memory rate limit — max 10 requests per authenticated user per minute.
const validateRateLimit = new Map<string, number[]>();
const VALIDATE_MAX = 10;
const VALIDATE_WINDOW_MS = 60 * 1000;

export async function GET(req: NextRequest) {
  // S5: Require a valid session.
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // S5: Per-user rate limit.
  const now = Date.now();
  const userTimestamps = (validateRateLimit.get(user.id) ?? []).filter(t => now - t < VALIDATE_WINDOW_MS);
  if (userTimestamps.length >= VALIDATE_MAX) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  userTimestamps.push(now);
  validateRateLimit.set(user.id, userTimestamps);

  const code = req.nextUrl.searchParams.get("code")?.toUpperCase().trim();
  if (!code || code.length !== REFERRAL_CODE_LENGTH) {
    return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
  }

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data } = await serviceSupabase
    .from("referral_codes")
    .select("parent_id, parents(name)")
    .eq("code", code)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

  const referrerName = (data.parents as { name?: string } | null)?.name ?? "a friend";
  return NextResponse.json({ valid: true, referrerName });
}
