export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { getAuthUser } from "@/lib/supabaseRouteAuth";
import { getServiceClient } from "@/lib/supabase/serviceClient";

// Reusable HMAC signing for CyberSource REST API
function csSign(method: "get" | "post", resourcePath: string, bodyString: string | null) {
  const merchantId = process.env.CYBERSOURCE_MERCHANT_ID!;
  const keyId      = process.env.CYBERSOURCE_KEY_ID!;
  const secretKey  = process.env.CYBERSOURCE_SECRET_KEY!;
  const host       = process.env.CYBERSOURCE_HOST ?? "api.cybersource.com";
  const date       = new Date().toUTCString();
  const digest     = bodyString
    ? `SHA-256=${crypto.createHash("sha256").update(bodyString).digest("base64")}`
    : null;

  const signParts = [`host: ${host}`, `date: ${date}`, `(request-target): ${method} ${resourcePath}`];
  if (digest) signParts.push(`digest: ${digest}`);
  signParts.push(`v-c-merchant-id: ${merchantId}`);

  const signatureHash = crypto
    .createHmac("sha256", Buffer.from(secretKey, "base64"))
    .update(signParts.join("\n"))
    .digest("base64");

  const headersField = digest
    ? "host date (request-target) digest v-c-merchant-id"
    : "host date (request-target) v-c-merchant-id";

  const signatureHeader =
    `keyid="${keyId}", algorithm="HmacSHA256", headers="${headersField}", signature="${signatureHash}"`;

  return { host, date, digest, merchantId, signatureHeader };
}

// POST — generate a CyberSource tokenize-only capture context (no charge, card-on-file update)
// Requires CyberSource TMS to be enabled for the token call in PATCH to succeed.
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rawOrigin = req.headers.get("origin") || "";
  const STATIC_ORIGINS = [
    "https://nimipiko.com",
    "https://www.nimipiko.com",
    "https://learn-with-nimi.vercel.app",
  ];
  const isAllowedOrigin =
    STATIC_ORIGINS.includes(rawOrigin) ||
    /^https:\/\/learn-with-nimi-[a-z0-9-]+\.vercel\.app$/.test(rawOrigin);
  const targetOrigins = isAllowedOrigin ? [rawOrigin] : STATIC_ORIGINS;

  const bodyString = JSON.stringify({
    targetOrigins,
    clientVersion: "0.34",
    allowedPaymentTypes: ["PANENTRY"],
    allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX"],
    locale: "en_US",
    captureMandate: {
      billingType: "FULL",
      requestEmail: false,
      requestPhone: false,
      requestShipping: false,
    },
    completeMandate: { type: "TOKENIZE" },
  });

  const { host, date, digest, merchantId, signatureHeader } = csSign("post", "/up/v1/capture-contexts", bodyString);

  const res = await fetch(`https://${host}/up/v1/capture-contexts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "v-c-merchant-id": merchantId,
      Date: date,
      Host: host,
      Digest: digest!,
      Signature: signatureHeader,
    },
    body: bodyString,
  });

  const result = await res.text();
  if (!res.ok) {
    console.error("[payment-method POST] capture context failed:", res.status, result.slice(0, 200));
    return NextResponse.json({ error: "Payment service unavailable." }, { status: 502 });
  }
  return NextResponse.json({ captureContext: result });
}

// PATCH — receive completionJwt from Flex Microform, call CyberSource /pts/v2/tokens
// to create a permanent customer token, then update the subscription's payment method.
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { completionJwt } = body as { completionJwt?: string };
  if (!completionJwt) {
    return NextResponse.json({ error: "Missing completionJwt" }, { status: 400 });
  }

  // Call CyberSource Token Management Service to create a permanent customer token
  const resourcePath = "/pts/v2/tokens";
  const tokenBody = JSON.stringify({ tokenInformation: { transientTokenJwt: completionJwt } });
  const { host, date, digest, merchantId, signatureHeader } = csSign("post", resourcePath, tokenBody);

  const tokenRes = await fetch(`https://${host}${resourcePath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "v-c-merchant-id": merchantId,
      Date: date,
      Host: host,
      Digest: digest!,
      Signature: signatureHeader,
    },
    body: tokenBody,
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => "");
    console.error("[payment-method PATCH] token creation failed:", tokenRes.status, errText.slice(0, 300));
    // 403 or specific error text indicates TMS is not enabled
    if (tokenRes.status === 403 || errText.includes("token") || tokenRes.status === 400) {
      return NextResponse.json({
        error: "Automatic card update requires Token Management Service to be enabled in CyberSource Business Center. Please resubscribe from the pricing page instead.",
        code: "TMS_NOT_ENABLED",
      }, { status: 402 });
    }
    return NextResponse.json({ error: "Failed to store card. Please try resubscribing." }, { status: 502 });
  }

  const tokenData = await tokenRes.json();
  const customerToken = (tokenData.tokenInformation?.customer?.id as string | undefined);
  if (!customerToken) {
    return NextResponse.json({
      error: "Card update requires Token Management Service to be enabled in CyberSource Business Center. Please resubscribe from the pricing page instead.",
      code: "TMS_NOT_ENABLED",
    }, { status: 402 });
  }

  const supabase = getServiceClient();

  // Find the user's subscription and its linked payment method
  const { data: sub } = await supabase
    .from("nimipiko_subscriptions")
    .select("id, payment_method_id")
    .eq("parent_id", user.id)
    .in("status", ["active", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.payment_method_id) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 404 });
  }

  const { error: updateErr } = await supabase
    .from("payment_methods")
    .update({ token: customerToken })
    .eq("id", sub.payment_method_id)
    .eq("provider", "cybersource");

  if (updateErr) {
    console.error("[payment-method PATCH] update failed:", updateErr.message);
    return NextResponse.json({ error: "Failed to update payment method." }, { status: 500 });
  }

  // If past_due, reset to active — renewal cron will charge at next cycle
  await supabase.from("nimipiko_subscriptions")
    .update({ status: "active", grace_ends_at: null })
    .eq("id", sub.id)
    .eq("status", "past_due");

  return NextResponse.json({ success: true });
}
