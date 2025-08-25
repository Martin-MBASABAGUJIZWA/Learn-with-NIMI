import { NextRequest, NextResponse } from "next/server";

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!; // Your deployed site URL

export async function POST(req: NextRequest) {
  try {
    const { parentId, plan } = await req.json();

    if (!parentId || !plan) {
      return NextResponse.json({ error: "Missing parentId or plan" }, { status: 400 });
    }

    // Map plan to price
    const amountMap: Record<string, number> = {
      monthly: 699, // in RWF or cents depending on your Flutterwave account
      yearly: 5999,
    };
    const amount = amountMap[plan];
    if (!amount) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    // Create payment session via Flutterwave
    const body = {
      tx_ref: `nimi-${parentId}-${Date.now()}`,
      amount,
      currency: "RWF",
      redirect_url: `${BASE_URL}/subscription-success?plan=${plan}`,
      customer: {
        email: "parent@example.com", // Optional: get real email from Supabase user
      },
      customizations: {
        title: "NIMI Premium Subscription",
        description: `Subscription plan: ${plan}`,
      },
    };

    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.status || data.status !== "success") {
      return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
    }

    return NextResponse.json({ url: data.data.link });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

