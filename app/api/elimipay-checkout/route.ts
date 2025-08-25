// pages/api/elemipay-checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!req.query.parentId || !req.query.plan) {
    return res.status(400).json({ error: "Missing parentId or plan" });
  }

  const { parentId, plan } = req.query;

  // Map plan IDs to amounts (RWF)
  const planPrices: Record<string, number> = {
    monthly: 699,  // example
    yearly: 5999,
  };

  const amount = planPrices[plan];
  if (!amount) return res.status(400).json({ error: "Invalid plan" });

  try {
    const ELEMIPAY_API_KEY = process.env.ELEMIPAY_API_KEY!;
    const ELEMIPAY_MERCHANT_ID = process.env.ELEMIPAY_MERCHANT_ID!;

    // Call Elemipay API
    const response = await fetch("https://api.elemipay.com/v1/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ELEMIPAY_API_KEY}`,
      },
      body: JSON.stringify({
        merchant_id: ELEMIPAY_MERCHANT_ID,
        amount,
        currency: "RWF",
        customer_id: parentId,
        payment_methods: ["MTN", "AIRTEL"],
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/elemipay-webhook`,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/cancel`,
        description: `Subscription ${plan} for ${parentId}`,
      }),
    });

    const data = await response.json();

    if (data.checkout_url) {
      return res.status(200).json({ checkout_url: data.checkout_url });
    } else {
      return res.status(400).json({ error: data.error || "Failed to create checkout" });
    }
  } catch (err: any) {
    console.error("Elemipay error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
