"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeMotion } from "@/hooks/useThemeMotion";
import { DURATION, SPRING } from "@/lib/design-system/motion";
import { Lock, CheckCircle2, Play, Star, Search, ChevronLeft, ChevronRight, Crown, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Bone } from "@/components/ui/Bone";
import { RefreshingBadge } from "@/components/layout/RefreshingBadge";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/AppThemeProvider";
import { getThemeAssets } from "@/lib/design-system/assetRegistry";
import { getChildren, getStorageUrl, getTotalStars, getWeekStreak, getConsecutiveStreak, getChildBadges, getBadgeImages, getTodayMissions, type Child } from "@/lib/queries";
import { getStoryLibrary, getCurrentStoryId } from "@/lib/storyRepository";
import { getActiveSubscription } from "@/lib/payments/products";
import supabase from "@/lib/supabaseClient";
import type { StoryLibraryItem } from "@/lib/story-types";
import { PageSurface, HeroBanner } from "@/components/layout/primitives";
import StatsSidebar from "@/components/home/StatsSidebar";

const ACTIVE_CHILD_KEY = "nimipiko_active_child";
const PAGE_SIZE = 8;

const CATEGORY_SPINE: Record<string, string> = {
  animals:    "#1a5c3a",
  friendship: "#8b1a4a",
  bedtime:    "#1a2d6b",
  adventure:  "#7a2800",
  values:     "#7a5500",
  nature:     "#1a4d1a",
  family:     "#4a0d6e",
  creativity: "#0d2d8b",
};

const CATEGORY_META: Record<string, { emoji: string; key: string; activeClass: string; inactiveClass: string }> = {
  animals:    { emoji: "🐾", key: "storyCatAnimals",    activeClass: "bg-[var(--ds-brand-primary)] text-white border-[var(--ds-border-brand)]",   inactiveClass: "bg-[var(--ds-brand-subtle)] text-[var(--ds-text-brand)] border-[var(--ds-border-brand)] hover:bg-[var(--ds-brand-soft)]" },
  friendship: { emoji: "❤️", key: "storyCatFriendship", activeClass: "bg-pink-500 text-white border-pink-500",         inactiveClass: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100" },
  bedtime:    { emoji: "🌙", key: "storyCatBedtime",    activeClass: "bg-indigo-500 text-white border-indigo-500",     inactiveClass: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
  adventure:  { emoji: "🚀", key: "storyCatAdventure",  activeClass: "bg-orange-500 text-white border-orange-500",    inactiveClass: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
  values:     { emoji: "⭐", key: "storyCatValues",     activeClass: "bg-yellow-500 text-white border-yellow-500",    inactiveClass: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100" },
  nature:     { emoji: "🌿", key: "storyCatNature",     activeClass: "bg-teal-500 text-white border-teal-500",        inactiveClass: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" },
  family:     { emoji: "👨‍👩‍👧", key: "storyCatFamily",    activeClass: "bg-violet-500 text-white border-violet-500",   inactiveClass: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100" },
  creativity: { emoji: "🎨", key: "storyCatCreativity", activeClass: "bg-blue-500 text-white border-blue-500",        inactiveClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
};

// BC1: Hoisted to module scope — defining components inside .map() creates a
// new type each render and causes React to unmount/remount every card on any state change.
interface BookBodyProps {
  story: StoryLibraryItem;
  isCurrent: boolean;
  hasCover: boolean;
  spineColor: string;
  dimmed?: boolean;
  locked?: "premium" | "sequence";
}

function BookBody({ story, isCurrent, hasCover, spineColor, dimmed = false, locked }: BookBodyProps) {
  return (
    <div className="relative group">

      {/* Golden glow behind the book image */}
      <motion.div className="absolute -inset-3 -z-10 rounded-2xl pointer-events-none"
        animate={{ opacity: isCurrent && !story.complete ? [0.5, 1, 0.5] : [0.15, 0.35, 0.15] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(253,224,71,0.5) 0%, rgba(251,191,36,0.2) 45%, transparent 70%)", filter: "blur(12px)" }} />

      {/* Sparkle dots around active book */}
      {isCurrent && !story.complete && !locked && [
        { top: "-6px", left: "20%" }, { top: "-4px", right: "15%" },
        { top: "30%", right: "-6px" }, { bottom: "20%", right: "-4px" },
      ].map((pos, k) => (
        <motion.span key={k} className="absolute text-yellow-300 pointer-events-none select-none z-30"
          style={{ fontSize: "9px", ...pos }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5], y: [0, -4, 0] }}
          transition={{ duration: 1.6 + k * 0.35, repeat: Infinity, delay: k * 0.45 }}>
          ✦
        </motion.span>
      ))}

      {/* BC2: cursor-not-allowed for sequence-locked, cursor-pointer otherwise */}
      <motion.div
        whileHover={{ scale: locked === "sequence" ? 1 : 1.05, y: locked === "sequence" ? 0 : -4 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className={`relative rounded-xl overflow-hidden ${locked === "sequence" ? "cursor-not-allowed" : "cursor-pointer"}`}
        style={{
          height: "clamp(180px, 28vw, 260px)",
          boxShadow: isCurrent && !story.complete
            ? "0 8px 32px rgba(0,0,0,0.35), 0 0 24px rgba(251,191,36,0.3)"
            : "0 6px 24px rgba(0,0,0,0.28)",
        }}>

        {/* The book image — fills the card */}
        {hasCover ? (
          <Image
            src={getStorageUrl(story.cover_url!)}
            alt={story.title}
            fill
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${dimmed ? "grayscale opacity-60" : ""}`}
            draggable={false}
          />
        ) : (
          // BC3: dimmed styling applied to fallback emoji div too
          <div className={`w-full h-full flex flex-col items-center justify-center gap-2 transition-all ${dimmed ? "grayscale opacity-50" : ""}`}
            style={{ background: `linear-gradient(135deg, ${spineColor}cc, ${spineColor}88)` }}>
            <span className="text-5xl drop-shadow-xl">{story.theme_emoji}</span>
            <p className="font-baloo font-black text-white text-center text-xs px-3 leading-tight drop-shadow">{story.title}</p>
          </div>
        )}

        {/* Lock overlay */}
        {locked === "premium" && (
          <div className="absolute inset-0 flex items-center justify-center z-20"
            style={{ background: "rgba(0,0,0,0.35)" }}>
            <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-xl">
              <Crown className="w-6 h-6 text-ds-club" />
            </div>
          </div>
        )}
        {locked === "sequence" && (
          <div className="absolute inset-0 flex items-center justify-center z-20"
            style={{ background: "rgba(0,0,0,0.3)" }}>
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow">
              <Lock className="w-5 h-5 text-[var(--ds-text-secondary)]" />
            </div>
          </div>
        )}

        {/* Complete badge */}
        {story.complete && !locked && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING.bounce}
            className="absolute top-2 right-2 w-7 h-7 bg-ds-action rounded-full flex items-center justify-center shadow-lg z-20">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </motion.div>
        )}

        {/* Current / playing indicator */}
        {isCurrent && !story.complete && !locked && (
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
            className="absolute top-2 right-2 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg z-20">
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
          </motion.div>
        )}

        {/* Tap hint on hover */}
        {!locked && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none">
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.9, repeat: Infinity }}
              className="rounded-full px-3 py-1.5 flex items-center gap-1.5"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
              <span style={{ fontSize: "14px" }}>👆</span>
            </motion.div>
          </div>
        )}

        {/* Progress bar at bottom */}
        {story.progress > 0 && !locked && (
          <div className="absolute bottom-0 inset-x-0 px-2 pb-2 z-20">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.25)" }}>
              <motion.div className="h-full rounded-full bg-yellow-400"
                initial={{ width: 0 }} animate={{ width: `${story.progress * 100}%` }}
                transition={{ duration: DURATION.loopBounce }} />
            </div>
          </div>
        )}

        {/* Club label */}
        {locked === "premium" && (
          <div className="absolute bottom-2 inset-x-2 z-20">
            <div className="bg-ds-club rounded-full px-3 py-1 flex items-center justify-center gap-1">
              <Crown className="w-3 h-3 text-yellow-300" />
              <span className="font-baloo font-black text-white text-2xs">Club only</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

interface Props {
  initialChildren?: Child[];
  initialHasSubscription?: boolean;
}

export default function StoriesClient({ initialChildren, initialHasSubscription }: Props = {}) {
  const { t } = useLanguage();
  const m = useThemeMotion();
  const { themeId } = useAppTheme();
  const assets = getThemeAssets(themeId);
  const [stories, setStories] = useState<StoryLibraryItem[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalStars, setTotalStars] = useState(0);
  const [weekStreak, setWeekStreak] = useState<boolean[]>([false,false,false,false,false,false,false]);
  const [streakCount, setStreakCount] = useState(0);
  const [badges, setBadges] = useState<import("@/lib/queries").ChildBadge[]>([]);
  const [badgeImageMap, setBadgeImageMap] = useState<Record<string, string>>({});
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const activeChildRef = useRef<Child | null>(null);
  const switchGenRef   = useRef(0);

  const loadForChild = useCallback(async (child: Child, lang: Language, silent = false) => {
    const gen = silent ? ++switchGenRef.current : 0;
    if (silent) setRefreshing(true); else setLoading(true);
    const [lib, cur, streak, consStreak, badges, stars, todayMissions, imageMap] = await Promise.all([
      getStoryLibrary(child.id, lang),
      getCurrentStoryId(child.id, lang),
      getWeekStreak(child.id, lang),
      getConsecutiveStreak(child.id, lang),
      getChildBadges(child.id, lang),
      getTotalStars(child.id, lang),
      getTodayMissions(child.id, lang),
      getBadgeImages(),
    ]);

    if (silent && gen !== switchGenRef.current) return;
    setStories(lib);
    setCurrentId(cur);
    setWeekStreak(streak);
    setStreakCount(consStreak);
    setBadges(badges);
    setBadgeImageMap(imageMap);
    setTotalStars(stars);
    setMissionsCompleted(todayMissions.length);
    if (silent) setRefreshing(false); else setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      if (initialChildren !== undefined) {
        if (initialHasSubscription) setHasSubscription(true);
        const savedId = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_CHILD_KEY) : null;
        const child = initialChildren.find(c => c.id === savedId) ?? initialChildren[0];
        if (!child) { setLoading(false); return; }
        activeChildRef.current = child;
        await loadForChild(child, child.language);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      // Fetch subscription + children in parallel — both only need user.id
      const [sub, list] = await Promise.all([
        user ? getActiveSubscription(user.id) : Promise.resolve(null),
        getChildren(),
      ]);
      if (sub) setHasSubscription(true);
      const savedId = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_CHILD_KEY) : null;
      const child = list.find(c => c.id === savedId) ?? list[0];
      if (!child) { setLoading(false); return; }
      activeChildRef.current = child;
      await loadForChild(child, child.language);
    })();
  }, [loadForChild]);

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handler = (e: Event) => {
      const lang = (e as CustomEvent<{ language: Language }>).detail?.language;
      if (!lang) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const child = activeChildRef.current;
        if (!child) return;
        const updated = { ...child, language: lang };
        activeChildRef.current = updated;
        setCategory("all");
        setPage(1);
        await loadForChild(updated, lang, true);
      }, 200);
    };
    window.addEventListener("app:languageChange", handler as EventListener);
    return () => {
      window.removeEventListener("app:languageChange", handler as EventListener);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [loadForChild]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState !== "visible") return;
      const child = activeChildRef.current;
      if (child) void loadForChild(child, child.language, true);
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [loadForChild]);

  const activeCategories = Array.from(new Set(stories.map(s => s.category).filter(Boolean))) as string[];
  const hasCategories = activeCategories.length > 1;

  const categoryTabs = [
    { key: "all", emoji: "📚", label: t("storyCatAll"), activeClass: "bg-ds-action text-white border-ds-action", inactiveClass: "bg-[var(--ds-surface-card)] text-[var(--ds-text-secondary)] border-ds-border hover:bg-[var(--ds-surface-card-hover)]" },
    ...activeCategories.map(c => ({
      key: c,
      emoji: CATEGORY_META[c]?.emoji ?? "📖",
      label: CATEGORY_META[c] ? t(CATEGORY_META[c].key) : c.charAt(0).toUpperCase() + c.slice(1),
      activeClass: CATEGORY_META[c]?.activeClass ?? "bg-ds-action text-white border-ds-action",
      inactiveClass: CATEGORY_META[c]?.inactiveClass ?? "bg-[var(--ds-surface-card)] text-[var(--ds-text-secondary)] border-ds-border hover:bg-[var(--ds-surface-card-hover)]",
    })),
  ];

  const filtered = stories.filter(s => {
    if (category !== "all" && s.category !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!s.title.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const currentStory = stories.find(s => s.sid === currentId);
  const completedCount = stories.filter(s => s.complete).length;

  return (
    <AppShell>
      <RefreshingBadge show={refreshing} />
      <PageSurface>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-5 pb-28 w-full xl:flex xl:gap-6 xl:items-start content-enter transition-opacity duration-300${refreshing ? " opacity-50 pointer-events-none" : ""}`}>
      <main className="flex-1 min-w-0">

        {/* ═══ HERO BANNER ═══ */}
        <HeroBanner zone="library" className="mb-6 overflow-hidden">
          {/* Background orbs */}
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-[var(--ds-surface-card)]/10 blur-xl" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-[var(--ds-surface-card)]/8 blur-2xl" />

          {/* Floating sparkle stars */}
          {([
            { top: "18%", left: "5%",  size: 18, delay: 0,   rotate: true  },
            { top: "70%", left: "12%", size: 12, delay: 0.8, rotate: false },
            { top: "22%", right: "4%", size: 22, delay: 0.3, rotate: true  },
            { top: "72%", right: "8%", size: 14, delay: 1.2, rotate: false },
            { top: "50%", right: "18%",size: 10, delay: 0.6, rotate: false },
          ] as Array<{top:string;size:number;delay:number;rotate:boolean;left?:string;right?:string}>).map((s, i) => (
            <motion.span key={i} className="absolute pointer-events-none select-none"
              style={{ top: s.top, left: s.left, right: s.right, fontSize: s.size }}
              animate={{
                opacity: [0.4, 1, 0.4],
                scale:   [0.7, 1.3, 0.7],
                rotate:  s.rotate ? [0, 25, -25, 0] : [0, 0, 0],
              }}
              transition={{ duration: DURATION.loopBase + DURATION.moderate, repeat: Infinity, delay: s.delay }}
              aria-hidden>⭐</motion.span>
          ))}

          <div className="relative z-10 flex items-center gap-4 px-5 py-5 sm:px-8 sm:py-6">
            {/* Animated Nimi */}
            <motion.div className="relative shrink-0"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: DURATION.loopSlow, repeat: Infinity }}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/50 shadow-xl overflow-hidden">
                <img src={assets.nimiCircle} alt="Nimi" className="w-full h-full object-cover" draggable={false} />
              </div>
              <motion.div className="absolute -bottom-1 -right-1 text-lg"
                animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: DURATION.loopBase, repeat: Infinity, delay: 1 }}>
                ✨
              </motion.div>
            </motion.div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-3xs font-nunito font-black uppercase tracking-[0.18em] mb-0.5">
                ✨ {t("storyLibraryEyebrow")}
              </p>
              <h1 className="font-baloo font-black text-white text-2.5xl sm:text-4xl leading-tight drop-shadow-md">
                {t("storyLibraryTitle")}
              </h1>
              <p className="text-white/85 text-sml font-nunito font-semibold mt-0.5">
                {t("storyLibrarySubtitle")}
              </p>
            </div>

            {/* Stats chips */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {completedCount > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...SPRING.bounce, delay: 0.3 }}
                  className="flex items-center gap-1.5 bg-[var(--ds-surface-card)]/20 border border-white/30 rounded-full px-3 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span className="font-baloo font-black text-white text-sml">{completedCount} done</span>
                </motion.div>
              )}
              {stories.length > 0 && (
                <div className="flex items-center gap-1.5 bg-[var(--ds-surface-card)]/15 border border-white/20 rounded-full px-3 py-1.5">
                  <span className="text-xs">📚</span>
                  <span className="font-baloo font-black text-white text-sml">{stories.length} stories</span>
                </div>
              )}
            </div>
          </div>
        </HeroBanner>

        {/* ═══ CONTINUE HERO — current story ═══ */}
        {currentStory && !currentStory.complete && (
          <Link href={`/stories/${currentStory.slug}`}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }} whileTap={m.buttonPress}
              className="page-shell mb-6 overflow-hidden cursor-pointer group">
              <div className="relative h-40 sm:h-48">
                {currentStory.cover_url ? (
                  <Image src={getStorageUrl(currentStory.cover_url)} alt={currentStory.title} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700" draggable={false} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-7xl">{currentStory.theme_emoji}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
                  <p className="text-yellow-300 text-2xs font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Play className="w-3 h-3 fill-yellow-300" /> {t("storyContinueAdventure")}
                  </p>
                  <h2 className="font-baloo font-black text-white text-xl sm:text-2.5xl leading-tight mb-2">
                    {currentStory.theme_emoji} {currentStory.title}
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-[var(--ds-surface-card)]/20 rounded-full h-2.5 overflow-hidden">
                      <motion.div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${currentStory.progress * 100}%` }}
                        transition={{ duration: DURATION.loopSpark }} />
                    </div>
                    <span className="text-white/80 font-baloo font-black text-sml shrink-0">
                      {Math.round(currentStory.progress * 100)}%
                    </span>
                  </div>
                </div>

                {/* Pulsing play button */}
                <motion.div
                  animate={{ scale: [1, 1.12, 1], boxShadow: ["0 0 0 0 rgba(251,191,36,0.5)", "0 0 0 10px rgba(251,191,36,0)", "0 0 0 0 rgba(251,191,36,0)"] }}
                  transition={{ duration: DURATION.loopFast, repeat: Infinity }}
                  className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </motion.div>
              </div>
            </motion.div>
          </Link>
        )}

        {/* ═══ FILTERS ═══ */}
        {hasCategories ? (
          <div className="page-shell mb-5 p-3 sm:p-4">
            {/* Colorful category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: "none" }}>
              {categoryTabs.map(cat => (
                <motion.button key={cat.key}
                  onClick={() => { setCategory(cat.key); setPage(1); }}
                  whileTap={{ scale: 0.94 }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-baloo font-black text-sml whitespace-nowrap shrink-0 transition-all border ${
                    category === cat.key ? cat.activeClass : cat.inactiveClass
                  } ${category === cat.key ? "shadow-md" : ""}`}>
                  <span className="text-base leading-none">{cat.emoji}</span>
                  {cat.label}
                </motion.button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ds-text-tertiary)]" />
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={t("storySearchPlaceholder")}
                className="w-full bg-ds-input border border-ds-border rounded-full pl-10 pr-4 py-2.5 text-sml text-ds-text placeholder:text-[var(--ds-text-tertiary)] focus:outline-none focus:border-[var(--ds-state-focus)] focus:ring-2 focus:ring-[var(--ds-state-focus)]/20 transition" />
            </div>
          </div>
        ) : (
          /* No categories — compact inline search only */
          <div className="mb-5 relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ds-text-tertiary)] z-10" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search for a story..."
              className="w-full bg-[var(--ds-surface-card)] border border-ds-border rounded-2xl pl-11 pr-4 py-3 text-sml text-ds-text placeholder:text-[var(--ds-text-tertiary)] focus:outline-none focus:border-[var(--ds-state-focus)] focus:ring-2 focus:ring-[var(--ds-state-focus)]/20 shadow-ds-card transition" />
          </div>
        )}

        {/* ═══ BOOK SHELF ═══ */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-5 py-2">
            {Array.from({ length: 10 }).map((_, i) => <Bone key={i} className="h-52 rounded-lg" />)}
          </div>
        ) : paginated.length === 0 ? (
          <div className="page-shell text-center py-16 px-8">
            <motion.span className="text-7xl block mb-4"
              animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: DURATION.loopBase, repeat: Infinity }}>📚</motion.span>
            <p className="font-baloo font-black text-ds-text text-xl mb-1">{t("storyNoResults")}</p>
            <p className="font-nunito text-ds-muted text-sml">Try a different search or category!</p>
          </div>
        ) : (
          <>
            {/* Club upgrade wall */}
            {!hasSubscription && category === "all" && !search.trim() && paginated.some(s => s.is_free) && stories.some(s => !s.is_free && !s.unlocked) && (
              <Link href="/pricing" className="block mb-5">
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }} whileTap={m.buttonPress}
                  className="flex items-center gap-4 rounded-2xl px-5 py-4 cursor-pointer group bg-ds-club shadow-ds-club">
                  <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: DURATION.loopSlow, repeat: Infinity }}
                    className="w-12 h-12 rounded-2xl bg-[var(--ds-surface-card)]/20 flex items-center justify-center shrink-0 border border-white/30">
                    <Crown className="w-6 h-6 text-yellow-300" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-baloo font-black text-white text-base leading-tight">You&apos;ve reached the end of your free stories!</p>
                    <p className="text-white/70 text-xs mt-0.5">
                      {stories.filter(s => !s.is_free && !s.unlocked).length} more adventures are waiting — join Club to unlock them all.
                    </p>
                  </div>
                  <span className="shrink-0 font-baloo font-black text-yellow-300 text-sml group-hover:text-yellow-200 transition-colors whitespace-nowrap">
                    Unlock All →
                  </span>
                </motion.div>
              </Link>
            )}

            {/* Book shelf */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6">
              <AnimatePresence mode="popLayout">
              {paginated.map((story, i) => {
                const isCurrent      = story.sid === currentId;
                const hasCover       = !!story.cover_url;
                const isPremiumLocked = !story.unlocked && !story.is_free && !hasSubscription;
                const spineColor     = CATEGORY_SPINE[story.category ?? ""] ?? "#3b2a1a";

                return (
                  <motion.div key={story.sid}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * DURATION.fast, ...SPRING.soft }}
                    style={{ perspective: "600px" }}>

                    {story.unlocked ? (
                      <Link href={`/stories/${story.slug}`}>
                        <BookBody story={story} isCurrent={isCurrent} hasCover={hasCover} spineColor={spineColor} />
                      </Link>
                    ) : isPremiumLocked ? (
                      <Link href="/pricing">
                        <BookBody story={story} isCurrent={isCurrent} hasCover={hasCover} spineColor={spineColor} dimmed locked="premium" />
                      </Link>
                    ) : (
                      <BookBody story={story} isCurrent={isCurrent} hasCover={hasCover} spineColor={spineColor} dimmed locked="sequence" />
                    )}
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ═══ PAGINATION ═══ */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <motion.button whileTap={m.buttonPress}
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="w-10 h-10 rounded-full bg-[var(--ds-surface-card)] border border-ds-border flex items-center justify-center text-[var(--ds-text-tertiary)] disabled:opacity-20 hover:border-[var(--ds-border-brand)] hover:text-ds-brand transition">
              <ChevronLeft size={18} />
            </motion.button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <motion.button key={i} whileTap={m.buttonPress}
                onClick={() => setPage(i + 1)}
                className={`w-10 h-10 rounded-full font-baloo font-black text-sm transition ${
                  page === i + 1
                    ? "bg-ds-action text-white shadow-md scale-110"
                    : "bg-[var(--ds-surface-card)] border border-ds-border text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] hover:border-[var(--ds-border-brand)]"
                }`}>
                {i + 1}
              </motion.button>
            ))}
            <motion.button whileTap={m.buttonPress}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="w-10 h-10 rounded-full bg-[var(--ds-surface-card)] border border-ds-border flex items-center justify-center text-[var(--ds-text-tertiary)] disabled:opacity-20 hover:border-[var(--ds-border-brand)] hover:text-ds-brand transition">
              <ChevronRight size={18} />
            </motion.button>
          </div>
        )}

      </main>

      {/* Stats sidebar — desktop only */}
      <aside className="hidden xl:block xl:w-[280px] xl:shrink-0 sticky top-[80px]">
        <StatsSidebar
          weekStreak={weekStreak}
          streakCount={streakCount}
          badges={badges}
          badgeImageMap={badgeImageMap}
          todayStars={totalStars}
          activitiesCompleted={missionsCompleted}
        />
      </aside>

      </div>
      </PageSurface>
    </AppShell>
  );
}
