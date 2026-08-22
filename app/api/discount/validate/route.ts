import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

// M1: In-memory rate limit — max 10 requests per IP per minute.
const discountRateLimit = new Map<string, number[]>();
const DISCOUNT_MAX = 10;
const DISCOUNT_WINDOW_MS = 60 * 1000;

// POST { code, productSlug } → { valid, discount_type, discount_value, description }
// Public endpoint (no auth required) — RLS only exposes active codes.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const now = Date.now();
  const ipTimestamps = (discountRateLimit.get(ip) ?? []).filter(t => now - t < DISCOUNT_WINDOW_MS);
  if (ipTimestamps.length >= DISCOUNT_MAX) {
    return NextResponse.json({ valid: false, error: "Too many requests" }, { status: 429 });
  }
  ipTimestamps.push(now);
  discountRateLimit.set(ip, ipTimestamps);
  let body: { code?: string; productSlug?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ valid: false, error: "Bad request" }, { status: 400 }); }

  const code = typeof body.code === "string" ? body.code.toUpperCase().trim() : "";
  if (!code) return NextResponse.json({ valid: false, error: "Code required" }, { status: 422 });

  const { data: dc } = await supabase
    .from("discount_codes")
    .select("id, code, description, discount_type, discount_value, applies_to, max_uses, uses_count")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (!dc) return NextResponse.json({ valid: false, error: "Invalid or expired code" });

  // Check max uses — use same message as "not found" to avoid confirming code existence
  if (dc.max_uses !== null && dc.uses_count >= dc.max_uses) {
    return NextResponse.json({ valid: false, error: "Invalid or expired code" });
  }

  // Check product applicability — specific message here is useful UX, not a security risk
  // (applicability is only checked for a code that is already known to be valid)
  const slug = body.productSlug ?? "";
  if (dc.applies_to === "club" && !slug.includes("club")) {
    return NextResponse.json({ valid: false, error: "This code is only valid for Club plans" });
  }
  if (dc.applies_to === "annual" && !slug.includes("annual")) {
    return NextResponse.json({ valid: false, error: "This code is only valid for annual plans" });
  }

  return NextResponse.json({
    valid: true,
    code_id: dc.id,
    code: dc.code,
    description: dc.description ?? null,
    discount_type: dc.discount_type,
    discount_value: Number(dc.discount_value),
  });
}
