// /app/api/stripe-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { handleError } from "@/lib/apiHelpers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil", // Stripe types version
});

// Create a checkout session
export async function POST(req: NextRequest) {
  try {
    const { parentId, plan } = await req.json();

    if (!plan || !["monthly", "yearly"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    const priceId =
      plan === "monthly"
        ? process.env.STRIPE_PRICE_MONTHLY
        : process.env.STRIPE_PRICE_YEARLY;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId!, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription-cancelled`,
      metadata: { parentId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    return handleError(err, "Failed to create Stripe checkout session");
  }
}

// Retrieve an existing checkout session
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    // Determine the plan type based on the price ID
    let plan: "monthly" | "yearly" | null = null;
    const priceId = session.line_items?.data?.[0]?.price?.id;

    if (priceId) {
      if (priceId === process.env.STRIPE_PRICE_MONTHLY) plan = "monthly";
      if (priceId === process.env.STRIPE_PRICE_YEARLY) plan = "yearly";
    }

    return NextResponse.json({ plan, session });
  } catch (err: unknown) {
    return handleError(err, "Failed to retrieve Stripe session");
  }
}
