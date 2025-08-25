import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30",
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Map Stripe price ID to your plan names
    let plan: "monthly" | "yearly" | null = null;
    if (session?.line_items?.data?.[0]?.price?.id) {
      const priceId = session.line_items.data[0].price.id;
      if (priceId === process.env.STRIPE_PRICE_MONTHLY) plan = "monthly";
      if (priceId === process.env.STRIPE_PRICE_YEARLY) plan = "yearly";
    }

    return NextResponse.json({ plan, session });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
