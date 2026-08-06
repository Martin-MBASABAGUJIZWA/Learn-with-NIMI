import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServiceClient } from "@/lib/supabase/serviceClient";
import { verifyCybersourceTransaction } from "@/lib/cybersource/verify";
import { sendPaymentReceipt } from "@/lib/email";
import { addMonths, addYears } from "@/lib/dateUtils";



const WEBHOOK_SECRET = process.env.CYBERSOURCE_WEBHOOK_SECRET;

function verifySignature(req: NextRequest, body: string): boolean {
  if (!WEBHOOK_SECRET) return false;

  const sigHeader = req.headers.get("v-c-signature") || "";
  const match = sigHeader.match(/signature="([^"]+)"/);
  if (!match) return false;

  const receivedSig = match[1];
  const date = req.headers.get("date") || "";
  const host = req.headers.get("host") || "";
  const digest = `SHA-256=${crypto.createHash("sha256").update(body).digest("base64")}`;
  const merchantId = req.headers.get("v-c-merchant-id") || "";

  const signString = `host: ${host}\ndate: ${date}\n(request-target): post /api/webhooks/cybersource\ndigest: ${digest}\nv-c-merchant-id: ${merchantId}`;

  const expected = crypto
    .createHmac("sha256", Buffer.from(WEBHOOK_SECRET, "base64"))
    .update(signString)
    .digest();

  const received = Buffer.from(receivedSig, "base64");

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const body = await req.text();

  if (!verifySignature(req, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(body);
    const eventType = event.eventType || "";

    if (eventType.startsWith("dispute.") || eventType.includes("chargeback")) {
      const txId = event.payload?.id;
      if (txId) {
        // Find the order so we can revoke content
        const { data: order } = await supabase
          .from("orders")
          .select("id")
          .eq("provider_transaction_id", txId)
          .maybeSingle();

        // Mark order refunded
        await supabase.from("orders")
          .update({ payment_status: "refunded" })
          .eq("provider_transaction_id", txId);

        if (order) {
          // Pull content_access rows to find linked subscription ids
          const { data: accesses } = await supabase
            .from("content_access")
            .select("subscription_id")
            .eq("order_id", order.id);

          const subIds = (accesses ?? [])
            .map(a => a.subscription_id)
            .filter((id): id is string => !!id);

          await Promise.all([
            // Revoke content access
            supabase.from("content_access")
              .update({ is_active: false })
              .eq("order_id", order.id),
            // Cancel linked subscription if one exists
            ...(subIds.length > 0 ? [
              supabase.from("nimipiko_subscriptions")
                .update({ status: "cancelled" })
                .in("id", subIds),
            ] : []),
          ]);
        }

        console.warn("[Webhook] Chargeback — access revoked:", txId);
      }
    }

    // ── Browser-close recovery ─────────────────────────────────────────────
    // CyberSource fires one of these events when a Flex Microform payment is
    // captured. If the user closed the browser before /api/confirm-payment ran,
    // the order is still "pending". We verify and provision here so the parent
    // gets access even without the client completing the flow.
    if (
      eventType === "payments.capture.completed" ||
      eventType === "payments.payments.updated" ||
      eventType === "payments.order.completed"
    ) {
      const txId: string | undefined = event.payload?.id;
      const mdi: Array<{ key: string; value: string }> | undefined =
        event.payload?.orderInformation?.merchantDefinedInformation;
      const orderId: string | undefined = mdi?.find(
        (m: { key: string; value: string }) => m.key === "orderId"
      )?.value;

      if (txId && orderId) {
        type OrderProduct = {
          tier: string | null;
          story_id: string | null;
          billing_interval: string | null;
          product_type: string | null;
          name: string | null;
        };

        const { data: order } = await supabase
          .from("orders")
          .select("*, products(tier, story_id, billing_interval, product_type, name)")
          .eq("id", orderId)
          .eq("payment_provider", "cybersource")
          .maybeSingle();

        if (order && order.payment_status === "pending") {
          let isAuthorized: boolean;
          let authorizedAmount: number;
          let customerToken: string | null;
          try {
            ({ isAuthorized, authorizedAmount, customerToken } =
              await verifyCybersourceTransaction(txId));
          } catch (verifyErr) {
            console.error("[Webhook] verifyCybersourceTransaction failed:", verifyErr);
            // Return 200 so CyberSource doesn't keep retrying a transient error
            return NextResponse.json({ received: true });
          }

          const expectedAmount = Number(order.amount);
          if (!isAuthorized || authorizedAmount < expectedAmount * 0.99) {
            await supabase.from("orders")
              .update({ payment_status: "failed", provider_transaction_id: txId })
              .eq("id", orderId)
              .eq("payment_status", "pending");
          } else {
            // Atomic CAS — skip if confirm-payment already landed concurrently
            const { data: claimed } = await supabase.from("orders")
              .update({
                payment_status: "completed",
                provider_transaction_id: txId,
                completed_at: new Date().toISOString(),
              })
              .eq("id", orderId)
              .eq("payment_status", "pending")
              .select("id")
              .maybeSingle();

            if (claimed) {
              const product = order.products as OrderProduct | null;
              if (product) {
                const accessType =
                  product.tier === "club"           ? "club"
                  : product.tier === "personalized" ? "personalized"
                  : product.tier === "champion_pack"? "challenge_pack"
                  : product.tier === "family_bundle"? "bundle"
                  : "story";

                if (product.product_type === "subscription" || product.tier === "club") {
                  const billingInterval = (product.billing_interval ?? "month") as "month" | "year";
                  const periodEnd = billingInterval === "year" ? addYears(new Date(), 1) : addMonths(new Date(), 1);

                  const { error: provisionErr } = await supabase.rpc("provision_subscription", {
                    p_parent_id:        order.parent_id,
                    p_product_id:       order.product_id,
                    p_order_id:         orderId,
                    p_provider:         "cybersource",
                    p_token:            customerToken ?? null,
                    p_phone:            null,
                    p_amount:           Number(order.amount),
                    p_currency:         order.currency,
                    p_billing_interval: billingInterval,
                    p_period_start:     new Date().toISOString(),
                    p_period_end:       periodEnd.toISOString(),
                    p_access_type:      accessType,
                    p_story_id:         product.story_id ?? null,
                  });

                  if (provisionErr) {
                    console.error("[Webhook] provision_subscription failed:", provisionErr.message);
                    // Revert to pending — clear completed_at/provider_transaction_id too so the
                    // next CyberSource retry can re-claim cleanly without hitting a dirty state.
                    await supabase.from("orders")
                      .update({ payment_status: "pending", completed_at: null, provider_transaction_id: null })
                      .eq("id", orderId)
                      .eq("payment_status", "completed");
                    return NextResponse.json({ error: "Provisioning failed — will retry" }, { status: 500 });
                  } else {
                    const { data: parent } = await supabase
                      .from("parents").select("email, name").eq("id", order.parent_id).maybeSingle();
                    if (parent?.email) {
                      void sendPaymentReceipt({
                        to: parent.email,
                        parentName: parent.name ?? "there",
                        amount: String(order.amount),
                        currency: order.currency,
                        provider: "cybersource",
                        periodEnd: periodEnd.toISOString(),
                        billingInterval,
                      });
                    }
                    console.log("[Webhook] Browser-close recovery: provisioned order", orderId);
                  }
                } else {
                  await supabase.from("content_access").insert({
                    parent_id: order.parent_id,
                    access_type: accessType,
                    story_id: product.story_id,
                    order_id: orderId,
                  });
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("[Webhook]", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
