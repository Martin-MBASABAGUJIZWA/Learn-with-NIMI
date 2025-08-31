import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { student_id, mission_id, type, title, url } = await req.json()
  
    const { data, error } = await supabase
      .from('student_submissions')
      .insert([{ student_id, mission_id, type, title, url }])
      .select()
  
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ submission: data[0] }, { status: 201 })
  }
  