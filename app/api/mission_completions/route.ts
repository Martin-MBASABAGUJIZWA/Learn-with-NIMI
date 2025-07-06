export async function POST(req: NextRequest) {
    const { student_id, mission_id, piko_victory_achieved, notes } = await req.json()
  
    const { data, error } = await supabase
      .from('mission_completions')
      .insert([{ student_id, mission_id, piko_victory_achieved, notes }])
      .select()
  
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ completion: data[0] }, { status: 201 })
  }
  