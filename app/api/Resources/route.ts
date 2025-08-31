import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; // adjust if you use client/server differently

export async function POST(req: NextRequest) {
  const { student_id, course_id, type, title, url } = await req.json();

  const supabase = createClient();

  const { data, error } = await supabase
    .from("resources")
    .insert([{ student_id, course_id, type, title, url }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
