import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET!;
const BASE_URL = "https://www.pesapal.com/api";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");
    if (!reference) throw new Error("Reference is required");

    const token = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");

    const res = await axios.get(`${BASE_URL}/Transactions/GetTransactionStatus?Reference=${reference}`, {
      headers: { "Authorization": `Basic ${token}` },
    });

    const status = res.data?.status; // Pesapal status: COMPLETED, PENDING, FAILED

    return NextResponse.json({
      success: status === "COMPLETED",
      plan: reference.includes("yearly") ? "yearly" : "monthly",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
