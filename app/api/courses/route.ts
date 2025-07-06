export async function POST(req: NextRequest) {
    const { title, description } = await req.json()
  
    const { data, error } = await supabase
      .from('courses')
      .insert([{ title, description }])
      .select()
  
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ course: data[0] }, { status: 201 })
  }
  