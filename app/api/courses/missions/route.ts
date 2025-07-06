// app/api/missions/route.ts
import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Get today's day number (1-8 as per your schema)
    // You'll need to implement your day rotation logic here
    const currentDayNumber = getCurrentDayNumber(); // Implement this function
    
    const { data, error } = await supabase
      .from('daily_missions')
      .select(`
        id,
        day_number,
        title,
        mission_time,
        activity_title,
        objectives,
        description,
        piko_victory,
        video_url
      `)
      .eq('day_number', currentDayNumber)
      .order('mission_time', { ascending: true });

    if (error) throw error;
    
    return NextResponse.json(data || []);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch missions',
        details: error.message,
        suggestion: "Verify day_number exists in your table"
      },
      { status: 500 }
    );
  }
}

// Helper function - implement your day rotation logic
function getCurrentDayNumber(): number {
  // Example: Cycle through days 1-8 based on actual date
  const startDate = new Date('2023-01-01'); // Your program start date
  const today = new Date();
  const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  return (diffDays % 8) + 1; // Returns 1-8
}