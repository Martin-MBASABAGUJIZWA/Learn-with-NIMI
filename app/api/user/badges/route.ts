// app/api/user/badges/route.ts
import  supabase  from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

const userId = "00000000-0000-0000-0000-000000000001";

export async function GET() {
  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
