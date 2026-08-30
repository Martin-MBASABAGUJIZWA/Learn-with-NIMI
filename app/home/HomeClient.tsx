"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeMotion } from "@/hooks/useThemeMotion";
import { Crown } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import {
  getChildren, ensureParentRow, getStorageUrl,
  getCurrentLevel, getTotalStars,
  getWeekStreak, getActivityDates,
  getChildAchievements,
  getChildCosmetics, type ChildCosmetics,
  getStreakShieldsPurchased, getUsedShieldDates,
} from "@/lib/queries";
import { resolveShields } from "@/lib/streakShields";
import { computeStreaks } from "@/lib/parentInsights";
import type { Child, ChildAchievement } from "@/lib/queries";
import { getStoryLibrary, getStorySlots, getStoryDetails, getPopularStories, type PopularStory } from "@/lib/storyRepository";
import { getActiveSubscription } from "@/lib/payments/products";
import type { StoryLibraryItem, StorySlot } from "@/lib/story-types";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/AppThemeProvider";
import { getThemeAssets } from "@/lib/design-system/assetRegistry";
import AppShell              from "@/components/layout/AppShell";
import { Bone }             from "@/components/ui/Bone";
import { RefreshingBadge }  from "@/components/layout/RefreshingBadge";
import HomeAdventureSection  from "@/components/home/HomeAdventureSection";
import HomeStoryLibrarySection from "@/components/home/HomeStoryLibrarySection";
import HomeStoryJourneyPanel from "@/components/home/HomeStoryJourneyPanel";
import HomeWeekStreakPanel   from "@/components/home/HomeWeekStreakPanel";
import HomeMotivationCard    from "@/components/home/HomeMotivationCard";
import NotificationOptInPrompt from "@/components/home/NotificationOptInPrompt";
import WelcomeBackOverlay      from "@/components/home/WelcomeBackOverlay";
import NimiProactiveBanner     from "@/components/home/NimiProactiveBanner";
import { SHOP_ITEM_MAP } from "@/components/shop/_shopData";

const ACTIVE_CHILD_KEY = "nimipiko_active_child";

const LEVELS = [
  { labelKey: "levelNameSeed",      icon: "🌱", maxXp: 10   },
  { labelKey: "levelNameExplorer",  icon: "🚶", maxXp: 25   },
  { labelKey: "levelNameCreator",   icon: "✏️",  maxXp: 50   },
  { labelKey: "levelNameScientist", icon: "🔬", maxXp: 80   },
  { labelKey: "levelNameHero",      icon: "⭐", maxXp: 120  },
];



const CATEGORY_VISUALS: Record<string, { emoji: string; bg: string; accent: string; label: string }> = {
  morning:   { emoji: "🎵", bg: "from-purple-50 to-pink-100",    accent: "#ec4899", label: "Morning Song"  },
  movement:  { emoji: "🤸", bg: "from-pink-50   to-red-100",     accent: "#f43f5e", label: "Move & Groove" },
  artistic:  { emoji: "🎨", bg: "from-amber-50  to-yellow-100",  accent: "#fbbf24", label: "Art Time"      },
  histoire:  { emoji: "📖", bg: "from-blue-50   to-sky-100",     accent: "#38bdf8", label: "Story Time"    },
  zoom:      { emoji: "🔍", bg: "from-green-50  to-emerald-100", accent: "#34d399", label: "Zoom In"       },
  discovery: { emoji: "🌍", bg: "from-teal-50   to-cyan-100",    accent: "#22d3ee", label: "Discover"      },
  flipflop:  { emoji: "🎧", bg: "from-violet-50 to-purple-100",  accent: "#a78bfa", label: "Flip Flop"     },
  coloring:  { emoji: "🦋", bg: "from-pink-50   to-rose-100",    accent: "#fb7185", label: "Color"         },
};



const CAT_BADGE_DISPLAY: Record<string, { emoji: string; label: string; from: string; to: string; glow: string }> = {
  morning:   { emoji: "🎵", label: "Music Master",   from: "#ec4899", to: "#db2777", glow: "#ec4899" },
  movement:  { emoji: "🤸", label: "Move Champion",  from: "#f43f5e", to: "#e11d48", glow: "#f43f5e" },
  artistic:  { emoji: "🎨", label: "Art Star",       from: "#fbbf24", to: "#f59e0b", glow: "#fbbf24" },
  histoire:  { emoji: "📖", label: "Story Master",   from: "#38bdf8", to: "#0ea5e9", glow: "#38bdf8" },
  zoom:      { emoji: "🔍", label: "Zoom Explorer",  from: "#34d399", to: "#10b981", glow: "#34d399" },
  discovery: { emoji: "🌍", label: "Discoverer",     from: "#22d3ee", to: "#06b6d4", glow: "#22d3ee" },
  flipflop:  { emoji: "🎧", label: "Audio Legend",   from: "#a78bfa", to: "#7c3aed", glow: "#a78bfa" },
  coloring:  { emoji: "🦋", label: "Color Expert",   from: "#fb7185", to: "#e11d48", glow: "#fb7185" },
};

function parseBadgeSlug(slug: string): { emoji: string; label: string; from: string; to: string; glow: string } {
  if (slug.startsWith("trilingual-story-"))
    return { emoji: "🌐", label: "Trilingual!", from: "#14b8a6", to: "#0d9488", glow: "#14b8a6" };
  if (slug.startsWith("story-streak-")) {
    const n = slug.split("-")[2] ?? "5";
    return { emoji: "🔥", label: `${n}-Story Streak`, from: "#f97316", to: "#ea580c", glow: "#f97316" };
  }
  if (slug.startsWith("story-") && slug.includes("-complete-"))
    return { emoji: "📚", label: "Story Complete", from: "#818cf8", to: "#6366f1", glow: "#818cf8" };
  if (slug.startsWith("level-") && slug.includes("-complete-")) {
    const n = slug.split("-")[1] ?? "1";
    return { emoji: "⭐", label: `Level ${n} Champ`, from: "#fbbf24", to: "#f59e0b", glow: "#fbbf24" };
  }
  const cat = slug.split("-")[0] ?? "";
  return CAT_BADGE_DISPLAY[cat] ?? { emoji: "🏅", label: "Achievement", from: "#818cf8", to: "#6366f1", glow: "#818cf8" };
}

const LOCKED_BADGE_PLACEHOLDERS = [
  { emoji: "🎨", label: "Art Star",    from: "#fbbf24", to: "#f59e0b", glow: "#fbbf24" },
  { emoji: "🧩", label: "Puzzle Pro",  from: "#818cf8", to: "#6366f1", glow: "#818cf8" },
  { emoji: "🔥", label: "Streak Hero", from: "#f97316", to: "#ea580c", glow: "#f97316" },
];




const up      = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const } } };
const pop     = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as const } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

interface HomeSnapshot {
  ts: number;
  stories: StoryLibraryItem[];
  slots: StorySlot[];
  level: number;
  totalStars: number;
  weekStreak: boolean[];
  achievements: ChildAchievement[];
  consecutiveStreak: number;
  popularStories: PopularStory[];
  cosmetics: ChildCosmetics;
}

function saveHomeSnapshot(key: string, snap: Omit<HomeSnapshot, "ts">) {
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), ...snap })); } catch { /* quota */ }
}

interface Props {
  initialChildren?: Child[];
  initialHasSubscription?: boolean;
}

function InlineToast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.9 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-notification flex items-center gap-2.5 bg-gray-900/90 backdrop-blur-sm text-white px-4 py-2.5 rounded-2xl shadow-2xl pointer-events-none"
    >
      <span className="text-mbase leading-none">⚠️</span>
      <span className="font-nunito font-semibold text-sml leading-snug max-w-[220px]">{message}</span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function HomeClient({ initialChildren, initialHasSubscription }: Props = {}) {
  const router = useRouter();
  const m = useThemeMotion();
  const { setLanguage, t } = useLanguage();
  const { themeId, theme } = useAppTheme();
  const assets = getThemeAssets(themeId);

  const activeChildRef       = useRef<Child | null>(null);
  const switchGenRef         = useRef(0);
  const selectGenRef         = useRef(0);          // guards child-switch race
  const subscriptionLoadedRef = useRef(initialChildren !== undefined); // RSC path resolves immediately
  const silentRefreshingRef  = useRef(false);      // prevents concurrent silentRefresh calls
  const [loading,         setLoading]         = useState(true);
  const [initError,       setInitError]       = useState(false);
  const [refreshing,      setRefreshing]      = useState(false);
  const [children,        setChildren]        = useState<Child[]>([]);
  const [activeChild,     setActiveChild]     = useState<Child | null>(null);
  const [noChildrenYet,   setNoChildrenYet]   = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isTrial,           setIsTrial]           = useState(false);
  const [trialDaysLeft,     setTrialDaysLeft]     = useState(0);
  const [trialJustExpired,  setTrialJustExpired]  = useState(false);
  const [stories,          setStories]          = useState<StoryLibraryItem[]>([]);
  const [slots,            setSlots]            = useState<StorySlot[]>([]);
  const [popularStories,   setPopularStories]   = useState<PopularStory[]>([]);
  const [level,            setLevel]            = useState(1);
  const [totalStars,       setTotalStars]       = useState(0);
  const [weekStreak,         setWeekStreak]         = useState<boolean[]>([false,false,false,false,false,false,false]);
  const [communityCreations, setCommunityCreations] = useState<Array<{ id: string; imageUrl: string; childName: string; type: string }>>([]);
  const [achievements,       setAchievements]       = useState<ChildAchievement[]>([]);
  const [consecutiveStreak,  setConsecutiveStreak]  = useState(0);
  const [favorites,          setFavorites]          = useState<Set<string>>(new Set());
  const [cosmetics,          setCosmetics]          = useState<ChildCosmetics>({ nimi_outfit: null, piko_outfit: null, frame: null, title_badge: null });
  const [welcomeBack,        setWelcomeBack]        = useState<{ show: boolean; daysAway: number }>({ show: false, daysAway: 0 });
  const [langToast,          setLangToast]          = useState<string | null>(null);
  const langToastKey = useRef(0);

  useEffect(() => { void init(); }, []);

  // Keep ref current so the language-change handler below always sees the
  // latest child without re-registering the event listener on every render.
  useEffect(() => { activeChildRef.current = activeChild; }, [activeChild]);

  // When the global language switcher fires, reload all per-language data.
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handler = (e: Event) => {
      const lang = (e as CustomEvent<{ language: Language }>).detail?.language;
      if (!lang) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
      const child = activeChildRef.current;
      if (!child) return;
      const gen = ++switchGenRef.current;
      const updated = { ...child, language: lang };
      activeChildRef.current = updated;
      setActiveChild(updated);
      setRefreshing(true);
      try {
        const [lib, lvl, stars, streak, ach, actDates, popular, cos] = await Promise.all([
          getStoryLibrary(updated.id, lang),
          getCurrentLevel(updated.id, lang),
          getTotalStars(updated.id, lang),
          getWeekStreak(updated.id, lang),
          getChildAchievements(updated.id),
          getActivityDates(updated.id, lang),
          getPopularStories(),
          getChildCosmetics(updated.id),
          getStreakShieldsPurchased(updated.id),
          getUsedShieldDates(updated.id, lang),
        ]);
        if (gen !== switchGenRef.current) return;
        const { usedDates: homeDates3 } = await resolveShields(updated.id, lang, actDates);
        if (gen !== switchGenRef.current) return;
        setStories(lib);
        setLevel(lvl);
        setTotalStars(stars);
        setWeekStreak(streak);
        setAchievements(ach);
        setConsecutiveStreak(computeStreaks(actDates, new Date(), homeDates3).current);
        setPopularStories(popular);
        setCosmetics(cos);
        const cur = lib.find(s => s.unlocked && !s.complete) ?? lib[0];
        if (cur) getStorySlots(updated.id, cur.sid, lang).then(setSlots).catch(() => {});
        else setSlots([]);
      } catch {
        langToastKey.current++;
        setLangToast("Couldn't load content for this language. Please try again.");
      } finally {
        if (gen === switchGenRef.current) setRefreshing(false);
      }
      }, 200);
    };
    window.addEventListener("app:languageChange", handler as EventListener);
    return () => {
      window.removeEventListener("app:languageChange", handler as EventListener);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);

  useEffect(() => {
    let visTimer: ReturnType<typeof setTimeout> | null = null;
    const handleVisibility = () => {
      if (document.visibilityState !== "visible" || !activeChildRef.current) return;
      if (visTimer) clearTimeout(visTimer);
      visTimer = setTimeout(() => {
        if (activeChildRef.current) void silentRefresh(activeChildRef.current);
      }, 300);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (visTimer) clearTimeout(visTimer);
    };
  }, []);

  async function init() {
    try {
      if (initialChildren !== undefined) {
        setChildren(initialChildren);
        setHasSubscription(!!initialHasSubscription);
        // subscriptionLoadedRef already true (initialised from prop)
        if (initialChildren.length === 0) { router.replace("/onboarding"); return; }
        const savedId = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_CHILD_KEY) : null;
        const saved = initialChildren.find(c => c.id === savedId) ?? initialChildren[0];
        await select(saved, initialChildren);
        return;
      }

      // Fire auth validation, parent-row upsert, and children fetch all in parallel.
      // All three internally call auth.getUser() which the Supabase client deduplicates.
      const [{ data: { user } }, , list] = await Promise.all([
        supabase.auth.getUser(),
        ensureParentRow(),
        getChildren(),
      ]);
      if (!user) { router.replace("/loginpage"); return; }
      setChildren(list);
      getActiveSubscription(user.id).then(async (sub) => {
        subscriptionLoadedRef.current = true;
        setHasSubscription(!!sub);
        if (sub?.payment_provider === "trial" && sub.current_period_end) {
          setIsTrial(true);
          const msLeft = new Date(sub.current_period_end).getTime() - Date.now();
          setTrialDaysLeft(Math.max(0, Math.ceil(msLeft / 86_400_000)));
        } else if (!sub) {
          const dismissed = typeof window !== "undefined"
            && localStorage.getItem("nimipiko_trial_expiry_seen") === "1";
          if (!dismissed) {
            const { data } = await supabase
              .from("nimipiko_subscriptions")
              .select("id")
              .eq("parent_id", user.id)
              .eq("payment_provider", "trial")
              .eq("status", "expired")
              .limit(1)
              .maybeSingle();
            if (data) setTrialJustExpired(true);
          }
        }
      }).catch(() => { subscriptionLoadedRef.current = true; }); // failure → treat as free plan
      if (list.length === 0) { router.replace("/onboarding"); return; }
      const savedId = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_CHILD_KEY) : null;
      const saved   = list.find(c => c.id === savedId) ?? list[0];
      await select(saved, list);
    } catch (err) {
      console.error("[home] init failed:", err);
      setInitError(true);
      setLoading(false);
    }
  }

  async function loadCommunityCreations() {
    const { data } = await supabase
      .from("creations")
      .select("id, image_url, child_name, type")
      .eq("is_public", true)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(3);
    if (data) setCommunityCreations(
      data
        .filter(r => { const url = (r.image_url as string | null) ?? ""; return url.length > 0 && !url.startsWith("/") && !url.startsWith("assets/"); })
        .map(r => ({ id: r.id as string, imageUrl: (r.image_url as string | null) ?? "", childName: (r.child_name as string | null) ?? "", type: (r.type as string | null) ?? "art" }))
    );
  }

  async function select(child: Child, list?: Child[]) {
    const gen = ++selectGenRef.current;
    setActiveChild(child);
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_CHILD_KEY, child.id);
      try {
        const raw = localStorage.getItem(`nimi_favs_${child.id}`);
        setFavorites(raw ? new Set(JSON.parse(raw) as string[]) : new Set());
      } catch { setFavorites(new Set()); }

      // Welcome-back overlay: show if returning after 3+ days away.
      const visitKey  = `nimipiko_last_visit_${child.id}`;
      const todayStr  = new Date().toISOString().slice(0, 10);
      const lastVisit = localStorage.getItem(visitKey);
      if (lastVisit && lastVisit !== todayStr) {
        const diffDays = Math.round(
          (new Date(todayStr).getTime() - new Date(lastVisit).getTime()) / 86400000
        );
        if (diffDays >= 3) setWelcomeBack({ show: true, daysAway: diffDays });
      }
      localStorage.setItem(visitKey, todayStr);
    }
    setLanguage(child.language);
    if (list) setChildren(list);

    // SWR: restore last session's snapshot so returning users skip the loading skeleton.
    const snapshotKey = `nimipiko_home_${child.id}_${child.language}`;
    const TWO_HOURS   = 2 * 60 * 60 * 1000;
    let hasCachedData = false;
    if (typeof window !== "undefined") {
      try {
        const raw  = localStorage.getItem(snapshotKey);
        const snap = raw ? (JSON.parse(raw) as HomeSnapshot) : null;
        if (snap && Date.now() - snap.ts < TWO_HOURS) {
          setStories(snap.stories);
          setLevel(snap.level);
          setTotalStars(snap.totalStars);
          setWeekStreak(snap.weekStreak);
          setAchievements(snap.achievements);
          setConsecutiveStreak(snap.consecutiveStreak);
          setPopularStories(snap.popularStories);
          setCosmetics(snap.cosmetics);
          if (snap.slots.length > 0) setSlots(snap.slots);
          setLoading(false);
          hasCachedData = true;
        }
      } catch { /* corrupt snapshot — ignore, proceed with fresh load */ }
    }
    if (hasCachedData) setRefreshing(true);

    try {
      const [lib, lvl, stars, streak, ach, actDates, popular, cos] = await Promise.all([
        getStoryLibrary(child.id, child.language),
        getCurrentLevel(child.id, child.language),
        getTotalStars(child.id, child.language),
        getWeekStreak(child.id, child.language),
        getChildAchievements(child.id),
        getActivityDates(child.id, child.language),
        getPopularStories(),
        getChildCosmetics(child.id),
        // Pre-warm resolveShields inputs so the await below is a cache-hit
        getStreakShieldsPurchased(child.id),
        getUsedShieldDates(child.id, child.language),
      ]);
      // Discard if a newer child selection was triggered while we were fetching
      if (gen !== selectGenRef.current) return;
      const { usedDates: homeDates1 } = await resolveShields(child.id, child.language, actDates);
      if (gen !== selectGenRef.current) return;
      const cStreak = computeStreaks(actDates, new Date(), homeDates1).current;
      setStories(lib);
      setLevel(lvl);
      setTotalStars(stars);
      setWeekStreak(streak);
      setAchievements(ach);
      setConsecutiveStreak(cStreak);
      setPopularStories(popular);
      setCosmetics(cos);
      if (hasCachedData) setRefreshing(false); else setLoading(false);

      // Fetch slots and save complete snapshot once slots are known.
      const cur = lib.find(s => s.unlocked && !s.complete) ?? lib[0];
      if (cur) {
        getStorySlots(child.id, cur.sid, child.language).then(freshSlots => {
          if (gen !== selectGenRef.current) return;
          setSlots(freshSlots);
          saveHomeSnapshot(snapshotKey, { stories: lib, slots: freshSlots, level: lvl,
            totalStars: stars, weekStreak: streak, achievements: ach,
            consecutiveStreak: cStreak, popularStories: popular, cosmetics: cos });
        }).catch(() => {});
      } else {
        setSlots([]);
        saveHomeSnapshot(snapshotKey, { stories: lib, slots: [], level: lvl,
          totalStars: stars, weekStreak: streak, achievements: ach,
          consecutiveStreak: cStreak, popularStories: popular, cosmetics: cos });
      }

      // Community creations — best-effort, never blocks
      void loadCommunityCreations();
    } catch (err) {
      console.error("[home] select failed:", err);
      // Restore picker so the user can choose again rather than getting a stuck skeleton
      setActiveChild(null);
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function silentRefresh(child: Child) {
    if (silentRefreshingRef.current) return;
    silentRefreshingRef.current = true;
    setRefreshing(true);
    try {
    const lang = child.language;
    const [lib, lvl, stars, streak, ach, actDates, popular, cos] = await Promise.all([
      getStoryLibrary(child.id, lang),
      getCurrentLevel(child.id, lang),
      getTotalStars(child.id, lang),
      getWeekStreak(child.id, lang),
      getChildAchievements(child.id),
      getActivityDates(child.id, lang),
      getPopularStories(),
      getChildCosmetics(child.id),
      getStreakShieldsPurchased(child.id),
      getUsedShieldDates(child.id, lang),
    ]);
    const { usedDates: homeDates2 } = await resolveShields(child.id, lang, actDates);
    const cStreak = computeStreaks(actDates, new Date(), homeDates2).current;
    setStories(lib);
    setLevel(lvl);
    setTotalStars(stars);
    setWeekStreak(streak);
    setAchievements(ach);
    setConsecutiveStreak(cStreak);
    setPopularStories(popular);
    setCosmetics(cos);
    const cur = lib.find(s => s.unlocked && !s.complete) ?? lib[0];
    const snapshotKey = `nimipiko_home_${child.id}_${lang}`;
    if (cur) {
      getStorySlots(child.id, cur.sid, lang).then(freshSlots => {
        setSlots(freshSlots);
        saveHomeSnapshot(snapshotKey, { stories: lib, slots: freshSlots, level: lvl,
          totalStars: stars, weekStreak: streak, achievements: ach,
          consecutiveStreak: cStreak, popularStories: popular, cosmetics: cos });
      }).catch(() => {});
    } else {
      setSlots([]);
      saveHomeSnapshot(snapshotKey, { stories: lib, slots: [], level: lvl,
        totalStars: stars, weekStreak: streak, achievements: ach,
        consecutiveStreak: cStreak, popularStories: popular, cosmetics: cos });
    }
    } finally {
      setRefreshing(false);
      silentRefreshingRef.current = false;
    }
  }

  async function handleCreated(child: Child) {
    setNoChildrenYet(false);
    await select(child, [...children, child]);
  }

  if (initError) return (
    <AppShell>
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl leading-none">😕</span>
        <div>
          <p className="font-baloo font-black text-[var(--ds-text-primary)] text-xl mb-1">Couldn&apos;t load your dashboard</p>
          <p className="font-nunito text-[var(--ds-text-secondary)] text-sm">Check your connection and try again.</p>
        </div>
        <button
          onClick={() => { setInitError(false); setLoading(true); void init(); }}
          className="font-baloo font-black px-8 py-3.5 leaf shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all"
          style={{ background: "linear-gradient(135deg,var(--ds-brand-primary),var(--ds-brand-hover))", color: "var(--ds-nav-bg)", boxShadow: "var(--ds-shadow-cta)" }}
        >
          Try Again
        </button>
      </div>
    </AppShell>
  );

  if (noChildrenYet) { router.replace("/onboarding"); return null; }

  /* ─── Derived ──────────────────────────────────────────────────────────── */
  const WEEK_DAYS = [t("dayMon"), t("dayTue"), t("dayWed"), t("dayThu"), t("dayFri"), t("daySat"), t("daySun")];

  // Streak broke = no current streak, had activity earlier this week, haven't done today yet.
  const todayDotIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const streakBroke = consecutiveStreak === 0
    && !weekStreak[todayDotIdx]
    && weekStreak.slice(0, todayDotIdx).some(Boolean);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t("greetingMorning");
    if (h < 17) return t("greetingAfternoon");
    return t("greetingEvening");
  })();
  const dateLocale = activeChild?.language === "fr" ? "fr-FR" : "en-US";

  const curStory         = stories.find(s => s.unlocked && !s.complete) ?? stories[0];
  // First premium-locked story — used as a Club upsell when a free user has finished all free stories
  const nextPremiumStory = !hasSubscription && !stories.find(s => s.unlocked && !s.complete)
    ? (stories.find(s => !s.unlocked && !s.is_free) ?? null)
    : null;
  const doneSlots  = slots.filter(s => s.completed).length;
  const totalSlots = slots.length;
  const pct        = totalSlots > 0 ? Math.round((doneSlots / totalSlots) * 100) : 0;
  const xp         = totalStars;
  // Derive star-level: first bucket whose maxXp >= stars; -1 means stars exceeds all → last level.
  const xpLvlIdxFinal = (() => {
    const i = LEVELS.findIndex(l => xp <= l.maxXp);
    return i === -1 ? LEVELS.length - 1 : i;
  })();
  const levelInfo  = LEVELS[xpLvlIdxFinal];
  const prevMax    = xpLvlIdxFinal > 0 ? LEVELS[xpLvlIdxFinal - 1].maxXp : 0;
  const xpIn       = Math.max(0, xp - prevMax);
  const xpNeeded   = levelInfo.maxXp - prevMax;
  const xpPct      = Math.min(100, Math.round((xpIn / xpNeeded) * 100));
  const xpLevel    = xpLvlIdxFinal + 1;
  // 0 = Mon … 6 = Sun, matching the weekStreak array order
  const todayIdx  = (new Date().getDay() + 6) % 7;

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <AppShell>
      <RefreshingBadge show={refreshing} />
      {loading ? (
        <>
          <div className="min-h-screen pb-24">
            <Bone className="w-full rounded-none" style={{ height: 380 }} />
            <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 flex flex-col xl:flex-row gap-6">
              <div className="flex-1 min-w-0 space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-[40%_1fr] gap-5">
                  <Bone className="h-[340px] leaf-lg" />
                  <Bone className="h-[340px] leaf-lg" />
                </div>
              </div>
              <div className="w-full xl:w-[284px] xl:shrink-0 space-y-4">
                <Bone className="h-[180px] leaf-lg" />
                <Bone className="h-[220px] leaf-lg" />
                <Bone className="h-[140px] leaf-lg" />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className={`min-h-screen content-enter transition-opacity duration-300${refreshing ? " opacity-50 pointer-events-none" : ""}`} style={{ background: "linear-gradient(180deg, #f0f4f8 0%, #f2f7f2 50%, #eef6ee 100%)" }}>

          {/* ════════════════════════════════ HERO ══════════════════════════ */}
          <motion.div
            initial="hidden" animate="visible" variants={stagger}
            className="relative">

            {/* ═══════════════════════ HERO: WORLD STAGE ═══════════════════════ */}
            <div className="relative overflow-hidden" style={{ minHeight: 460 }}>

              {/* ── Decorative scene layer — all purely visual, screen-reader hidden ── */}
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none">

                {/* Layer 1: Hero background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradients.hero}`} />
                {/* Soft radial glow from top */}
                <div className="absolute inset-x-0 top-0 h-[45%]"
                  style={{ background: "radial-gradient(ellipse 60% 55% at 50% 0%, rgba(255,255,255,0.15) 0%, transparent 70%)" }} />

                {/* Clouds */}
                <motion.div className="absolute top-[5%] left-[8%] text-5xl leading-none opacity-85"
                  animate={{ x: [0, 20, 0], y: [0, -5, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}>☁️</motion.div>
                <motion.div className="absolute top-[2%] left-[46%] text-4xl leading-none opacity-70"
                  animate={{ x: [0, -16, 0], y: [0, -3, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}>☁️</motion.div>
                <motion.div className="absolute top-[7%] right-[10%] text-4xl leading-none opacity-80"
                  animate={{ x: [0, 14, 0], y: [0, -6, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}>⛅</motion.div>
                {/* Sparkles */}
                <motion.div className="absolute top-[5%] left-[30%] text-2xl leading-none"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>✨</motion.div>
                <motion.div className="absolute top-[3%] right-[26%] text-xl leading-none"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}>✨</motion.div>
                <motion.div className="absolute top-[12%] left-[44%] text-lg leading-none"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}>⭐</motion.div>
                {/* Butterflies */}
                <motion.div className="absolute top-[18%] left-[7%] text-4xl leading-none"
                  animate={{ x: [0, 28, 10, 35, 0], y: [0, -16, 6, -12, 0], rotate: [0, 15, -10, 8, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}>🦋</motion.div>
                <motion.div className="absolute top-[22%] right-[7%] text-3xl leading-none"
                  animate={{ x: [0, -22, -8, -30, 0], y: [0, -12, 8, -8, 0], rotate: [0, -12, 8, -5, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}>🦋</motion.div>
                <motion.div className="absolute top-[9%] left-[63%] text-2xl leading-none"
                  animate={{ x: [0, 14, -8, 18, 0], y: [0, -14, 5, -8, 0] }}
                  transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3.5 }}>🦋</motion.div>
                {/* Flower cluster — left */}
                <motion.div className="absolute bottom-[24%] left-[0.5%] text-5xl leading-none"
                  animate={{ rotate: [0, 8, -6, 0], scale: [1, 1.07, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>🌸</motion.div>
                <motion.div className="absolute bottom-[19%] left-[5%] text-4xl leading-none"
                  animate={{ rotate: [0, -6, 8, 0], scale: [1, 1.09, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>🌺</motion.div>
                <motion.div className="absolute bottom-[25%] left-[10%] text-3xl leading-none"
                  animate={{ rotate: [0, 10, -7, 0], scale: [1, 1.06, 1] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}>🌼</motion.div>
                <motion.div className="absolute bottom-[20%] left-[15%] text-2xl leading-none"
                  animate={{ rotate: [0, -8, 6, 0], scale: [1, 1.08, 1] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}>🌷</motion.div>
                {/* Flower cluster — right */}
                <motion.div className="absolute bottom-[23%] right-[0.5%] text-5xl leading-none"
                  animate={{ rotate: [0, -8, 6, 0], scale: [1, 1.07, 1] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}>🌼</motion.div>
                <motion.div className="absolute bottom-[18%] right-[5%] text-4xl leading-none"
                  animate={{ rotate: [0, 6, -8, 0], scale: [1, 1.09, 1] }} transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}>🌷</motion.div>
                <motion.div className="absolute bottom-[24%] right-[10%] text-3xl leading-none"
                  animate={{ rotate: [0, -6, 8, 0], scale: [1, 1.07, 1] }} transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1.3 }}>🌸</motion.div>
                <motion.div className="absolute bottom-[19%] right-[15%] text-2xl leading-none"
                  animate={{ rotate: [0, 8, -6, 0], scale: [1, 1.06, 1] }} transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 1.9 }}>🌺</motion.div>

                {/* Layer 2: Ground glow */}
                <div className="absolute bottom-0 inset-x-0 h-[25%]"
                  style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.12) 100%)" }} />

              </div>{/* end decorative layer */}



              {/* ══════════════════════════════════════════════════════════════
                   Layer 3 — CONTENT: greeting left, characters right
              ══════════════════════════════════════════════════════════════ */}
              <div className="relative z-10 flex flex-col md:flex-row md:items-end px-4 sm:px-6 pb-10 sm:pb-14 pt-6 sm:pt-8 max-w-[980px] mx-auto min-h-[440px] gap-4 md:gap-8 justify-center md:justify-between">

                {/* ── LEFT / TOP: Greeting + Progress card ─────────────── */}
                <motion.div variants={up} className="w-full md:flex-1 md:max-w-[400px] flex flex-col justify-end mx-auto md:mx-0">
                  {/* Glass card */}
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/70"
                    style={{ background: "rgba(255,255,255,0.94)", backdropFilter: "blur(24px)" }}>

                    {/* Rainbow accent bar */}
                    <div className="h-1.5 w-full"
                      style={{ background: "linear-gradient(90deg,#22c55e,#38bdf8,#a78bfa,#f59e0b)" }} />

                    <div className="px-5 pt-4 pb-4">
                      {/* Time greeting */}
                      <p className="font-nunito font-extrabold text-[var(--ds-text-brand)] text-2xs tracking-widest uppercase mb-1.5">
                        {greeting} ✨
                      </p>

                      {/* Child name — big and bold */}
                      <h1 className="font-baloo font-black text-[var(--ds-text-primary)]"
                        style={{ fontSize: "clamp(1.8rem,5vw,2.4rem)", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
                        {activeChild?.name ?? "Explorer"}!
                      </h1>

                      {/* Title badge or level pill */}
                      <div className="mt-2">
                        {cosmetics.title_badge && SHOP_ITEM_MAP[cosmetics.title_badge] ? (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full shadow-sm ${SHOP_ITEM_MAP[cosmetics.title_badge].titleColor ?? "bg-[var(--ds-surface-card-active)] text-[var(--ds-text-secondary)]"}`}>
                            {SHOP_ITEM_MAP[cosmetics.title_badge].emoji} {t(SHOP_ITEM_MAP[cosmetics.title_badge].nameKey)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-[var(--ds-brand-subtle)] text-[var(--ds-brand-primary)] border border-[var(--ds-brand-primary)]/20">
                            {levelInfo?.icon} {levelInfo ? t(levelInfo.labelKey) : "Explorer"} · Lv.{xpLevel}
                          </span>
                        )}
                      </div>

                      {/* XP bar */}
                      <div className="mt-3.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-nunito font-bold text-[var(--ds-text-tertiary)] text-2xs">
                            {levelInfo?.icon} Lv.{xpLevel} · {levelInfo ? t(levelInfo.labelKey) : ""}
                          </span>
                          <span className="font-baloo font-black text-[var(--ds-text-brand)] text-2xs">{xpIn}/{xpNeeded} ⭐</span>
                        </div>
                        <div className="h-3 bg-[var(--ds-surface-card-active)] rounded-full overflow-hidden shadow-inner">
                          <motion.div key={`xp-${activeChild?.id}`} className="h-full rounded-full"
                            style={{ background: "linear-gradient(90deg,#22c55e,#16a34a,#0ea5e9)" }}
                            initial={{ width: 0 }} animate={{ width: `${xpPct}%` }}
                            transition={{ duration: 1.4, ease: "easeOut", delay: 0.5 }} />
                        </div>
                      </div>
                    </div>

                    {/* Stats footer — 3 colorful emoji cells */}
                    <div className="flex items-stretch divide-x divide-[var(--ds-border-primary)] bg-[var(--ds-surface-card-hover)]/60 border-t border-[var(--ds-border-primary)]">
                      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3">
                        <span className={`text-xl leading-none ${consecutiveStreak === 0 ? "grayscale opacity-40" : ""}`}>🔥</span>
                        <span className={`font-baloo font-black text-base leading-none mt-0.5 ${consecutiveStreak > 0 ? "text-orange-500" : "text-[var(--ds-text-tertiary)]"}`}>
                          {consecutiveStreak > 0 ? consecutiveStreak : "–"}
                        </span>
                        <span className="font-nunito text-[var(--ds-text-tertiary)] text-4xs leading-none mt-0.5">{t("homeStatStreak")}</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3">
                        <span className="text-xl leading-none">⭐</span>
                        <span className="font-baloo font-black text-amber-500 text-base leading-none mt-0.5">{totalStars}</span>
                        <span className="font-nunito text-[var(--ds-text-tertiary)] text-4xs leading-none mt-0.5">{t("homeStatStars")}</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3">
                        <span className="text-xl leading-none">❤️</span>
                        <span className="font-baloo font-black text-rose-500 text-base leading-none mt-0.5">{level}</span>
                        <span className="font-nunito text-[var(--ds-text-tertiary)] text-4xs leading-none mt-0.5">{t("homeStatLevel")}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ── RIGHT / BOTTOM: Characters on world stage ─────────── */}
                <motion.div variants={up} className="relative flex items-end justify-center md:justify-end shrink-0">
                  {/* Stage spotlight — gold runway glow rising from ground */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[340px] sm:w-[440px] h-[110px] pointer-events-none"
                    style={{ background: "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(201,168,76,0.35) 0%, rgba(201,168,76,0.08) 50%, transparent 75%)" }} />

                  {/* NIMI with outfit badge */}
                  <div className="relative">
                    <motion.img src={`/themes/${themeId}/characters/nimi.png`} alt="Nimi"
                      className="h-[185px] sm:h-[225px] lg:h-[265px] w-auto object-contain drop-shadow-2xl select-none"
                      animate={{ y: [0, -9, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    {cosmetics.nimi_outfit && SHOP_ITEM_MAP[cosmetics.nimi_outfit] && (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute bottom-6 right-0 text-4xl drop-shadow-xl leading-none pointer-events-none select-none"
                        title={t(SHOP_ITEM_MAP[cosmetics.nimi_outfit].nameKey)}
                      >
                        {SHOP_ITEM_MAP[cosmetics.nimi_outfit].emoji}
                      </motion.span>
                    )}
                  </div>

                  {/* PIKO with outfit badge */}
                  <div className="relative mx-2">
                    <motion.img src={`/themes/${themeId}/characters/piko.png`} alt="Piko"
                      className="h-[165px] sm:h-[200px] lg:h-[235px] w-auto object-contain drop-shadow-2xl select-none"
                      animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    {cosmetics.piko_outfit && SHOP_ITEM_MAP[cosmetics.piko_outfit] && (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute bottom-6 right-0 text-4xl drop-shadow-xl leading-none pointer-events-none select-none"
                        title={t(SHOP_ITEM_MAP[cosmetics.piko_outfit].nameKey)}
                      >
                        {SHOP_ITEM_MAP[cosmetics.piko_outfit].emoji}
                      </motion.span>
                    )}
                  </div>

                  {/* ZILO */}
                  <motion.img src={`/themes/${themeId}/characters/zilo.png`} alt="Zilo"
                    className="h-[175px] sm:h-[215px] lg:h-[250px] w-auto object-contain drop-shadow-2xl select-none"
                    animate={{ y: [0, -8, 0] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </motion.div>

              </div>{/* end content */}

              {/* ── Wave bottom transition ─────────────────────────────────── */}
              <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none" style={{ lineHeight: 0 }}>
                <svg viewBox="0 0 1440 110" xmlns="http://www.w3.org/2000/svg"
                  className="w-full block" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="waveGradA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f0f4f8" stopOpacity="0" />
                      <stop offset="100%" stopColor="#f0f4f8" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                  {/* Wave 1 — deep back, faint */}
                  <path
                    d="M0,38 C240,76 480,8 720,42 C960,78 1200,12 1440,46 L1440,110 L0,110 Z"
                    fill="rgba(255,255,255,0.15)" />
                  {/* Wave 2 — mid layer, gradient */}
                  <path
                    d="M0,57 C180,92 360,22 540,58 C720,94 900,20 1080,55 C1260,90 1380,34 1440,58 L1440,110 L0,110 Z"
                    fill="url(#waveGradA)" />
                  {/* Wave 3 — front, solid light */}
                  <path
                    d="M0,76 C200,46 400,104 600,74 C800,44 1000,100 1200,72 C1320,56 1400,82 1440,76 L1440,110 L0,110 Z"
                    fill="#f0f4f8" />
                </svg>
              </div>

            </div>{/* end hero card */}
          </motion.div>

          {/* ── Campus Welcome Strip ──────────────────────────────────────── */}
          <div className="relative z-30 -mt-3 px-4 sm:px-6 pb-2 max-w-[1400px] mx-auto">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[var(--ds-surface-card)]/95 backdrop-blur-sm rounded-2xl shadow-sm border border-[var(--ds-border-brand)]/40 w-fit">
              <motion.img
                src={assets.nimiCircle}
                alt="Nimi"
                className="w-6 h-6 rounded-full object-cover shrink-0 border border-[var(--ds-border-brand)]/50"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span className="font-baloo font-black text-[var(--ds-text-brand)] text-xs sm:text-sml">{t("homeCampusOpen")}</span>
              <span className="font-nunito text-[var(--ds-text-secondary)] text-2xs hidden sm:inline">
                · {new Date().toLocaleDateString(dateLocale, { weekday: "long", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>


          {/* ════════════════════════════ BELOW HERO ════════════════════════ */}
          <div className="relative">

            {/* ── Campus walkway — subtle dashed thread through all zones ── */}
            <div
              className="absolute inset-y-0 pointer-events-none select-none hidden xl:block"
              aria-hidden
              style={{
                left: 22,
                width: 2,
                background: "repeating-linear-gradient(to bottom, var(--ds-brand-primary) 0px, var(--ds-brand-primary) 5px, transparent 5px, transparent 17px)",
                opacity: 0.18,
              }}
            />


            {/* ── Trial-expired one-shot banner ────────────────────────── */}
            {trialJustExpired && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-20 mx-4 lg:mx-6 mt-4 max-w-[1400px] xl:mx-auto"
              >
                <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-4 py-3.5 shadow-sm">
                  <span className="text-2xl shrink-0">⏳</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-baloo font-black text-amber-900 text-sm leading-tight">Your 7-day free trial has ended</p>
                    <p className="text-amber-700 text-xs mt-0.5">
                      You&apos;re now on the free plan — 3 stories & 10 Nimi chats/day.{" "}
                      <Link href="/pricing" className="font-black underline underline-offset-2 hover:text-amber-900">Subscribe to restore full access →</Link>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") localStorage.setItem("nimipiko_trial_expiry_seen", "1");
                      setTrialJustExpired(false);
                    }}
                    className="w-7 h-7 rounded-full hover:bg-amber-100 flex items-center justify-center text-amber-500 hover:text-amber-700 transition shrink-0 text-base font-black"
                    aria-label="Dismiss"
                  >✕</button>
                </div>
              </motion.div>
            )}

            {/* ── Main flex grid ──────────────────────────────────────────── */}
            <div className="relative z-10 flex flex-col xl:flex-row xl:items-start gap-6 px-4 lg:px-6 py-6 max-w-[1400px] mx-auto">

              {/* ══ MAIN COLUMN ══════════════════════════════════════════════ */}
              <main className="flex-1 min-w-0">

                {/* ── YOUR ADVENTURE + STORY LIBRARY — side by side ──────── */}
                <div className="grid grid-cols-1 lg:grid-cols-[40%_1fr] gap-5 items-stretch">
                  <HomeAdventureSection
                    curStory={curStory}
                    doneSlots={doneSlots}
                    totalSlots={totalSlots}
                    pct={pct}
                    slots={slots}
                    up={up}
                    stagger={stagger}
                    hasSubscription={hasSubscription}
                    nextPremiumStory={nextPremiumStory}
                  />

                  <HomeStoryLibrarySection
                    stories={stories}
                    curStory={curStory}
                    hasSubscription={hasSubscription}
                    up={up}
                    stagger={stagger}
                    pop={pop}
                    onPrefetch={activeChild ? (storyId) => {
                      void getStoryDetails(storyId, activeChild.language);
                      void getStorySlots(activeChild.id, storyId, activeChild.language);
                    } : undefined}
                  />
                </div>

              </main>

              {/* ══ RIGHT COMPANION PANEL — sticky below h-16 (64px) header ══ */}
              <aside className="w-full xl:w-[284px] xl:shrink-0 xl:self-start xl:sticky xl:top-[68px]">
                <div
                  className="flex flex-col gap-4 xl:max-h-[calc(100vh-76px)] xl:overflow-y-auto xl:pb-6 xl:pr-0.5"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" } as React.CSSProperties}
                >

                  {/* ── Trial Countdown ─────────────────────────────────────── */}
                  {isTrial && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    >
                      <Link href="/pricing">
                        <div className={`rounded-2xl p-4 cursor-pointer group transition-all border ${
                          trialDaysLeft <= 2
                            ? "bg-gradient-to-br from-red-50 to-orange-50 border-red-200 hover:border-red-300"
                            : "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-300"
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              trialDaysLeft <= 2 ? "bg-red-100" : "bg-amber-100"
                            }`}>
                              <span className="text-xl">{trialDaysLeft <= 2 ? "⚡" : "⏳"}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-baloo font-black text-sml leading-tight ${
                                trialDaysLeft <= 2 ? "text-red-800" : "text-amber-800"
                              }`}>
                                {trialDaysLeft === 0 ? "Trial ending today!" : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left on trial`}
                              </p>
                              <p className={`text-2xs mt-0.5 ${trialDaysLeft <= 2 ? "text-red-600" : "text-amber-600"}`}>
                                {trialDaysLeft <= 2 ? "Subscribe now to keep full access" : "Enjoying Club? Subscribe to keep it →"}
                              </p>
                            </div>
                            <Crown className={`w-4 h-4 shrink-0 group-hover:scale-110 transition-transform ${
                              trialDaysLeft <= 2 ? "text-red-400" : "text-amber-400"
                            }`} />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )}

                  {/* ── Proactive Nimi Banner ────────────────────────────────── */}
                  {activeChild && (
                    <NimiProactiveBanner childId={activeChild.id} language={activeChild.language} />
                  )}

                  {/* 1. TODAY'S MISSION — most actionable, always first ──────── */}
                  <HomeStoryJourneyPanel curStory={curStory} slots={slots} pct={pct} hasSubscription={hasSubscription} nextPremiumStory={nextPremiumStory} />

                  {/* 2. DAILY STREAK ─────────────────────────────────────────── */}
                  <HomeWeekStreakPanel weekStreak={weekStreak} consecutiveStreak={consecutiveStreak} totalStars={totalStars} streakBroke={streakBroke} />

                  {/* 3. ENCOURAGEMENT — dynamic based on streak ─────────────── */}
                  <HomeMotivationCard
                    consecutiveStreak={consecutiveStreak}
                    isComplete={!!curStory?.complete}
                  />

                  {/* Achievements, Community, Masterpiece → accessible from nav */}

                </div>
              </aside>

            </div>{/* end main flex */}
          </div>{/* end relative wrapper */}

        </div>
      )}


      {welcomeBack.show && activeChild && (
        <WelcomeBackOverlay
          childName={activeChild.name}
          daysAway={welcomeBack.daysAway}
          onDismiss={() => setWelcomeBack({ show: false, daysAway: 0 })}
        />
      )}

      {activeChild && (
        <NotificationOptInPrompt childId={activeChild.id} childName={activeChild.name} />
      )}

      <AnimatePresence>
        {langToast && (
          <InlineToast key={`lang-toast-${langToastKey.current}`} message={langToast} onDone={() => setLangToast(null)} />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
