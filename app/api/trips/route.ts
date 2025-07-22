import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("trips")
    .insert([
      {
        title: body.title,
        description: body.description,
        date: body.date,
        location: body.location,
        guide_name: body.guide_name,
        photos: body.photos || [],
        videos: body.videos || [],
      },
    ])
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH: Update trip
export async function PATCH(req) {
  const body = await req.json();

  const { id, ...fields } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing trip id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("trips")
    .update(fields)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE: Delete trip
export async function DELETE(req) {
  const body = await req.json();

  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing trip id" }, { status: 400 });
  }

  const { error } = await supabase.from("trips").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Trip deleted" });
}
