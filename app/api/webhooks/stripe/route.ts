// /app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import supabase from "@/lib/supabaseClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Optional chaining to safely access metadata
    const parentId = session.metadata?.parentId;
    if (!parentId) {
      return NextResponse.json({ error: "Missing parentId in session metadata" }, { status: 400 });
    }

    const plan =
      session.subscription?.items.data[0].price.id.includes("monthly")
        ? "monthly"
        : "yearly";

    const { error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          parent_id: parentId,
          plan,
          status: "subscribed",
          renewed_at: new Date().toISOString(),
        },
        { onConflict: "parent_id" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: "Webhook received" });
}
