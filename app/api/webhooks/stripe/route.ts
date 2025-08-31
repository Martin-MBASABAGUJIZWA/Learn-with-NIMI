// /app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import supabase from "@/lib/supabaseClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response(`Webhook error: ${(err as any).message}`, {
      status: 400,
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const parentId = session.metadata?.parentId;
    if (!parentId) {
      return new Response(
        JSON.stringify({ error: "Missing parentId in session metadata" }),
        { status: 400 }
      );
    }

    // Ensure subscription is a Stripe.Subscription object
    let subscription: Stripe.Subscription | null = null;
    if (typeof session.subscription === "string") {
      subscription = await stripe.subscriptions.retrieve(session.subscription);
    } else {
      subscription = session.subscription;
    }

    // Default to yearly if items or price not found
    const plan =
      subscription?.items.data[0]?.price?.id.includes("monthly") ?? false
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
      return new Response(
        JSON.stringify({ error: "Failed to update subscription: " + error.message }),
        { status: 500 }
      );
    }
  }

  return new Response("ok");
}
