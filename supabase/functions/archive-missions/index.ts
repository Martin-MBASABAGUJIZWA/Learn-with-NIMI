// supabase/functions/archive-missions/index.ts

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  // Get today's unlocked day (example logic)
  const unlockedDay = new Date().getDate();

  const { data, error } = await supabase
    .from("daily_missions")
    .update({ archived: true })
    .lt("day_number", unlockedDay)
    .eq("archived", false);

  if (error) {
    console.error("Archiving error:", error);
    return new Response(JSON.stringify({ success: false, error }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true, archived: data.length }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
