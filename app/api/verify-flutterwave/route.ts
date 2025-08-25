// app/api/verify-flutterwave/route.ts
import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const txRef = url.searchParams.get("tx_ref");
    if (!txRef) {
      return NextResponse.json({ success: false, message: "Missing tx_ref" }, { status: 400 });
    }

    // Call Flutterwave API to verify transaction
    const res = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${txRef}`, {
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!data.status || data.status !== "success") {
      return NextResponse.json({ success: false, message: data.message || "Verification failed" }, { status: 400 });
    }

    // Determine the plan from tx_ref or metadata
    // Example: tx_ref could include "monthly" or "yearly"
    let plan: "monthly" | "yearly" | null = null;
    if (txRef.includes("monthly")) plan = "monthly";
    if (txRef.includes("yearly")) plan = "yearly";

    if (!plan) return NextResponse.json({ success: false, message: "Could not determine plan" }, { status: 400 });

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
