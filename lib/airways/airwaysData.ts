// ══════════════════════════════════════════════════════════════
//  NIMIPIKO AIRWAYS — Data layer
//  Fetches all child + story data needed by boarding-pass,
//  passport and stamp-collection generators.
// ══════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";

export interface AirwaysStory {
  id: string;
  title: string;
  slug: string | null;
  cover_url: string | null;
  sort_order: number;
  /** attitude awarded when this story is completed (e.g. "SUPER CURIEUX") */
  attitude: string | null;
  /** true when every active slot for this story is complete */
  is_complete: boolean;
  /** ISO string of the last slot completion, null if not complete */
  completed_at: string | null;
}

export interface AirwaysChildData {
  id: string;
  name: string;
  age: number | null;
  avatar_url: string | null;
  /** Attitude label set at registration, e.g. "SUPER CURIEUX" */
  attitude: string | null;
  /** Optional pre-stored badge PNG URL; when null, badge is generated inline from attitude + story 1 */
  attitude_badge_url: string | null;
  language: string;
  created_at: string;
  /** parent_id used for champion-number derivation */
  parent_id: string;
  /** 1-indexed position of this child among the parent's children (oldest first) */
  sibling_rank: number;
  /** all active stories with completion status */
  stories: AirwaysStory[];
  /** first incomplete story, or last story if all complete */
  current_story: AirwaysStory | null;
}

export async function fetchAirwaysData(
  supabase: SupabaseClient,
  childId: string
): Promise<AirwaysChildData | null> {
  // ── Child profile ───────────────────────────────────────────
  const { data: child, error: childErr } = await supabase
    .from("children")
    .select("id, name, age, avatar_url, attitude, attitude_badge_url, language, created_at, parent_id")
    .eq("id", childId)
    .single();
  if (childErr || !child) return null;

  // ── Sibling rank + stories — parallel (stories are child-independent) ──────
  const [{ count }, { data: storiesRaw }] = await Promise.all([
    supabase
      .from("children")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", child.parent_id)
      .lte("created_at", child.created_at),
    supabase
      .from("stories")
      .select("id, title, slug, cover_url, sort_order, attitude")
      .eq("is_active", true)
      .order("sort_order"),
  ]);
  const sibling_rank = count ?? 1;

  if (!storiesRaw?.length) {
    return { ...child, sibling_rank, stories: [], current_story: null };
  }

  const storyIds = storiesRaw.map((s) => s.id);

  // ── Mission slots for these stories ─────────────────────────
  const { data: slotsRaw } = await supabase
    .from("story_slots")
    .select("story_id, mission_id")
    .in("story_id", storyIds);

  // Group slot mission IDs by story
  const slotsMap = new Map<string, string[]>();
  for (const row of slotsRaw ?? []) {
    const arr = slotsMap.get(row.story_id) ?? [];
    arr.push(row.mission_id);
    slotsMap.set(row.story_id, arr);
  }

  const allMissionIds = (slotsRaw ?? []).map((r) => r.mission_id);

  // ── Child progress for these missions ───────────────────────
  const { data: progressRaw } = await supabase
    .from("child_progress")
    .select("mission_id, completed_at")
    .eq("child_id", childId)
    .eq("language", child.language)
    .in("mission_id", allMissionIds);

  const doneSet = new Map<string, string>(); // mission_id → completed_at
  for (const row of progressRaw ?? []) {
    doneSet.set(row.mission_id, row.completed_at);
  }

  // ── Build story list with completion status ──────────────────
  const stories: AirwaysStory[] = storiesRaw.map((s) => {
    const slots = slotsMap.get(s.id) ?? [];
    const is_complete = slots.length > 0 && slots.every((m) => doneSet.has(m));
    let completed_at: string | null = null;
    if (is_complete) {
      // latest slot completion date = story completion date
      const dates = slots.map((m) => doneSet.get(m)!);
      completed_at = dates.sort().at(-1) ?? null;
    }
    return { ...s, attitude: s.attitude ?? null, is_complete, completed_at };
  });

  const current_story =
    stories.find((s) => !s.is_complete) ?? stories.at(-1) ?? null;

  return { ...child, sibling_rank, stories, current_story };
}

/** Derives the champion number from child name, current story sort_order, and sibling rank.
 *  Format: {FIRST3}-{storyLetter}-{rank:003}
 *  e.g. story 1 → KET-A-001, story 2 → KET-B-001, story 26 → KET-Z-001 */
export function championNumber(name: string, storyOrder: number, rank: number): string {
  const prefix = name.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3).padEnd(3, "X");
  const letter = String.fromCharCode(64 + Math.min(storyOrder, 26)); // A=1, B=2 … Z=26
  return `${prefix}-${letter}-${String(rank).padStart(3, "0")}`;
}

/** Flight number for a given book (1-based sort_order).
 *  NMP101 … NMP112 */
export function flightNumber(sortOrder: number): string {
  return `NMP1${String(sortOrder).padStart(2, "0")}`;
}

/** Formats a JS Date / ISO string as DD / MM / YYYY */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "__/__/____";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} / ${String(d.getMonth() + 1).padStart(2, "0")} / ${d.getFullYear()}`;
}
