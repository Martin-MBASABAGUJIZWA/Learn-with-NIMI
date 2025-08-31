import { NextResponse } from "next/server";
import Stripe from "stripe";
import supabase from "@/lib/supabaseClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing Stripe signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`Webhook error: ${message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const parentId = session.metadata?.parentId;
      if (!parentId) return new Response("Missing parentId in metadata", { status: 400 });

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
        console.error("Supabase upsert error:", error.message);
        return new Response("Failed to update subscription", { status: 500 });
      }
    }

    return new Response("ok");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Webhook processing error:", message);
    return new Response("Internal server error", { status: 500 });
  }
}
