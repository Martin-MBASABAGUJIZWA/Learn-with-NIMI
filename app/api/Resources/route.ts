export async function POST(req: NextRequest) {
    const { student_id, course_id, type, title, url } = await req.json()
  
    const { data, error } = await supabase
      .from('resources')
      .insert([{ student_id, course_id, type, title, url }])
      .select()
  
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ resource: data[0] }, { status: 201 })
  }
  