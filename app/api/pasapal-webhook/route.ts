import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { reference, status } = data; // Pesapal returns status & reference

    const parentId = reference.split("-")[0]; // extract parentId

    if (status === "COMPLETED") {
      await supabase
        .from("subscriptions")
        .upsert({ parent_id: parentId, plan: "monthly", status: "subscribed" });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
