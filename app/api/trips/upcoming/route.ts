import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("trips")
    .select("id, title, description, date, location, guide_name, image_url, video_url")
    .gte("date", today)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
