import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { handleError } from "@/lib/apiHelpers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil", // match Stripe types
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });

    let plan: "monthly" | "yearly" | null = null;
    const priceId = session.line_items?.data?.[0]?.price?.id;
    if (priceId) {
      if (priceId === process.env.STRIPE_PRICE_MONTHLY) plan = "monthly";
      if (priceId === process.env.STRIPE_PRICE_YEARLY) plan = "yearly";
    }

    return NextResponse.json({ plan, session });
  } catch (err) {
    return handleError(err, "Failed to retrieve Stripe session");
  }
}
