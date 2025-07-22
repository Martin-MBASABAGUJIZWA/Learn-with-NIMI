import supabase from "./supabaseClient";

const GUEST_PROGRESS_KEY = "nimi_guest_progress";

// Load guest progress from localStorage
export function loadGuestProgress() {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(GUEST_PROGRESS_KEY);
  return stored ? JSON.parse(stored) : null;
}

// Save guest progress to localStorage
export function saveGuestProgress(newProgress: {
  points?: number;
  completedMissions?: string[];
}) {
  if (typeof window === "undefined") return;

  const current = localStorage.getItem(GUEST_PROGRESS_KEY);
  let progress = current ? JSON.parse(current) : { points: 0, completedMissions: [] };

  progress.points += newProgress.points || 0;

  progress.completedMissions = Array.from(
    new Set([
      ...(progress.completedMissions || []),
      ...(newProgress.completedMissions || []),
    ])
  );

  localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(progress));
}

// Clear guest progress from localStorage
export function clearGuestProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_PROGRESS_KEY);
}

// Sync guest progress to Supabase after login
export async function syncGuestProgressToSupabase(userId: string) {
  const guestProgress = loadGuestProgress();
  if (!guestProgress) return;

  try {
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("points, completed_missions")
      .eq("id", userId)
      .single();

    if (fetchError) throw fetchError;

    const updatedPoints =
      (existingProfile?.points || 0) + (guestProgress.points || 0);
    const updatedMissions = Array.from(
      new Set([
        ...(existingProfile?.completed_missions || []),
        ...(guestProgress.completedMissions || []),
      ])
    );

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        points: updatedPoints,
        completed_missions: updatedMissions,
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    clearGuestProgress();
  } catch (error) {
    console.error("Failed to sync guest progress:", error);
  }
}
