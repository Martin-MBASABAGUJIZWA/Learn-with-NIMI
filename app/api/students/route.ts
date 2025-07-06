import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';  // Adjust this path to where your supabaseClient is

export async function GET() {
  try {
    const { data, error } = await supabase.from('students').select('*');
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Server error fetching students' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.name || !data.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const { data: insertedStudent, error } = await supabase
      .from('students')
      .insert([{ name: data.name, email: data.email }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(insertedStudent, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON or server error' }, { status: 500 });
  }
}
