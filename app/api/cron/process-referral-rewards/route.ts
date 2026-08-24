import { NextResponse } from "next/server";
import { sendPushToParent } from "@/lib/push";
import { sendReferralRewardGranted } from "@/lib/email";
import { getServiceClient } from "@/lib/supabase/serviceClient";
import { addMonths } from "@/lib/dateUtils";

// Cron fallback: finds referral redemptions where the referred user now has an
// active paid subscription but the reward was never granted (e.g. the real-time
// call from confirm-payment failed). Runs once daily.

export async function GET(req: Request) {
  const supabase = getServiceClient();
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const secret = req.headers.get("authorization");
  if (!secret || secret !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [{ data: pending }, { data: product }] = await Promise.all([
    supabase
      .from("referral_redemptions")
      .select("id, referrer_id, referred_id")
      .is("reward_granted_at", null)
      .limit(50),
    supabase.from("products").select("id").eq("slug", "nimipiko-club").maybeSingle(),
  ]);

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 500 });
  if (!pending || pending.length === 0) return NextResponse.json({ processed: 0 });

  async function processRow(row: { id: string; referrer_id: string; referred_id: string }) {
    // Check if referred user has an active paid subscription
    // Only trigger on real paid subscriptions — exclude free grants and trials
    const { data: sub } = await supabase
      .from("nimipiko_subscriptions")
      .select("id")
      .eq("parent_id", row.referred_id)
      .eq("status", "active")
      .not("payment_provider", "in", '("admin_grant","trial")')
      .maybeSingle();

    if (!sub) return false;

    // Atomically claim the reward slot
    const { data: claimed } = await supabase
      .from("referral_redemptions")
      .update({ reward_granted_at: new Date().toISOString() })
      .eq("id", row.id)
      .is("reward_granted_at", null)
      .select("id")
      .maybeSingle();

    if (!claimed) return false;

    const periodEnd = addMonths(new Date(), 1);

    // Insert subscription first so we have its id to link onto content_access.
    // Sequential — not parallel — so a failure at either step can be cleanly
    // rolled back before the other side is written.
    const { data: newSub, error: subErr } = await supabase
      .from("nimipiko_subscriptions")
      .insert({
        parent_id: row.referrer_id,
        product_id: product!.id,
        status: "active",
        currency: "USD",
        amount: 0,
        billing_interval: "month",
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        payment_provider: "admin_grant",
        cancel_at_period_end: true,
      })
      .select("id")
      .single();

    if (subErr || !newSub?.id) {
      console.error("[referral-rewards] subscription insert failed:", subErr?.message);
      // Roll back CAS claim so the daily cron retries tomorrow.
      await supabase.from("referral_redemptions")
        .update({ reward_granted_at: null }).eq("id", row.id);
      return false;
    }

    const { error: accessErr } = await supabase.from("content_access").insert({
      parent_id: row.referrer_id,
      access_type: "club",
      order_id: null,
      subscription_id: newSub.id,
      expires_at: periodEnd.toISOString(),
    });

    if (accessErr) {
      console.error("[referral-rewards] content_access insert failed:", accessErr.message);
      // Roll back both the subscription and the CAS claim.
      await Promise.all([
        supabase.from("nimipiko_subscriptions").delete().eq("id", newSub.id),
        supabase.from("referral_redemptions")
          .update({ reward_granted_at: null }).eq("id", row.id),
      ]);
      return false;
    }

    const [referrerRow, refereeRow] = await Promise.all([
      supabase.from("parents").select("email, name").eq("id", row.referrer_id).maybeSingle(),
      supabase.from("parents").select("name").eq("id", row.referred_id).maybeSingle(),
    ]);

    const referrerEmail = referrerRow.data?.email;
    const referrerName  = referrerRow.data?.name ?? null;
    const refereeName   = refereeRow.data?.name ?? null;

    if (referrerEmail) {
      void sendReferralRewardGranted({
        to: referrerEmail,
        referrerName: referrerName ?? "there",
        refereeName,
        freeMonthEnd: periodEnd.toISOString(),
      }).catch(() => {});
    }

    void sendPushToParent(supabase, row.referrer_id, {
      title: "🎁 You earned 1 free month!",
      body: "Your referral friend just subscribed to NIMIPIKO Club. Enjoy a free month on us!",
      url: "/parents?tab=settings",
    }).catch(() => {});

    return true;
  }

  // Process all pending rows in parallel
  const outcomes = await Promise.allSettled(pending.map(row => processRow(row)));
  const processed = outcomes.filter(r => r.status === "fulfilled" && r.value).length;

  return NextResponse.json({ processed });
}
