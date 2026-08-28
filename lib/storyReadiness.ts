// Story Readiness Engine — SA-3.3
// Evaluates a story against requirements and returns a readiness score.
// Cover and Meet Characters are optional bonus items — they don't block publishing.

export interface ReadinessItem {
  key: string;
  label: string;
  group: "assets" | "activities";
  done: boolean;
  optional?: boolean;
}

export interface ReadinessResult {
  items: ReadinessItem[];
  completed: number;
  total: number;
  score: number;
  status: "draft" | "in_progress" | "nearly_ready" | "ready";
  statusLabel: string;
  statusColor: string;
}

export function computeReadiness(story: {
  cover_url?: string | null;
  story_pages?: {
    id: string;
    image_url?: string | null;
    story_page_versions?: { language: string; image_url?: string | null; audio_url?: string | null }[];
  }[];
  coloring_pages?: { id: string }[];
  story_versions?: { language?: string }[];
  story_slots?: {
    slot_key: string;
    mission_id?: string | null;
    missions?: {
      mission_versions: { language?: string | null; media_url: string | null }[];
    } | null;
  }[];
  // When provided, all media checks are scoped to this language
  language?: string;
}): ReadinessResult {
  const lang = story.language;
  const slots = story.story_slots ?? [];
  const pages = story.story_pages ?? [];

  // Check mission media — scoped to language when provided
  const hasMissionMedia = (key: string): boolean => {
    const slot = slots.find(s => s.slot_key === key);
    if (!slot?.mission_id) return false;
    const versions = slot.missions?.mission_versions ?? [];
    if (lang) return versions.some(v => v.language === lang && !!v.media_url);
    return versions.some(v => !!v.media_url);
  };

  // FlipFlop: per-language requires ≥1 image AND ≥50% audio coverage for that language.
  // Global (no language): true if any pages exist.
  const hasFlipFlop = (() => {
    if (pages.length === 0) return false;
    if (!lang) return true;
    // Images live on the base page (language-neutral illustration) OR a lang-specific version
    const hasImages = pages.some(p =>
      !!p.image_url || (p.story_page_versions ?? []).some(v => v.language === lang && v.image_url)
    );
    const audioCount = pages.filter(p =>
      (p.story_page_versions ?? []).some(v => v.language === lang && v.audio_url)
    ).length;
    return hasImages && audioCount >= pages.length * 0.5;
  })();

  const hasColoring = (story.coloring_pages ?? []).length > 0;

  const items: ReadinessItem[] = [
    { key: "cover",              label: "Cover Image",         group: "assets",     done: !!story.cover_url,                   optional: true },
    { key: "flipflop_audio",     label: "FlipFlop Audio Book", group: "activities", done: hasFlipFlop },
    { key: "story_pdf",          label: "Story PDF",           group: "activities", done: hasMissionMedia("story_pdf") },
    { key: "coloring",           label: "Coloring Activity",   group: "activities", done: hasColoring },
    { key: "move_explore",       label: "Move & Explore",      group: "activities", done: hasMissionMedia("move_explore") },
    { key: "sing_along",         label: "Karaoke",             group: "activities", done: hasMissionMedia("sing_along") },
    { key: "bonus_video",        label: "Bonus Video",         group: "activities", done: hasMissionMedia("bonus_video") },
    { key: "challenge_1",        label: "Weekly Challenge 1",  group: "activities", done: hasMissionMedia("challenge_1") },
    { key: "challenge_2",        label: "Weekly Challenge 2",  group: "activities", done: hasMissionMedia("challenge_2") },
    { key: "challenge_3",        label: "Weekly Challenge 3",  group: "activities", done: hasMissionMedia("challenge_3") },
    { key: "destination_video",  label: "Destination Video",   group: "activities", done: hasMissionMedia("destination_video") },
  ];

  const required  = items.filter(i => !i.optional);
  const completed = required.filter(i => i.done).length;
  const total     = required.length;
  const score     = total > 0 ? Math.round((completed / total) * 100) : 0;

  let status: ReadinessResult["status"];
  let statusLabel: string;
  let statusColor: string;

  if (score === 100) {
    status = "ready";        statusLabel = "Ready To Publish"; statusColor = "emerald";
  } else if (score >= 90) {
    status = "nearly_ready"; statusLabel = "Nearly Ready";     statusColor = "blue";
  } else if (score >= 50) {
    status = "in_progress";  statusLabel = "In Progress";      statusColor = "amber";
  } else {
    status = "draft";        statusLabel = "Draft";            statusColor = "gray";
  }

  return { items, completed, total, score, status, statusLabel, statusColor };
}
