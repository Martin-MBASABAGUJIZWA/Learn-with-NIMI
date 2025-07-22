import { NextResponse } from "next/server";
import  supabase  from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, image_url } = body;

    if (!name || !image_url) {
      return NextResponse.json(
        { error: "Missing required fields: name and image_url" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("stickers")
      .insert([{ name, image_url: image_url, created_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sticker: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
