// /app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import supabase from "@/lib/supabaseClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil", // Stripe types version
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response(`Webhook error: ${(err as any).message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const parentId = session.metadata.parentId;

    await supabase
      .from("subscriptions")
      .upsert({
        parent_id: parentId,
        plan: session.subscription?.items.data[0].price.id.includes("monthly") ? "monthly" : "yearly",
        status: "subscribed",
        renewed_at: new Date().toISOString(),
      }, { onConflict: "parent_id" });
  }

  return new Response("ok");
}
