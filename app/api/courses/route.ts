// app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();

    const { data, error } = await supabase
      .from('courses')
      .insert({ title, description });

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('API Error:', err);

    const message = err instanceof Error ? err.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to create course', details: message },
      { status: 500 }
    );
  }
}
