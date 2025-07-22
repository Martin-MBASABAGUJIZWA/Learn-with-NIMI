import supabase from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const userId = "00000000-0000-0000-0000-000000000001";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      console.warn("No activities found for user", userId);
      return NextResponse.json([]);
    }

    // Make sure data is an array before mapping
    if (!Array.isArray(data)) {
      console.error("Expected data to be array, got:", data);
      return NextResponse.json([], { status: 200 });
    }

    const transformed = data.map((item) => ({
      ...item,
      time: item.created_at ? dayjs(item.created_at).fromNow() : null,
    }));

    return NextResponse.json(transformed);
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
