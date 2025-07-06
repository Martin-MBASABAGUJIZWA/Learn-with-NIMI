export async function POST(req: NextRequest) {
    const { student_id, course_id, status, progress } = await req.json()
  
    const { data, error } = await supabase
      .from('enrollments')
      .insert([{ student_id, course_id, status, progress }])
      .select()
  
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ enrollment: data[0] }, { status: 201 })
  }
  