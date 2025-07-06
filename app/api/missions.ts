// pages/api/missions.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase
    .from("daily_missions")
    .select("*")
    .order("day_number", { ascending: true })
    .order("mission_time", { ascending: true });

  if (error) {
    console.error("Error fetching missions:", error);
    return res.status(500).json({ error: error.message });
  }

  // Group missions by day
  const grouped = data.reduce((acc: any[], mission) => {
    let dayGroup = acc.find((d) => d.day === mission.day_day);
    if (!dayGroup) {
      dayGroup = {
        day: mission.day_number,
        date: mission.date,
        title: mission.day_title,
        theme: mission.theme,
        color: mission.color,
        emoji: mission.emoji,
        completed: false, // or compute based on child progress table later
        missions: [],
      };
      acc.push(dayGroup);
    }

    dayGroup.missions.push({
      id: mission.id,
      time: mission.mission_time,
      title: mission.mission_title,
      type: mission.mission_type,
      duration: mission.duration,
      points: mission.points,
      objectives: mission.objectives,
      activity: mission.activity,
      pikoVictory: mission.pikoVictory,
      materials: mission.materials,
      completed: mission.completed,
      icon: mission.icon,
      funFact: mission.funFact,
    });

    return acc;
  }, []);

  res.status(200).json(grouped);
}
