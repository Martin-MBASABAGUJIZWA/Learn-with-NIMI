export const runtime = "nodejs";
export const maxDuration = 300;

import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyDigest, type WeeklyDigestChild } from "@/lib/email";
import { getServiceClient } from "@/lib/supabase/serviceClient";



function weekLabel(): string {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 7);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `${fmt(start)} – ${fmt(now)}`;
}

export async function GET(req: NextRequest) {
  const sb = getServiceClient();
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const PAGE = 200;
  let offset = 0;
  let sent = 0;
  const errors: string[] = [];

  // Paginate parents so we never load the whole table into memory at once.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: parents, error: pErr } = await sb
      .from("parents")
      .select("id, email, name")
      .not("email", "is", null)
      .range(offset, offset + PAGE - 1);

    if (pErr) { console.error("[weekly-digest] parent query error:", pErr.message); return NextResponse.json({ error: "Internal error" }, { status: 500 }); }
    if (!parents?.length) break;

    const parentIds = parents.map(p => p.id);

    // Round 1: all children for this page of parents — 1 query instead of 200.
    const { data: allChildrenRows } = await sb
      .from("children")
      .select("id, name, language, parent_id")
      .in("parent_id", parentIds);

    const allChildrenForPage = allChildrenRows ?? [];
    const childrenByParent = new Map<string, typeof allChildrenForPage>();
    for (const c of allChildrenForPage) {
      if (!childrenByParent.has(c.parent_id)) childrenByParent.set(c.parent_id, []);
      childrenByParent.get(c.parent_id)!.push(c);
    }

    const allChildIds = allChildrenForPage.map(c => c.id);

    if (allChildIds.length > 0) {
      // Round 2: all activity data + trial subs for the full page — 4 queries
      // instead of up to 4×200 = 800 per-parent queries.
      const [missionsRes, actDatesRes, feelingsRes, trialSubsRes] = await Promise.all([
        sb.from("child_progress")
          .select("child_id, mission_id, stars_earned, language")
          .in("child_id", allChildIds)
          .gte("completed_at", weekAgo),
        sb.from("child_progress")
          .select("child_id, completed_at, language")
          .in("child_id", allChildIds)
          .gte("completed_at", thirtyDaysAgo),
        sb.from("story_feelings")
          .select("child_id, feeling")
          .in("child_id", allChildIds)
          .gte("felt_at", weekAgo),
        sb.from("nimipiko_subscriptions")
          .select("parent_id, current_period_end")
          .in("parent_id", parentIds)
          .eq("payment_provider", "trial")
          .eq("status", "active"),
      ]);

      // Story slots for all missions seen this week — 1 query instead of 200.
      const allWeekMissions = missionsRes.data ?? [];
      const allMissionIds = [...new Set(allWeekMissions.map(m => m.mission_id))];
      const { data: storySlotRows } = allMissionIds.length > 0
        ? await sb.from("story_slots").select("mission_id, story_id").in("mission_id", allMissionIds)
        : { data: [] };
      const missionToStory = new Map((storySlotRows ?? []).map(r => [r.mission_id, r.story_id]));

      const trialSubMap = new Map(
        (trialSubsRes.data ?? []).map(r => [r.parent_id, r.current_period_end])
      );

      const today = new Date();

      for (const parent of parents) {
        try {
          const children = childrenByParent.get(parent.id) ?? [];
          if (!children.length) continue;

          const childDigests: WeeklyDigestChild[] = [];

          for (const child of children) {
            const missions = allWeekMissions.filter(m => m.child_id === child.id && m.language === child.language);
            const missionsThisWeek = missions.length;
            const starsThisWeek = missions.reduce((s, m) => s + (m.stars_earned ?? 0), 0);
            const storiesThisWeek = new Set(missions.map(m => missionToStory.get(m.mission_id)).filter(Boolean)).size;

            const actDates = (actDatesRes.data ?? [])
              .filter(r => r.child_id === child.id && r.language === child.language);
            const daySet = new Set(actDates.map(r => new Date(r.completed_at).toISOString().slice(0, 10)));
            let streak = 0;
            for (let i = 0; i < 30; i++) {
              const d = new Date(today);
              d.setDate(today.getDate() - i);
              if (daySet.has(d.toISOString().slice(0, 10))) streak++;
              else if (i > 0) break;
            }

            const feelings = (feelingsRes.data ?? [])
              .filter(r => r.child_id === child.id)
              .map(r => r.feeling);

            childDigests.push({ name: child.name, language: child.language, missionsThisWeek, storiesThisWeek, streak, starsThisWeek, feelings });
          }

          if (!childDigests.length) continue;

          let trialDaysLeft: number | undefined;
          const trialEnd = trialSubMap.get(parent.id);
          if (trialEnd) {
            const msLeft = new Date(trialEnd as string).getTime() - Date.now();
            const days = Math.max(0, Math.ceil(msLeft / 86_400_000));
            if (days <= 3) trialDaysLeft = days;
          }

          await sendWeeklyDigest({
            to: parent.email,
            parentName: parent.name ?? "there",
            weekOf: weekLabel(),
            children: childDigests,
            trialDaysLeft,
          });

          sent++;
        } catch (err) {
          errors.push(`${parent.email}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    offset += PAGE;
    if (parents.length < PAGE) break;
  }

  return NextResponse.json({ sent, errors });
}
