// Cron: expire stale CyberSource checkout sessions
// Runs daily. Finds orders stuck in pending/processing for >3 hours — the user
// likely closed the browser mid-payment. Marks them failed and sends a retry email.
//
// 3-hour threshold: CyberSource capture contexts expire in 15 minutes, so any
// pending order older than 3 hours is definitively abandoned (not just slow).
//
// Idempotency: the update uses .in("payment_status", ["pending","processing"]) as
// a CAS guard, so concurrent cron runs safely skip already-expired orders.

export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/serviceClient";
import { sendExpiredCheckoutSession } from "@/lib/email";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader  = req.headers.get("authorization");
  const legacyHeader = req.headers.get("x-cron-secret");
  const authorized =
    cronSecret &&
    (authHeader === `Bearer ${cronSecret}` || legacyHeader === cronSecret);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

  const { data: staleOrders } = await supabase
    .from("orders")
    .select("id, parent_id")
    .eq("payment_provider", "cybersource")
    .in("payment_status", ["pending", "processing"])
    .lt("created_at", cutoff)
    .limit(50);

  if (!staleOrders?.length) {
    return NextResponse.json({ expired: 0 });
  }

  let expired = 0;
  for (const order of staleOrders) {
    const { data: claimed } = await supabase
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", order.id)
      .in("payment_status", ["pending", "processing"])
      .select("id")
      .maybeSingle();

    if (!claimed) continue;

    const { data: parent } = await supabase
      .from("parents").select("email, name").eq("id", order.parent_id).maybeSingle();
    if (parent?.email) {
      sendExpiredCheckoutSession({
        to: parent.email,
        parentName: parent.name ?? "there",
      }).catch(err => console.error("[expire-checkouts] email failed for", order.parent_id, err));
    }
    expired++;
  }

  return NextResponse.json({ expired });
}
