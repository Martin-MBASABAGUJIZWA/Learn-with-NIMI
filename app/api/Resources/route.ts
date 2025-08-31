import { NextRequest, NextResponse } from "next/server";
import  supabase  from "lib/supabaseClient"; // or wherever your supabase client lives

export async function POST(req: NextRequest) {
  const { student_id, course_id, type, title, url } = await req.json();

  const { data, error } = await supabase
    .from("resources")
    .insert([{ student_id, course_id, type, title, url }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
