import { NextResponse } from "next/server";
import Stripe from "stripe";

// Use Stripe API version that matches your installed Stripe types
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: Request) {
  try {
    const { parentId, plan } = await req.json();

    if (!parentId || !plan) {
      return NextResponse.json(
        { error: "Missing parentId or plan" },
        { status: 400 }
      );
    }

    // Map plan to your Stripe price IDs
    const priceId =
      plan === "monthly"
        ? process.env.STRIPE_MONTHLY_PRICE_ID
        : process.env.STRIPE_YEARLY_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price ID not configured" },
        { status: 500 }
      );
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription-cancelled`,
      metadata: { parentId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Session Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
