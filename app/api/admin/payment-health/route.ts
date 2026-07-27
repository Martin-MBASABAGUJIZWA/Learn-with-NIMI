export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/serviceClient";
import { getAuthUser } from "@/lib/supabaseRouteAuth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceClient();

  // Verify admin
  const { data: admin } = await supabase.from("admins").select("id").eq("id", user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const threehHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();

  const [
    { data: recentPayments },
    { count: pastDueCount },
    { count: staleOrderCount },
    { data: recentRenewals },
  ] = await Promise.all([
    // Recent CyberSource payments — check if any have a customerToken (TMS indicator)
    supabase
      .from("payment_methods")
      .select("token, provider, created_at")
      .eq("provider", "cybersource")
      .order("created_at", { ascending: false })
      .limit(20),

    // Past-due subscriptions
    supabase
      .from("nimipiko_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "past_due"),

    // Stale CyberSource orders (pending > 3 hours)
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("payment_provider", "cybersource")
      .in("payment_status", ["pending", "processing"])
      .lt("created_at", threehHoursAgo),

    // Recent renewal attempts
    supabase
      .from("subscription_renewals")
      .select("status, provider_transaction_id, attempt_number, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const tmsEnabled = (recentPayments ?? []).some(pm => pm.token !== null && pm.token !== "");
  const totalCsPayments = (recentPayments ?? []).length;
  const csWithToken = (recentPayments ?? []).filter(pm => pm.token).length;

  return NextResponse.json({
    tms: {
      likely_enabled: tmsEnabled,
      recent_cs_payments: totalCsPayments,
      with_token: csWithToken,
      without_token: totalCsPayments - csWithToken,
    },
    past_due_count: pastDueCount ?? 0,
    stale_order_count: staleOrderCount ?? 0,
    recent_renewals: recentRenewals ?? [],
  });
}
