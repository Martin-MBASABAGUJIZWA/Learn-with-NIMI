// app/api/student_reflections/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient"; // ✅ fix here

export async function GET() {
  const { data, error } = await supabase
    .from("student_reflections")
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("student_reflections")
    .insert([body]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
