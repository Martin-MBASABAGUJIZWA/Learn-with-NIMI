import supabase from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

const userId = "00000000-0000-0000-0000-000000000001"; // TODO: Replace with dynamic auth ID

export async function GET() {
  try {
    // Fetch user main info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    // Fetch related about info
    const { data: aboutInfo, error: aboutError } = await supabase
      .from("about_info")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (aboutError && aboutError.code !== "PGRST116") {
      // PGRST116 = no rows found - it's okay to have no about_info yet
      throw aboutError;
    }

    return NextResponse.json({
      ...user,
      ...(aboutInfo || {}), // merge aboutInfo if exists
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { about_text, parent_notes, mood } = await req.json();

    if (!about_text && !parent_notes && !mood) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { error } = await supabase.from("about_info").upsert(
      {
        user_id: userId,
        about_text,
        parent_notes,
        mood,
      },
      { onConflict: "user_id" }
    );

    if (error) throw error;

    return NextResponse.json({ message: "Profile updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
