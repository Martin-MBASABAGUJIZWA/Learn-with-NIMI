// Cron: send scheduled gift emails
// Runs daily at 08:00 UTC. Finds gift records where send_at <= now,
// email_sent_at is null, and the order is completed — then sends.
//
// Idempotency: each gift is atomically claimed (UPDATE WHERE email_sent_at IS NULL
// RETURNING id) before emails fire, so concurrent cron runs never double-send.
//
// Bug note: dispatchGiftEmail cannot be used here because it checks
// `if (gift.email_sent_at) return` — but we set email_sent_at as the CAS
// claim before sending. Emails are sent directly instead.

import { NextRequest, NextResponse } from "next/server";
import { sendGiftNotification, sendGiftConfirmation } from "@/lib/email";
import { getServiceClient } from "@/lib/supabase/serviceClient";



export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const cronSecret = process.env.CRON_SECRET;
  const authHeader  = req.headers.get("authorization");
  const legacyHeader = req.headers.get("x-cron-secret");
  const authorized =
    cronSecret &&
    (authHeader === `Bearer ${cronSecret}` || legacyHeader === cronSecret);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nimipiko.com";
  const now = new Date().toISOString();

  // Fetch all fields needed for the email in one query so we don't need a
  // second round-trip after claiming.
  const { data: pending } = await supabase
    .from("gift_subscriptions")
    .select(`
      id, order_id,
      recipient_email, recipient_name, message, redemption_code,
      gift_amount, gift_currency,
      orders!inner(payment_status, parent_id, products(name)),
      parents!giver_parent_id(email, name)
    `)
    .lte("send_at", now)
    .is("email_sent_at", null)
    .eq("orders.payment_status", "completed")
    .limit(50);

  if (!pending?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  for (const row of pending) {
    const order  = (row.orders  as unknown) as { payment_status: string; parent_id: string; products?: { name?: string } | null } | null;
    const giver  = (row.parents as unknown) as { email?: string; name?: string } | null;
    if (!order) continue;
    if (!row.recipient_email) continue; // giver will share code manually

    // Atomic CAS claim: mark email_sent_at now. If another cron run already
    // claimed this row, 0 rows return and we skip — preventing double-sends.
    const { data: claimed } = await supabase
      .from("gift_subscriptions")
      .update({ email_sent_at: now })
      .eq("id", row.id)
      .is("email_sent_at", null)
      .select("id")
      .maybeSingle();

    if (!claimed) continue; // another run got there first

    const productName = (order.products as { name?: string } | null)?.name ?? null;

    // Send to recipient
    void sendGiftNotification({
      to: row.recipient_email,
      recipientName: row.recipient_name ?? null,
      giverName: giver?.name ?? "Someone special",
      productName,
      giftAmount: row.gift_amount ?? null,
      giftCurrency: row.gift_currency ?? null,
      message: row.message ?? null,
      redeemUrl: `${siteUrl}/gift/redeem?code=${row.redemption_code}`,
    }).catch(err => console.error("[send-gift-emails] notification failed:", err));

    // Send receipt to giver
    if (giver?.email) {
      void sendGiftConfirmation({
        to: giver.email,
        giverName: giver.name ?? "there",
        recipientEmail: row.recipient_email,
        productName,
        giftAmount: row.gift_amount ?? null,
        giftCurrency: row.gift_currency ?? null,
      }).catch(err => console.error("[send-gift-emails] confirmation failed:", err));
    }

    sent++;
  }

  return NextResponse.json({ sent });
}
