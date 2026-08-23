"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Lock, Loader2, Play, Star, Volume2 } from "lucide-react";
import { useThemeMotion } from "@/hooks/useThemeMotion";
import { DURATION, EASE, SPRING } from "@/lib/design-system/motion";
import AppShell from "@/components/layout/AppShell";
import { Bone } from "@/components/ui/Bone";
import { useLanguage } from "@/contexts/LanguageContext";
import { getChildren, getStorageUrl, getConsecutiveStreak, awardMilestoneBadges, awardBadge, getBadgeImages, createNotification, getStoryPages } from "@/lib/queries";
import { getMilestoneBadgeMeta } from "@/lib/milestoneBadges";

// Strip language suffix from story badge slugs for display (emotion-detective-en → Emotion Detective)
function badgeDisplayName(slug: string): string {
  const parts = slug.split("-");
  const last = parts[parts.length - 1];
  const core = ["en", "fr", "rw"].includes(last) ? parts.slice(0, -1).join("-") : slug;
  return core.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
import { getStoryBySlug, getStoryDetails, getStorySlots, getStoryLibrary } from "@/lib/storyRepository";
import type { StoryLibraryItem } from "@/lib/story-types";
import { getStoryIntroProgress, markIntroItemConsumed } from "@/lib/storyProgressRepository";
import { getWeeklyChallenges, completeWeeklyChallenge } from "@/lib/weeklyChallengeRepository";
import { getStoryCertificate } from "@/lib/storyCertificateRepository";
import type { StoryDetails, StorySlot, StoryIntroProgress, StoryCertificate, WeeklyChallenge } from "@/lib/story-types";
import supabase from "@/lib/supabaseClient";
import { qinvalidate, lsinvalidate } from "@/lib/queryCache";
import PricingPaymentModal from "@/components/pricing/PricingPaymentModal";
import { getProducts } from "@/lib/payments/products";
import type { Product, Currency } from "@/lib/payments/types";
import ChampionChallengeCard from "@/components/challenges/ChampionChallengeCard";
import PreviewBanner from "@/components/admin/story-readiness/PreviewBanner";
import CelebrationModal from "@/components/challenges/CelebrationModal";
import ShareAchievementFlow from "@/components/community/ShareAchievementFlow";
import StoryVideoPlayer from "@/components/media/StoryVideoPlayer";
import StoryAudioPlayer from "@/components/media/StoryAudioPlayer";
import { playTap, playSuccess, playCelebration, playUnlock, playStar } from "@/lib/sounds";
import { generateCertificateDataUrl, generateCertificateImageUrl } from "@/lib/certificateImage";
import { useAppTheme } from "@/contexts/AppThemeProvider";
import { getThemeAssets } from "@/lib/design-system/assetRegistry";
import { getComponentVariant } from "@/lib/design-system/componentVariants";
import { PageSurface } from "@/components/layout/primitives";
import MeetCharactersCard from "@/components/stories/MeetCharactersCard";
import BadgeCircle from "@/components/stories/BadgeCircle";

const ACTIVE_CHILD_KEY = "nimipiko_active_child";

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];
const toRoman = (n: number) => ROMAN[n - 1] ?? String(n);

// Star field — precomputed at module scope so no objects are recreated on re-render
// and Framer Motion can cache the animation configs across mounts.
const STARS = [
  [12,8],[88,5],[34,14],[67,9],[22,20],[78,17],[50,6],[5,30],[95,25],
  [40,35],[71,28],[15,42],[83,38],[58,48],[28,55],[90,50],[10,62],
  [75,66],[45,72],[62,80],[30,76],[86,84],[18,90],[55,88],[38,95],
].map(([x, y], i) => ({
  x, y,
  size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
  peakOpacity: i % 4 === 0 ? 0.8 : 0.45,
  duration: 2 + i * 0.4,
  delay: i * 0.18,
}));

/* ─────────────────────────────────────────────────────────────
   Certificate modal — personalized admin template with name
───────────────────────────────────────────────────────────── */
function CertificateModal({
  childName,
  language,
  storyTitle,
  onClose,
}: {
  childName: string;
  language: string;
  storyTitle: string;
  onClose: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateCertificateDataUrl(childName, language).then(url => {
      setDataUrl(url);
      setLoading(false);
    });
  }, [childName, language]);

  return (
    <div
      className="fixed inset-0 z-fullscreen flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm bg-[var(--ds-surface-card)] leaf-lg overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.4)] border-[3px] border-amber-300"
      >
        {/* Gold header bar */}
        <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 px-5 py-3 flex items-center justify-between">
          <p className="font-baloo font-black text-amber-900 text-mbase tracking-wide">
            🎓 Story Certificate
          </p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-amber-900/15 hover:bg-amber-900/30 flex items-center justify-center transition text-amber-900 font-black text-base leading-none"
          >
            ×
          </button>
        </div>

        {/* Certificate image area */}
        <div className="bg-amber-50 flex items-center justify-center min-h-[300px] p-2">
          {loading ? (
            <div className="w-full aspect-[3/4] animate-pulse rounded-2xl bg-gradient-to-b from-amber-100 to-yellow-100 flex items-center justify-center">
              <span className="text-5xl animate-bounce">🏆</span>
            </div>
          ) : dataUrl ? (
            <img
              src={dataUrl}
              alt={`${childName}'s certificate`}
              className="w-full rounded-2xl object-contain shadow-md"
            />
          ) : (
            /* No admin template configured — show a polished fallback */
            <div className="w-full aspect-[3/4] rounded-2xl flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-amber-50 to-yellow-100 border-2 border-amber-200 px-6">
              <span className="text-7xl">🏆</span>
              <div className="text-center">
                <p className="font-baloo font-black text-amber-800 text-1.5xl leading-tight">
                  {childName}
                </p>
                <p className="font-nunito text-amber-600 text-sml mt-1 font-semibold">
                  has mastered
                </p>
                <p className="font-baloo font-black text-amber-800 text-mlg mt-0.5 leading-snug">
                  {storyTitle}
                </p>
              </div>
              <div className="flex gap-1 mt-1">
                {["⭐","⭐","⭐"].map((s, i) => <span key={i} className="text-2xl">{s}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-[var(--ds-surface-card)] px-4 py-3 flex gap-2 border-t border-amber-100">
          <button
            onClick={() => {
              if (!dataUrl) return;
              const win = window.open("", "_blank", "width=900,height=1200");
              if (!win) return;
              win.document.write(
                `<!DOCTYPE html><html><head><title>Story Certificate</title>` +
                `<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#fff}` +
                `img{width:100%;height:auto;display:block}</style></head>` +
                `<body><img src="${dataUrl}" onload="window.focus();window.print();window.close()"/></body></html>`
              );
              win.document.close();
            }}
            disabled={!dataUrl}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-baloo font-black text-sm py-2.5 rounded-2xl transition disabled:opacity-40"
          >
            🖨️ Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--ds-brand-primary)] to-[var(--ds-brand-hover)] text-[var(--ds-nav-bg)] font-baloo font-black text-sm py-2.5 rounded-2xl shadow-sm transition"
          >
            ✅ Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Steps 2–4 of the boss's learning journey (Cover is step 1, shown on welcome screen)
const INTRO_ITEMS = [
  { key: "intro_video",     emoji: "🎬", tKey: "introVideoLabel",  actionKey: "storyIntroWatch"  },
  { key: "theme_song",      emoji: "🎵", tKey: "themeSongLabel",   actionKey: "storyIntroListen" },
  { key: "meet_characters", emoji: "🤝", tKey: "meetCharLabel",    actionKey: "storyIntroMeet"   },
];

const MISSION_META: Record<string, { emoji: string; tKey: string; actionKey: string }> = {
  flipflop_audio: { emoji: "📚", tKey: "flipflopAudioLabel", actionKey: "storyMissionOpenBook"    },
  story_pdf:      { emoji: "📖", tKey: "storyPdfLabel",      actionKey: "storyMissionReadStory"   },
  coloring:       { emoji: "🎨", tKey: "coloringLabel",      actionKey: "storyMissionStartColoring" },
  move_explore:   { emoji: "🤸", tKey: "moveExploreLabel",   actionKey: "storyMissionLetsMove"    },
  sing_along:     { emoji: "🎤", tKey: "singAlongLabel",     actionKey: "storyMissionSingAlong"   },
  bonus_video:    { emoji: "🎬", tKey: "bonusVideoLabel",    actionKey: "storyMissionWatchVideo"  },
};

const SLOT_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  flipflop_audio: { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200"  },
  story_pdf:      { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200"  },
  coloring:       { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  move_explore:   { bg: "bg-pink-50",   text: "text-pink-700",   border: "border-pink-200"   },
  sing_along:     { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  bonus_video:    { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
};

type Phase = "welcome" | "intro" | "missions" | "certificate" | "challenge" | "complete";


export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { t, language } = useLanguage();
  const { themeId, theme } = useAppTheme();
  const assets = getThemeAssets(themeId);
  const v = getComponentVariant(themeId);
  const m = useThemeMotion();

  const [loading, setLoading] = useState(true);
  const [childId, setChildId] = useState<string | null>(null);
  const [childName, setChildName] = useState("");
  const [storyId, setStoryId] = useState<string | null>(null);
  const [details, setDetails] = useState<StoryDetails | null>(null);
  const [slots, setSlots] = useState<StorySlot[]>([]);
  const [introProgress, setIntroProgress] = useState<StoryIntroProgress[]>([]);
  const [certificate, setCertificate] = useState<StoryCertificate | null>(null);
  const [challengeDone, setChallengeDone] = useState(false);
  const [weeklyChallenge, setWeeklyChallenge] = useState<WeeklyChallenge | null>(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeIntro, setActiveIntro] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [treasureAnimating, setTreasureAnimating] = useState(false);
  const [earnedBadgeSlug, setEarnedBadgeSlug] = useState<string | null>(null);
  const [earnedBadgeImageUrl, setEarnedBadgeImageUrl] = useState<string | null>(null);
  const [nextStory, setNextStory] = useState<StoryLibraryItem | null>(null);
  const [streak, setStreak] = useState(0);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [premiumLocked, setPremiumLocked] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingCurrency, setPricingCurrency] = useState<Currency>("USD");
  const [clubProduct, setClubProduct] = useState<Product | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [storyIsFree, setStoryIsFree] = useState(false);
  const [sharingCert, setSharingCert] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState<"pdf" | "png" | null>(null);
  // Guard: prevent badge award effect from firing more than once per mount
  const badgeAwardedRef = useRef(false);

  const handleShare = async () => {
    setSharingCert(true);
    // Safety net: never stay stuck longer than 20 s
    const safety = setTimeout(() => setSharingCert(false), 20_000);
    try {
      const storyUrl = window.location.href;

      // 1. Try native file share (Android Chrome / iOS Safari)
      const dataUrl = await generateCertificateDataUrl(childName, language).catch(() => null);
      if (dataUrl) {
        const blob = await fetch(dataUrl).then(r => r.blob());
        const file = new File([blob], `${childName}-certificate.jpg`, { type: "image/jpeg" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text: `🎉 ${childName} just completed "${storyTitle}" on NIMI!\n🔗 ${storyUrl}` });
          return;
        }
      }

      // 2. Upload cert → public URL → WhatsApp message with image link
      const certPublicUrl = await generateCertificateImageUrl(childName, language, childId ?? undefined, slug).catch(() => null);
      const message = certPublicUrl
        ? `🎉 ${childName} just completed "${storyTitle}" on NIMI! 🎓\n\n📜 View certificate:\n${certPublicUrl}\n\n🔗 Start learning:\n${storyUrl}`
        : `🎉 ${childName} just completed "${storyTitle}" on NIMI! 🎓\n\n🔗 ${storyUrl}`;

      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    } catch {
      const message = `🎉 ${childName} just completed "${storyTitle}" on NIMI! 🎓\n\n🔗 ${window.location.href}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    } finally {
      clearTimeout(safety);
      setSharingCert(false);
    }
  };

  const downloadCert = async (format: "pdf" | "png") => {
    setDownloadingCert(format);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const params = new URLSearchParams({
        child: childName,
        story: storyTitle,
        stars: String(totalStars),
        lang: language,
        format,
        ...(storyId ? { storyId } : {}),
      });
      const res = await fetch(`/api/certificate?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${childName.replace(/\s+/g, "_")}_certificate.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingCert(null);
    }
  };

  useEffect(() => {
    void (async () => {
      const [{ data: { user } }, list, story] = await Promise.all([
        supabase.auth.getUser(),
        getChildren(),
        getStoryBySlug(slug),
      ]);
      setParentId(user?.id ?? null);
      if (user?.id) {
        supabase
          .from("nimipiko_subscriptions")
          .select("id")
          .eq("parent_id", user.id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle()
          .then(({ data }) => setHasSubscription(!!data));
      }
      if (!story) { setLoading(false); return; }
      const savedId = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_CHILD_KEY) : null;
      const child = list.find(c => c.id === savedId) ?? list[0];
      if (!child) { setLoading(false); return; }
      setChildId(child.id);
      setChildName(child.name);
      getConsecutiveStreak(child.id, child.language as "en" | "fr" | "rw").then(setStreak);
      setStoryId(story.id);
      const [det, sl, intro, cert] = await Promise.all([
        getStoryDetails(story.id, child.language),
        getStorySlots(child.id, story.id, child.language),
        getStoryIntroProgress(child.id, story.id, child.language),
        getStoryCertificate(child.id, story.id, child.language),
      ]);
      setDetails(det);
      setSlots(sl);
      setIntroProgress(intro);
      setCertificate(cert);

      // Prefetch story pages in background so the flipflop_audio slot opens instantly
      void getStoryPages(story.id, child.language as "en" | "fr" | "rw");

      // Auto-detect phase based on progress
      const doneSlots = sl.filter(s => s.completed).length;
      const allIntrosDone = INTRO_ITEMS.every(item => intro.find(p => p.slot_key === item.key)?.consumed);
      const allMissionsDone = doneSlots >= sl.length && sl.length > 0;

      // Always open the book first; certificate/complete are the only auto-exceptions
      if (allMissionsDone && cert) setPhase("complete");
      else if (allMissionsDone) setPhase("certificate");
      else setPhase("welcome");

      setLoading(false);
    })();
  }, [slug, language]);

  // Refetch slots + certificate when the tab becomes visible again —
  // catches the case where a child completes a mission and navigates back.
  const refreshSlots = useCallback(async () => {
    if (!childId || !storyId) return;
    const [sl, cert] = await Promise.all([
      getStorySlots(childId, storyId, language),
      getStoryCertificate(childId, storyId, language),
    ]);
    setSlots(sl);
    setCertificate(cert);
    const allDone = sl.filter(s => s.completed).length >= sl.length && sl.length > 0;
    if (allDone && cert) setPhase("complete");
    else if (allDone)    setPhase("certificate");
  }, [childId, storyId, language]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshSlots();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshSlots]);

  // Fetch weekly challenge when entering the challenge phase
  useEffect(() => {
    if (phase !== "challenge" || !childId || !storyId || weeklyChallenge || challengeLoading) return;
    setChallengeLoading(true);
    void (async () => {
      const challenges = await getWeeklyChallenges(childId, storyId, language);
      const first = challenges[0] ?? null;
      setWeeklyChallenge(first);
      if (first?.completed) setChallengeDone(true);
      setChallengeLoading(false);
    })();
  }, [phase, childId, storyId, language, weeklyChallenge, challengeLoading]);

  const handleChallengeDidIt = async () => {
    if (!childId || !weeklyChallenge) {
      setShowCelebration(true);
      return;
    }
    const res = await completeWeeklyChallenge(childId, weeklyChallenge.challenge_id);
    if (!res) return;
    // Bust all star-related caches — complete_weekly_challenge writes to
    // challenge_bonus_stars, which feeds totalStars and bonusStars queries.
    // bonusStars is lscached so needs both layers cleared.
    qinvalidate(`bonusStars:${childId}`);
    lsinvalidate(`bonusStars:${childId}`);
    qinvalidate(`totalStars:${childId}`);
    qinvalidate(`claimedChallenges:${childId}`);
    setChallengeDone(true);
    setShowCelebration(true);
  };

  const handleIntroClick = async (key: string) => {
    if (!childId || !storyId || !details) return;
    const urlKey = `${key}_url` as keyof StoryDetails;
    const hasMedia = !!(details[urlKey] as string | null);
    // meet_characters always opens — shows a built-in character card when no video is uploaded
    if (!hasMedia && key !== "meet_characters") return;
    setActiveIntro(activeIntro === key ? null : key);
    await markIntroItemConsumed(childId, storyId, key);
    setIntroProgress(prev => prev.map(p => p.slot_key === key ? { ...p, consumed: true } : p));
  };

  // Load existing feeling when certificate phase is entered
  useEffect(() => {
    if (phase !== "certificate" || !childId || !storyId) return;
    supabase
      .from("story_feelings")
      .select("feeling")
      .eq("child_id", childId)
      .eq("story_id", storyId)
      .eq("language", language)
      .maybeSingle()
      .then(({ data }) => { if (data?.feeling) setFeeling(data.feeling); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, childId, storyId]);

  const handleFeelingSelect = async (emoji: string) => {
    setFeeling(emoji);
    if (!childId || !storyId) return;
    await supabase.from("story_feelings").upsert(
      { child_id: childId, story_id: storyId, language, feeling: emoji, felt_at: new Date().toISOString() },
      { onConflict: "child_id,story_id,language" }
    );
  };

  // On certificate phase: award story badge + milestone badges, show badge with image.
  // Guard with a ref so navigating back and re-entering certificate never double-awards.
  useEffect(() => {
    if (phase !== "certificate" || !childId || badgeAwardedRef.current) return;
    badgeAwardedRef.current = true;
    void (async () => {
      const storyBadgeSlug = `${slug}-${language}`;

      // Award story badge, milestone badges, and fetch images in parallel
      const [newMilestoneSlugs, imageMap] = await Promise.all([
        awardBadge(childId, language, storyBadgeSlug)
          .then(() => awardMilestoneBadges(childId, language)),
        getBadgeImages(),
      ]);

      setEarnedBadgeSlug(storyBadgeSlug);
      setEarnedBadgeImageUrl(imageMap[storyBadgeSlug] ?? null);

      // Notify parent for each milestone in parallel
      if (newMilestoneSlugs.length > 0 && parentId) {
        await Promise.all(newMilestoneSlugs.map(mSlug => {
          const meta = getMilestoneBadgeMeta(mSlug);
          return createNotification(parentId, {
            title: `${meta?.emoji ?? "🏅"} Badge Earned!`,
            body: meta ? `${childName} earned "${meta.label}" — ${meta.desc}` : `${childName} earned a new badge!`,
            type: "achievement",
            url: "/user-profile",
          });
        }));
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, childId]);

  // Detect premium lock for this story
  useEffect(() => {
    if (!childId || !storyId) return;
    void (async () => {
      const library = await getStoryLibrary(childId, language);
      const entry = library.find(s => s.sid === storyId);
      if (entry?.is_free) setStoryIsFree(true);
      if (entry && !entry.is_free && !entry.unlocked) setPremiumLocked(true);
    })();
  }, [childId, storyId, language]);

  // Prefetch geo + club product when paywall is hit
  useEffect(() => {
    if (!premiumLocked) return;
    void (async () => {
      const [geo, products] = await Promise.all([
        fetch("/api/geo").then(r => r.json()).catch(() => ({ currency: "USD" })),
        getProducts(),
      ]);
      setPricingCurrency(geo.currency === "RWF" ? "RWF" : "USD");
      const monthly = products.find((p: Product) => p.slug === "nimipiko-club");
      if (monthly) setClubProduct(monthly);
    })();
  }, [premiumLocked]);

  // Fetch next story in sequence for the complete phase
  useEffect(() => {
    if (phase !== "complete" || !childId || !details) return;
    void (async () => {
      const library = await getStoryLibrary(childId, language);
      const currentIdx = library.findIndex(s => s.sid === storyId);
      setNextStory(library[currentIdx + 1] ?? null);
    })();
  }, [phase, childId, storyId, details, language]);

  // Auto-open certificate modal 1.5 s after the completion screen appears.
  // Only fires once per child+story — a localStorage flag suppresses re-opens
  // on subsequent visits so a returning child isn't interrupted every time.
  useEffect(() => {
    if (phase !== "complete" || !childId || !slug) return;
    const shownKey = `nimipiko_cert_shown:${childId}:${slug}`;
    if (typeof window !== "undefined" && localStorage.getItem(shownKey)) return;
    const t = setTimeout(() => {
      if (typeof window !== "undefined") localStorage.setItem(shownKey, "1");
      setShowCertModal(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [phase, childId, slug]);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto w-full px-4 py-6 pb-24 space-y-4">
          <Bone className="h-8 w-48" />
          <Bone className="leaf-lg" style={{ height: 300 }} />
          <Bone className="h-24 leaf-lg" />
          <Bone className="h-12 leaf-lg" />
        </div>
      </AppShell>
    );
  }

  if (premiumLocked) {
    return (
      <AppShell>
        <PageSurface>
          <main className="max-w-lg mx-auto w-full min-h-screen flex flex-col items-center justify-center px-5 py-12 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-5xl shadow-2xl shadow-purple-400/30 mb-6 mx-auto">
                👑
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h1 className="font-baloo font-black text-ds-text text-3.5xl leading-tight mb-2">
                {t("premiumStoryTitle")}
              </h1>
              <p className="font-nunito text-[var(--ds-text-secondary)] text-mbase leading-relaxed mb-8 max-w-xs mx-auto">
                {t("premiumStoryDesc")}
              </p>
              <div className="space-y-3">
                {clubProduct ? (
                  <motion.button
                    whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}
                    onClick={() => setShowPricingModal(true)}
                    className="w-full font-baloo font-black text-white text-mlg bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl px-6 py-4 shadow-lg shadow-purple-400/25"
                  >
                    🔓 {t("unlockWithClub")}
                  </motion.button>
                ) : (
                  <Link href="/parents">
                    <motion.button
                      whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}
                      className="w-full font-baloo font-black text-white text-mlg bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl px-6 py-4 shadow-lg shadow-purple-400/25"
                    >
                      🔓 {t("unlockWithClub")}
                    </motion.button>
                  </Link>
                )}
                <button onClick={() => router.back()}
                  className="w-full font-baloo font-black text-[var(--ds-text-tertiary)] text-mbase py-2">
                  ← {t("goBack")}
                </button>
              </div>
            </motion.div>
          </main>
        </PageSurface>

        <AnimatePresence>
          {showPricingModal && clubProduct && (
            <PricingPaymentModal
              product={clubProduct}
              currency={pricingCurrency}
              successRedirectUrl={typeof window !== "undefined" ? window.location.href : undefined}
              onClose={() => setShowPricingModal(false)}
            />
          )}
        </AnimatePresence>
      </AppShell>
    );
  }

  const doneCount = slots.filter(s => s.completed).length;
  const totalCount = slots.length || 6;
  const totalStars = slots.reduce((s, sl) => s + (sl.completed ? (sl.stars ?? 10) : 0), 0);
  const storyTitle = details?.title ?? slug;
  const isPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "true";
  const allIntrosDone = INTRO_ITEMS.every(item => introProgress.find(p => p.slot_key === item.key)?.consumed);
  const nextMission = slots.find((s, i) => !s.completed && (i === 0 || slots[i - 1]?.completed));

  return (
    <AppShell>
      <PreviewBanner />
      <PageSurface className={isPreview ? "pt-10" : ""}>
        <main className="max-w-3xl mx-auto w-full min-h-screen flex flex-col">

          <AnimatePresence mode="wait">

            {/* ═══════════════════════════════════════════ */}
            {/* PHASE 1: LIVE BOOK                        */}
            {/* ═══════════════════════════════════════════ */}
            {phase === "welcome" && (
              <motion.div key="welcome"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex flex-col relative"
                style={{ background: "linear-gradient(160deg, #04111f 0%, #091829 45%, #100e24 100%)" }}>

                {/* ── Star field (configs precomputed at module scope) ── */}
                {STARS.map((s, i) => (
                  <motion.div key={i} className="absolute rounded-full pointer-events-none select-none"
                    style={{ left:`${s.x}%`, top:`${s.y}%`, width:s.size, height:s.size, background:"#fff" }}
                    animate={{ opacity:[0.15, s.peakOpacity, 0.15] }}
                    transition={{ duration:s.duration, repeat:Infinity, delay:s.delay, ease:"easeInOut" }} />
                ))}

                {/* ── Top nav ── */}
                <div className="relative z-10 flex items-center justify-between px-4 pt-5 pb-1">
                  <button onClick={() => router.push("/stories")}
                    className="flex items-center gap-1.5 text-white/40 hover:text-white/70 font-nunito font-bold text-sm transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Library
                  </button>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 rounded-full px-3 py-1 border border-orange-400/25"
                      style={{ background:"rgba(251,146,60,0.12)" }}>
                      <motion.span animate={{ scale:[1,1.25,1] }} transition={{ duration:1.4, repeat:Infinity }}>🔥</motion.span>
                      <span className="font-baloo font-black text-orange-300 text-xs">{streak} day streak</span>
                    </div>
                  )}
                </div>

                {/* ── Collection eyebrow ── */}
                <motion.p initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}
                  className="relative z-10 text-center font-nunito text-xs tracking-[0.28em] uppercase mb-2 mt-1"
                  style={{ color:"rgba(201,168,76,0.5)" }}>
                  Nimipiko · Story Collection
                </motion.p>

                {/* ── Book + CTA ── */}
                <div className="relative z-10 flex-1 px-3 sm:px-5 pb-4">

                  {/* Gold ambient glow beneath book */}
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-2/3 h-20 pointer-events-none"
                    style={{ background:"radial-gradient(ellipse, rgba(201,168,76,0.22) 0%, transparent 70%)", filter:"blur(16px)" }} />

                  {/* Perspective wrapper */}
                  <div style={{ perspective:"1400px" }}>
                    <motion.div
                      initial={{ rotateY:28, opacity:0, y:18 }}
                      animate={{ rotateY:0, opacity:1, y:0 }}
                      transition={{ type:"spring", stiffness:130, damping:20, delay:0.1 }}
                      className="relative flex flex-col md:flex-row w-full rounded-2xl overflow-hidden"
                      style={{
                        transformOrigin:"left center",
                        minHeight:520,
                        boxShadow:"0 0 0 1px rgba(201,168,76,0.28), 0 0 48px rgba(201,168,76,0.14), 0 24px 64px rgba(0,0,0,0.75)",
                      }}>

                      {/* ══ LEFT PAGE ══ */}
                      <div className="md:w-[40%] shrink-0 flex flex-col relative overflow-hidden" style={{ background:"#150d05" }}>

                        {/* Cover image — fixed on mobile, 54% of parent on desktop */}
                        <div className="relative overflow-hidden shrink-0 h-[200px] md:h-[54%]">
                          {details?.cover_url ? (
                            <Image src={getStorageUrl(details.cover_url)} alt={storyTitle} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"
                              style={{ background:"linear-gradient(135deg, #7c3a0a, #b45309)" }}>
                              <motion.span className="text-7xl drop-shadow-xl"
                                animate={{ scale:[1,1.08,1] }} transition={{ duration:DURATION.loopBase, repeat:Infinity }}>
                                {details?.theme_emoji ?? "📚"}
                              </motion.span>
                            </div>
                          )}
                          {/* Gold-tinted fade into page */}
                          <div className="absolute inset-0 pointer-events-none"
                            style={{ background:"linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 38%, #150d05 100%)" }} />
                          {/* Gold top edge */}
                          <div className="absolute inset-x-0 top-0 h-[2px] pointer-events-none"
                            style={{ background:"linear-gradient(to right, transparent, #c9a84c80, transparent)" }} />
                          {/* Linen texture */}
                          <div className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
                            style={{ backgroundImage:[
                              "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,1) 3px,rgba(255,255,255,1) 4px)",
                              "repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(255,255,255,1) 3px,rgba(255,255,255,1) 4px)",
                            ].join(",") }} />
                        </div>

                        {/* Story info */}
                        <div className="flex-1 flex flex-col px-5 pb-4 pt-1 relative z-10">
                          {/* Gold ornamental divider */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 h-px" style={{ background:"linear-gradient(to right, transparent, rgba(201,168,76,0.4))" }} />
                            <span className="text-xs select-none" style={{ color:"rgba(201,168,76,0.6)" }}>✦</span>
                            <div className="flex-1 h-px" style={{ background:"linear-gradient(to left, transparent, rgba(201,168,76,0.4))" }} />
                          </div>

                          {/* Title */}
                          <h1 className="font-baloo font-black leading-tight text-center mb-0.5"
                            style={{ fontSize:"clamp(1rem,2.8vw,1.4rem)", color:"#f5e6c8" }}>
                            {storyTitle}
                          </h1>
                          <p className="text-center font-nunito text-2xs tracking-[0.2em] uppercase mb-3"
                            style={{ color:"rgba(201,168,76,0.45)" }}>
                            {childName} · {language.toUpperCase()}
                          </p>

                          {/* Progress bar */}
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-nunito text-2xs" style={{ color:"rgba(201,168,76,0.45)" }}>Progress</span>
                              <span className="font-nunito font-bold text-2xs" style={{ color:"rgba(201,168,76,0.45)" }}>{doneCount}/{totalCount}</span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.08)" }}>
                              <motion.div className="h-full rounded-full"
                                style={{ background:"linear-gradient(to right, #c9a84c, #f0d080)" }}
                                initial={{ width:0 }}
                                animate={{ width: totalCount > 0 ? `${(doneCount/totalCount)*100}%` : "0%" }}
                                transition={{ duration:1, delay:0.45, ease:"easeOut" }} />
                            </div>
                          </div>

                          {/* Nimi quote */}
                          <div className="mt-auto flex items-end gap-2">
                            <motion.img src={assets.nimiCircle} alt="Nimi"
                              animate={{ y:[0,-4,0] }} transition={{ duration:3, repeat:Infinity }}
                              className="w-10 h-10 rounded-full shrink-0 border-2"
                              style={{ borderColor:"rgba(201,168,76,0.45)", boxShadow:"0 0 12px rgba(201,168,76,0.2)" }} />
                            <div className="flex-1 rounded-2xl rounded-bl-none px-3 py-2"
                              style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(201,168,76,0.18)" }}>
                              <p className="font-nunito text-xs leading-snug italic" style={{ color:"rgba(245,230,200,0.65)" }}>
                                &ldquo;{doneCount === 0
                                  ? `${childName}, your adventure awaits!`
                                  : doneCount < totalCount
                                  ? `Amazing, ${childName}! Keep going!`
                                  : `You've mastered it, ${childName}! 🏆`}&rdquo;
                              </p>
                            </div>
                          </div>

                          {/* Certificate button if mastered */}
                          {doneCount >= totalCount && totalCount > 0 && (
                            <motion.button
                              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
                              whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}
                              onClick={() => { playCelebration(); setPhase("certificate"); }}
                              className="mt-3 w-full font-baloo font-black text-sm py-2.5 rounded-xl flex items-center justify-center gap-2"
                              style={{ background:"linear-gradient(135deg, #c9a84c, #f0d080)", color:"#0a0603", boxShadow:"0 4px 20px rgba(201,168,76,0.35)" }}>
                              🌟 {t("storySeeCertificate")}
                            </motion.button>
                          )}
                        </div>

                        {/* Ruled lines */}
                        {Array.from({ length:5 }).map((_,i) => (
                          <div key={i} className="absolute inset-x-0 h-px pointer-events-none"
                            style={{ bottom:`${10+i*8}%`, background:"rgba(201,168,76,0.05)" }} />
                        ))}
                      </div>

                      {/* ══ SPINE ══ */}
                      <div className="hidden md:flex w-7 shrink-0 flex-col items-center justify-between py-5 relative overflow-hidden"
                        style={{ background:"linear-gradient(to right, #07040200, #130a03, #07040200)" }}>
                        <div className="w-full h-px" style={{ background:"rgba(201,168,76,0.35)" }} />
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-px h-10" style={{ background:"rgba(201,168,76,0.15)" }} />
                          <span className="font-black text-[5px] tracking-[0.9em] uppercase select-none"
                            style={{ writingMode:"vertical-rl", color:"rgba(201,168,76,0.4)" }}>NIMIPIKO</span>
                          <div className="w-px h-10" style={{ background:"rgba(201,168,76,0.15)" }} />
                        </div>
                        <div className="w-full h-px" style={{ background:"rgba(201,168,76,0.35)" }} />
                      </div>
                      {/* Mobile spine */}
                      <div className="md:hidden h-5 shrink-0 flex items-center"
                        style={{ background:"linear-gradient(to bottom, #07040200, #130a03, #07040200)" }}>
                        <div className="flex-1 h-px mx-6" style={{ background:"rgba(201,168,76,0.35)" }} />
                      </div>

                      {/* ══ RIGHT PAGE ══ */}
                      <div className="flex-1 flex flex-col relative overflow-hidden" style={{ background:"#f5f0e5" }}>

                        {/* Binding shadow */}
                        <div className="absolute inset-y-0 left-0 w-4 pointer-events-none z-10"
                          style={{ background:"linear-gradient(to right, rgba(0,0,0,0.07), transparent)" }} />

                        {/* Header */}
                        <div className="px-5 pt-5 pb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-px" style={{ background:"rgba(120,80,20,0.15)" }} />
                            <span className="font-nunito text-2xs tracking-[0.22em] uppercase" style={{ color:"rgba(120,80,20,0.4)" }}>Your Adventure</span>
                            <div className="flex-1 h-px" style={{ background:"rgba(120,80,20,0.15)" }} />
                          </div>
                          <h2 className="font-baloo font-black text-base text-center leading-none" style={{ color:"#2d1a06" }}>
                            Mission Chapters
                          </h2>
                        </div>

                        {/* Preface — intro not done yet */}
                        {!allIntrosDone && (
                          <div className="px-4 pb-2">
                            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                              onClick={() => { playTap(); setPhase("intro"); }}
                              className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl cursor-pointer"
                              style={{ background:"linear-gradient(135deg, #1a3558, #06101f)", border:"1.5px solid rgba(201,168,76,0.35)" }}>
                              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                style={{ background:"rgba(201,168,76,0.18)" }}>
                                <Play className="w-3 h-3 fill-current ml-0.5" style={{ color:"#c9a84c" }} />
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-nunito font-bold text-white text-sm">Meet the Characters</p>
                                <p className="font-nunito text-2xs" style={{ color:"rgba(255,255,255,0.45)" }}>Watch before starting</p>
                              </div>
                              <span className="font-baloo font-black text-2xs uppercase tracking-wide" style={{ color:"#c9a84c" }}>Begin →</span>
                            </motion.button>
                          </div>
                        )}

                        {/* ─── Chapter list OR The End ─── */}
                        {doneCount >= totalCount && totalCount > 0 ? (

                          /* THE END */
                          <div className="flex-1 flex flex-col items-center justify-center px-5 pb-4">
                            <motion.div
                              initial={{ scale:0, rotate:-15 }} animate={{ scale:1, rotate:0 }}
                              transition={{ type:"spring", stiffness:220, damping:16, delay:0.2 }}
                              className="relative w-20 h-20 rounded-full flex items-center justify-center mb-4"
                              style={{ background:"radial-gradient(circle at 35% 35%, #fef9c3, #fde68a 60%, #f59e0b)" }}>
                              <span className="text-3xl">🏆</span>
                              <div className="absolute inset-0 rounded-full border-4" style={{ borderColor:"rgba(245,158,11,0.4)" }} />
                            </motion.div>
                            <div className="flex items-center gap-3 w-full mb-2">
                              <div className="flex-1 h-px" style={{ background:"rgba(120,80,20,0.15)" }} />
                              <span className="text-xs select-none" style={{ color:"rgba(120,80,20,0.3)" }}>✦</span>
                              <div className="flex-1 h-px" style={{ background:"rgba(120,80,20,0.15)" }} />
                            </div>
                            <motion.p initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
                              className="font-baloo font-black text-2xl mb-1 tracking-wide" style={{ color:"#2d1a06" }}>
                              The End
                            </motion.p>
                            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
                              className="font-nunito text-xs text-center mb-4 leading-relaxed" style={{ color:"rgba(120,80,20,0.5)" }}>
                              All {totalCount} chapters complete!<br />
                              <span className="md:hidden">Your certificate is above ↑</span>
                              <span className="hidden md:inline">Your certificate is on the left.</span>
                            </motion.p>
                            <div className="flex items-center gap-3 w-full mb-4">
                              <div className="flex-1 h-px" style={{ background:"rgba(120,80,20,0.15)" }} />
                              <span className="text-xs select-none" style={{ color:"rgba(120,80,20,0.3)" }}>✦</span>
                              <div className="flex-1 h-px" style={{ background:"rgba(120,80,20,0.15)" }} />
                            </div>
                            <div className="w-full space-y-1.5">
                              {slots.map((slot, i) => {
                                const meta  = MISSION_META[slot.slot_key] ?? { emoji:"📌", tKey:slot.slot_key };
                                const label = slot.title || t(meta.tKey);
                                return (
                                  <motion.div key={slot.slot_key}
                                    initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }}
                                    transition={{ delay:0.55 + i * 0.04 }}
                                    className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                    <span className="font-nunito text-xs truncate flex-1" style={{ color:"rgba(120,80,20,0.6)" }}>{label}</span>
                                    {slot.stars != null && (
                                      <span className="font-nunito text-2xs font-semibold text-amber-500">⭐ {slot.stars}</span>
                                    )}
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>

                        ) : (

                          /* ── MISSION ORBS GRID ── */
                          <div className="flex-1 px-3 pb-2 pt-1 grid grid-cols-2 gap-2.5 content-start overflow-y-auto">
                            {slots.length === 0 && (
                              <div className="col-span-2 py-8 text-center">
                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" style={{ color:"rgba(201,168,76,0.4)" }} />
                                <p className="font-nunito text-xs" style={{ color:"rgba(120,80,20,0.4)" }}>Loading chapters…</p>
                              </div>
                            )}
                            {slots.map((slot, i) => {
                              const meta     = MISSION_META[slot.slot_key] ?? { emoji:"📌", tKey:slot.slot_key, actionKey:"storyMissionGo" };
                              const isNext   = !slot.completed && (i === 0 || slots[i-1]?.completed);
                              const isLocked = !slot.completed && !isNext;
                              const label    = slot.title || t(meta.tKey);

                              if (isLocked) {
                                return (
                                  <motion.div key={slot.slot_key}
                                    initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }}
                                    transition={{ delay:0.15 + i*0.06 }}
                                    className="relative flex flex-col items-center justify-center gap-1 py-4 px-2 rounded-2xl select-none"
                                    style={{ background:"rgba(0,0,0,0.04)", border:"1.5px solid rgba(0,0,0,0.07)" }}>
                                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl opacity-25"
                                      style={{ background:"rgba(0,0,0,0.06)" }}>
                                      {meta.emoji}
                                    </div>
                                    <p className="font-nunito font-semibold text-2xs text-center leading-tight" style={{ color:"rgba(45,26,6,0.28)" }}>{label}</p>
                                    <Lock className="w-3 h-3 absolute top-2 right-2" style={{ color:"rgba(45,26,6,0.2)" }} />
                                    <span className="font-mono font-black" style={{ fontSize:"8px", color:"rgba(45,26,6,0.18)" }}>{toRoman(i+1)}</span>
                                  </motion.div>
                                );
                              }

                              const orbContent = (
                                <motion.div
                                  initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }}
                                  transition={{ delay:0.15 + i*0.06 }}
                                  whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                                  className="relative flex flex-col items-center justify-center gap-1 py-4 px-2 rounded-2xl cursor-pointer"
                                  style={slot.completed ? {
                                    background:"linear-gradient(135deg, #f0fdf4, #dcfce7)",
                                    border:"1.5px solid #86efac",
                                    boxShadow:"0 2px 8px rgba(34,197,94,0.15)",
                                  } : {
                                    background:"linear-gradient(135deg, #1a3558, #06101f)",
                                    border:"1.5px solid rgba(201,168,76,0.38)",
                                    boxShadow:"0 4px 16px rgba(6,16,31,0.3), 0 0 20px rgba(201,168,76,0.07)",
                                  }}>
                                  {/* Glow pulse on next-up mission */}
                                  {isNext && (
                                    <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
                                      animate={{ opacity:[0.4,0.8,0.4] }} transition={{ duration:2, repeat:Infinity }}
                                      style={{ background:"radial-gradient(circle, rgba(201,168,76,0.12), transparent)", border:"1px solid rgba(201,168,76,0.25)" }} />
                                  )}
                                  {/* Icon orb */}
                                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                                    style={ slot.completed
                                      ? { background:"rgba(34,197,94,0.15)" }
                                      : { background:"rgba(255,255,255,0.09)", boxShadow: isNext ? "0 0 16px rgba(201,168,76,0.25)" : "none" }}>
                                    {slot.completed
                                      ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                                      : <span>{meta.emoji}</span>}
                                  </div>
                                  <p className="font-nunito font-bold text-2xs text-center leading-tight"
                                    style={{ color: slot.completed ? "#15803d" : "#f5e6c8" }}>
                                    {label}
                                  </p>
                                  {isNext && (
                                    <span className="font-baloo font-black text-2xs uppercase tracking-wide" style={{ color:"#c9a84c" }}>
                                      Start →
                                    </span>
                                  )}
                                  {slot.completed && slot.stars != null && (
                                    <span className="font-nunito text-2xs font-semibold text-amber-600">⭐ {slot.stars}</span>
                                  )}
                                  <span className="font-mono font-black opacity-35"
                                    style={{ fontSize:"8px", color: slot.completed ? "#15803d" : "#f5e6c8" }}>
                                    {toRoman(i+1)}
                                  </span>
                                </motion.div>
                              );

                              return (slot.completed || isNext) ? (
                                <Link key={slot.slot_key} href={`/stories/${slug}/mission/${slot.slot_key}`} onClick={playTap}>
                                  {orbContent}
                                </Link>
                              ) : (
                                <div key={slot.slot_key}>{orbContent}</div>
                              );
                            })}
                          </div>

                        )}

                        {/* Footer */}
                        <div className="px-5 py-2 shrink-0 flex items-center justify-between"
                          style={{ borderTop:"1px solid rgba(120,80,20,0.1)" }}>
                          <span className="text-2xs font-nunito italic" style={{ color:"rgba(120,80,20,0.3)" }}>nimipiko.com</span>
                          <span className="text-2xs font-nunito" style={{ color:"rgba(120,80,20,0.3)" }}>— {doneCount} of {totalCount} —</span>
                        </div>

                        {/* Page-edge depth strips */}
                        <div className="absolute top-2 bottom-2 -right-1.5 w-1.5 rounded-r pointer-events-none overflow-hidden hidden md:flex flex-col gap-px" style={{ zIndex:-1 }}>
                          {[["#ddd5c0"],["#e5dcc8"],["#eae2d0"]].map(([bg],i) => (
                            <div key={i} className="flex-1 rounded-r" style={{ background:bg }} />
                          ))}
                        </div>

                        {/* Bookmark ribbon */}
                        <div className="absolute top-0 right-10 z-20 hidden md:flex flex-col items-center pointer-events-none"
                          style={{ filter:"drop-shadow(-1px 3px 3px rgba(0,0,0,0.28))" }}>
                          <div className="w-6 h-20 flex items-center justify-center"
                            style={{
                              background:"linear-gradient(to right, #9f1239, #e11d48, #9f1239)",
                              clipPath:"polygon(0 0, 100% 0, 100% 82%, 50% 100%, 0 82%)",
                            }}>
                            <span className="text-white/60 font-black select-none"
                              style={{ writingMode:"vertical-rl", fontSize:"6px", letterSpacing:"0.18em" }}>
                              {doneCount >= totalCount && totalCount > 0 ? "✦" : "▶"}
                            </span>
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  </div>{/* /perspective */}

                  {/* ── CTA below book ── */}
                  {!allIntrosDone && (
                    <motion.button
                      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.55 }}
                      whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                      onClick={() => { playTap(); setPhase("intro"); }}
                      className="mt-4 w-full font-baloo font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-3"
                      style={{ background:"linear-gradient(135deg, #c9a84c, #f0d080)", color:"#06101f", boxShadow:"0 8px 32px rgba(201,168,76,0.32)" }}>
                      ✨ Begin Your Adventure
                    </motion.button>
                  )}
                  {allIntrosDone && doneCount < totalCount && (
                    <motion.button
                      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.55 }}
                      whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                      onClick={() => { playTap(); setPhase("missions"); }}
                      className="mt-4 w-full font-baloo font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-3"
                      style={{ background:"linear-gradient(135deg, #c9a84c, #f0d080)", color:"#06101f", boxShadow:"0 8px 32px rgba(201,168,76,0.32)" }}>
                      🚀 Continue Adventure
                    </motion.button>
                  )}
                </div>

                {/* ── République des Champions teaser ── */}
                <motion.div
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.8 }}
                  className="relative z-10 flex items-center justify-center gap-2 pb-6 pt-1">
                  <div className="flex items-center gap-2 rounded-full px-4 py-1.5"
                    style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(201,168,76,0.2)" }}>
                    <span className="text-sm">👑</span>
                    <span className="font-nunito text-xs tracking-wide" style={{ color:"rgba(201,168,76,0.55)" }}>République des Champions</span>
                    <span style={{ color:"rgba(201,168,76,0.35)" }}>→</span>
                  </div>
                </motion.div>

              </motion.div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* PHASE 2: INTRO JOURNEY                     */}
            {/* ═══════════════════════════════════════════ */}
            {phase === "intro" && (
              <motion.div key="intro" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                className="flex-1 flex flex-col px-5 py-6">

                <button onClick={() => setPhase("welcome")} className="self-start mb-4 text-[var(--ds-text-tertiary)] flex items-center gap-1 text-sml font-bold">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <h2 className="font-baloo font-black text-[var(--ds-brand-primary)] text-1.5xl text-center mb-2">{t("storyAdventureBegins")}</h2>

                <div className="mb-5 leaf border border-[var(--ds-border-brand)] bg-[var(--ds-brand-subtle)] p-4 shadow-sm">
                  <p className="font-baloo font-black text-base text-[var(--ds-text-primary)]">First, meet the story helpers</p>
                  <p className="text-sml text-[var(--ds-text-secondary)] mt-1">Each card opens a tiny adventure. Complete them in order and the path ahead will light up.</p>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-6">
                  {INTRO_ITEMS.map(item => {
                    const done = introProgress.find(p => p.slot_key === item.key)?.consumed ?? false;
                    return (
                      <motion.div key={item.key}
                        animate={done ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: DURATION.slow }}
                        className={`w-3 h-3 rounded-full ${done ? "bg-[var(--ds-brand-primary)]" : "bg-[var(--ds-brand-soft)]"}`} />
                    );
                  })}
                </div>

                {/* Intro cards — one per item, big and clear */}
                <div className="space-y-3 flex-1">
                  {INTRO_ITEMS.map((item, i) => {
                    const done = introProgress.find(p => p.slot_key === item.key)?.consumed ?? false;
                    const hasUrl = !!(details?.[`${item.key}_url` as keyof StoryDetails]);
                    const isActive = activeIntro === item.key;
                    const prevDone = i === 0 || (introProgress.find(p => p.slot_key === INTRO_ITEMS[i - 1].key)?.consumed ?? false);
                    const isNext = !done && prevDone;

                    return (
                      <div key={item.key}>
                        <motion.button
                          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                          whileTap={(hasUrl || item.key === "meet_characters") ? m.buttonPress : {}}
                          onClick={() => handleIntroClick(item.key)} disabled={!hasUrl && item.key !== "meet_characters"}
                          className={`w-full p-5 flex items-center gap-4 transition-all ${
                            done ? "bg-[var(--ds-brand-subtle)] border-2 border-[var(--ds-border-brand)]/40" :
                            isNext ? `bg-gradient-to-r ${v.contentGradients.storyIntro[i]} border-2 border-white/20 shadow-xl` :
                            "bg-[var(--ds-surface-card-hover)] border-2 border-ds-border opacity-40"
                          }`}
                          style={{ borderRadius: 'var(--leaf-r-lg)' }}>
                          <motion.span className="text-4xl" animate={isNext ? { rotate: [0, -10, 10, 0] } : {}}
                            transition={{ duration: DURATION.loopBase, repeat: Infinity }}>{item.emoji}</motion.span>
                          <div className="flex-1 text-left">
                            <p className={`font-baloo font-black text-mlg ${done ? "text-[var(--ds-text-primary)]" : isNext ? "text-white" : "text-[var(--ds-text-secondary)]"}`}>{t(item.tKey)}</p>
                          </div>
                          {done ? (
                            <CheckCircle2 className="w-7 h-7 text-[var(--ds-text-brand)] shrink-0" />
                          ) : isNext && (hasUrl || item.key === "meet_characters") ? (
                            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: DURATION.loopShimmer, repeat: Infinity }}
                              className="w-12 h-12 rounded-full bg-[var(--ds-surface-card)]/20 flex items-center justify-center shrink-0">
                              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                            </motion.div>
                          ) : null}
                        </motion.button>

                        {/* Inline player */}
                        {isActive && details && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 mb-1">
                            {item.key === "intro_video" && (
                              <StoryVideoPlayer url={details.intro_video_url} title={t(item.tKey)} />
                            )}
                            {item.key === "theme_song" && (
                              <StoryAudioPlayer url={details.theme_song_url} title={t("themeSongLabel")} subtitle={storyTitle} color={v.contentGradients.storyIntro[i]} />
                            )}
                            {item.key === "meet_characters" && (
                              details.meet_characters_url
                                ? <StoryVideoPlayer url={details.meet_characters_url} title={t(item.tKey)} />
                                : <MeetCharactersCard assets={assets} />
                            )}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Begin Adventure button — appears when all intros done */}
                {allIntrosDone && (
                  <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING.gentle }}
                    whileHover={m.buttonHover} whileTap={m.buttonPress}
                    onClick={() => { playUnlock(); setPhase("missions"); }}
                    className="mt-6 w-full text-white font-baloo font-black text-xl py-4 flex items-center justify-center gap-3" style={{ background: 'linear-gradient(135deg, var(--ds-brand-primary), var(--ds-brand-hover))', borderRadius: 'var(--leaf-r-lg)', boxShadow: '0 8px 24px rgba(26,168,106,0.35)' }}>
                    {t("storyBeginMyAdventure")}
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* PHASE 3: MISSION PATH                      */}
            {/* ═══════════════════════════════════════════ */}
            {phase === "missions" && (
              <motion.div key="missions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col pb-28 relative">

                {/* Tweak 5: Cover image as faded background */}
                {details?.cover_url && (
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <Image src={getStorageUrl(details.cover_url)} alt="" fill className="object-cover opacity-[0.06] blur-sm scale-110" />
                  </div>
                )}

                {/* Top bar */}
                <div className="flex items-center justify-between px-5 py-4 relative z-10">
                  <button onClick={() => setPhase("welcome")} className="w-11 h-11 bg-[var(--ds-surface-card-active)] rounded-full flex items-center justify-center text-[var(--ds-text-primary)]">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  {/* Tweak 4: Star count with bounce */}
                  <div className="flex items-center gap-2">
                    {streak > 0 && (
                      <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5">
                        <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>🔥</motion.span>
                        <span className="font-baloo font-black text-orange-600 text-sml">{streak}</span>
                      </div>
                    )}
                    <motion.div
                      initial={{ scale: 1 }} animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: DURATION.slow, delay: DURATION.base }}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 rounded-full px-4 py-2 border border-yellow-400/25 shadow-lg shadow-yellow-500/10">
                      <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: DURATION.loopBase, repeat: Infinity }}>
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                      <span className="font-baloo font-black text-yellow-600 text-base">{totalStars}</span>
                    </motion.div>
                  </div>
                </div>

                <div className="mx-5 mb-4 leaf border border-white/70 bg-[var(--ds-surface-card)]/85 p-4 shadow-card-2xl backdrop-blur relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-baloo font-black text-mbase text-ds-text">{t("storyAdventureBegins")}</p>
                      <p className="text-xs text-[var(--ds-text-secondary)] mt-0.5">{doneCount} / {totalCount} · {totalStars} ⭐</p>
                    </div>
                    {(() => {
                      const nb = nextMission ? (SLOT_BADGE[nextMission.slot_key] ?? { bg: "bg-[var(--ds-brand-subtle)]", text: "text-[var(--ds-text-brand)]", border: "border-[var(--ds-border-brand)]" }) : null;
                      const ne = nextMission ? (MISSION_META[nextMission.slot_key]?.emoji ?? "⭐") : null;
                      return (
                        <div className={`rounded-full border px-3 py-1.5 text-2xs font-black whitespace-nowrap ${
                          nb ? `${nb.bg} ${nb.text} ${nb.border}` : "bg-[var(--ds-brand-subtle)] text-[var(--ds-text-brand)] border-[var(--ds-border-brand)]"
                        }`}>
                          {nextMission
                            ? `${ne} Next: ${nextMission.title || t(MISSION_META[nextMission.slot_key]?.tKey ?? "storyMissionGo")}`
                            : "All done ✨"}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Tweak 1: Nimi with speech bubble */}
                <div className="flex justify-center mb-3 relative z-10">
                  <div className="relative">
                    <motion.img src={assets.nimiCircle} alt="Nimi" animate={{ y: [0, -6, 0] }}
                      transition={{ duration: DURATION.loopBase, repeat: Infinity }}
                      className="w-16 h-16 rounded-full border-4 border-yellow-400 shadow-xl" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: DURATION.loopFast, repeat: Infinity }}
                      className="absolute -top-2 -right-2 bg-yellow-400 rounded-full px-1.5 py-0.5 shadow-lg">
                      <span className="text-3xs font-black text-ds-text">{doneCount}/{totalCount}</span>
                    </motion.div>
                    {/* Speech bubble */}
                    <motion.div initial={{ opacity: 0, scale: 0.5, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: DURATION.moderate, ...SPRING.card }}
                      className="absolute -right-28 top-1 bg-[var(--ds-surface-card)] px-3 py-1.5 shadow-lg min-w-[100px]" style={{ borderRadius: 'var(--leaf-r)' }}>
                      <p className="font-baloo font-bold text-ds-text text-2xs whitespace-nowrap">
                        {doneCount === 0 ? t("storyBubbleLetsGo") : doneCount < totalCount / 2 ? t("storyBubbleGreatStart") : doneCount < totalCount ? t("storyBubbleAlmostThere") : t("storyBubbleYouDidIt")}
                      </p>
                      <div className="absolute left-[-6px] top-3 w-3 h-3 bg-[var(--ds-surface-card)] rotate-45" />
                    </motion.div>
                  </div>
                </div>

                {/* ═══ WINDING ADVENTURE MAP ═══ */}
                <div className="px-5 flex-1 relative z-10">

                  {/* Terrain decorations — scattered along the path */}
                  {[
                    { emoji: "🌳", x: "85%", top: "5%", size: 22, opacity: 0.15 },
                    { emoji: "🌿", x: "10%", top: "15%", size: 18, opacity: 0.12 },
                    { emoji: "🍄", x: "90%", top: "30%", size: 16, opacity: 0.1 },
                    { emoji: "🌸", x: "5%", top: "45%", size: 14, opacity: 0.12 },
                    { emoji: "🦋", x: "88%", top: "55%", size: 16, opacity: 0.15 },
                    { emoji: "🌻", x: "8%", top: "70%", size: 18, opacity: 0.1 },
                    { emoji: "🌲", x: "92%", top: "80%", size: 20, opacity: 0.12 },
                    { emoji: "⭐", x: "15%", top: "88%", size: 12, opacity: 0.08 },
                  ].map((d, i) => (
                    <motion.span key={i} className="absolute pointer-events-none select-none"
                      style={{ left: d.x, top: d.top, fontSize: d.size, opacity: d.opacity }}
                      animate={{ y: [0, -3, 0], rotate: [0, i % 2 === 0 ? 5 : -5, 0] }}
                      transition={{ duration: DURATION.loopFloat + i * 0.5, repeat: Infinity, delay: i * 0.3 }}>
                      {d.emoji}
                    </motion.span>
                  ))}

                  {slots.map((slot, i) => {
                    const metaBase = MISSION_META[slot.slot_key] ?? { emoji: "📌", tKey: slot.slot_key, actionKey: "storyMissionGo" };
                    const missionColor = v.contentGradients.missionPath[slot.slot_key] ?? "from-gray-500 to-gray-600";
                    const meta = { ...metaBase, color: missionColor };
                    const isNext = !slot.completed && (i === 0 || slots[i - 1]?.completed);
                    const isLocked = !slot.completed && !isNext;
                    const isEven = i % 2 === 0;

                    return (
                      <div key={slot.slot_key} className="relative">
                        {/* Curved path connector */}
                        {i > 0 && (
                          <svg className="w-full h-12 overflow-visible" viewBox="0 0 300 48" preserveAspectRatio="none">
                            <defs>
                              <filter id={`glow-${i}`}><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                            </defs>
                            {/* Glow behind completed paths */}
                            {slots[i-1]?.completed && (
                              <path d={isEven ? "M 230 0 Q 150 48, 70 48" : "M 70 0 Q 150 48, 230 48"}
                                fill="none" stroke="var(--ds-brand-primary)" strokeWidth="10" strokeLinecap="round" opacity="0.2" filter={`url(#glow-${i})`} />
                            )}
                            {/* Main path */}
                            <path d={isEven ? "M 230 0 Q 150 48, 70 48" : "M 70 0 Q 150 48, 230 48"}
                              fill="none" stroke={slots[i-1]?.completed ? "var(--ds-brand-primary)" : "rgba(0,0,0,0.1)"} strokeWidth="5" strokeLinecap="round"
                              strokeDasharray={isLocked ? "10 10" : "none"} />
                            {/* Footstep dots along completed paths */}
                            {slots[i-1]?.completed && [0.2, 0.5, 0.8].map((t, j) => (
                              <circle key={j} cx={isEven ? 230 - t * 160 : 70 + t * 160} cy={t * 48}
                                r="3" fill="rgba(0,0,0,0.1)" opacity="1" />
                            ))}
                          </svg>
                        )}

                        {/* Small terrain detail next to some nodes */}
                        {i === 0 && <span className="absolute -left-2 top-4 text-sm opacity-10 pointer-events-none">🏕️</span>}
                        {i === 2 && <span className="absolute -right-2 top-4 text-sm opacity-10 pointer-events-none">🌉</span>}
                        {i === 4 && <span className="absolute -left-2 top-4 text-sm opacity-10 pointer-events-none">⛺</span>}

                        {/* Mission node */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1, ...SPRING.card }}
                          className={`flex ${isEven ? "justify-start" : "justify-end"}`}>

                          <Link href={isLocked ? "#" : `/stories/${slug}/mission/${slot.slot_key}`}
                            onClick={e => { if (isLocked) e.preventDefault(); }}>
                            <motion.div
                              whileTap={!isLocked ? m.dangerPress : {}}
                              className={`relative flex flex-col items-center gap-2 w-[128px] leaf border p-3 transition-all ${
                                slot.completed
                                  ? "border-[var(--ds-border-brand)] bg-[var(--ds-brand-subtle)]/80 shadow-[0_10px_24px_rgba(16,185,129,0.12)]"
                                  : isNext
                                    ? "border-amber-200 bg-[var(--ds-surface-card)]/90 shadow-[0_12px_28px_rgba(250,204,21,0.16)]"
                                    : "border-white/70 bg-[var(--ds-surface-card)]/70 shadow-sm"
                              }`}>
                              <div className={`absolute inset-x-3 top-2 h-1 rounded-full ${slot.completed ? "bg-[var(--ds-brand-primary)]" : isNext ? "bg-amber-400" : "bg-slate-200"}`} />

                              {/* The big circle */}
                              <motion.div
                                animate={isNext ? {
                                  boxShadow: ["0 0 0 0 rgba(250,204,21,0.4)", "0 0 0 16px rgba(250,204,21,0)", "0 0 0 0 rgba(250,204,21,0.4)"],
                                } : {}}
                                transition={{ duration: DURATION.loopBase, repeat: Infinity }}
                                className={`relative w-[88px] h-[88px] rounded-full flex items-center justify-center transition-all ${
                                  slot.completed
                                    ? `bg-gradient-to-br ${meta.color} shadow-xl ring-4 ring-[var(--ds-brand-primary)]/40`
                                    : isNext
                                      ? `bg-gradient-to-br ${meta.color} shadow-2xl ring-4 ring-yellow-400/50`
                                      : "bg-[var(--ds-surface-card)] border-2 border-ds-border"
                                }`}>

                                {/* Emoji or lock */}
                                <motion.span className={`${isLocked ? "" : "drop-shadow-lg"}`}
                                  animate={isNext ? { scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] } : {}}
                                  transition={{ duration: DURATION.loopSlow, repeat: Infinity }}
                                  style={{ fontSize: isLocked ? 24 : 40 }}>
                                  {isLocked ? "🔒" : meta.emoji}
                                </motion.span>

                                {/* Green check on completed */}
                                {slot.completed && (
                                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...SPRING.card, delay: DURATION.base }}
                                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--ds-brand-primary)] rounded-full flex items-center justify-center border-3 border-ds-border shadow-lg">
                                    <CheckCircle2 className="w-5 h-5 text-[var(--ds-nav-bg)]" />
                                  </motion.div>
                                )}

                                {/* Tweak 2: Sparkle confetti on completed */}
                                {slot.completed && (
                                  <>
                                    <motion.span className="absolute -top-3 left-1 text-xs" animate={{ opacity: [0, 1, 0], y: [0, -8, 0], rotate: [0, 180, 360] }} transition={{ duration: DURATION.loopSlow, repeat: Infinity, delay: DURATION.fast }}>⭐</motion.span>
                                    <motion.span className="absolute -top-2 right-0 text-3xs" animate={{ opacity: [0, 1, 0], y: [0, -6, 0] }} transition={{ duration: DURATION.loopBase, repeat: Infinity, delay: DURATION.slow }}>✨</motion.span>
                                    <motion.span className="absolute top-0 -left-3 text-5xs" animate={{ opacity: [0, 0.8, 0], x: [-2, -8, -2] }} transition={{ duration: DURATION.loopFloat, repeat: Infinity, delay: DURATION.progress }}>🌟</motion.span>
                                    <motion.span className="absolute -bottom-2 left-2 text-4xs" animate={{ opacity: [0, 0.7, 0], y: [0, 5, 0] }} transition={{ duration: DURATION.loopSlow, repeat: Infinity, delay: DURATION.moderate }}>💫</motion.span>
                                  </>
                                )}

                                {/* Play overlay for next */}
                                {isNext && (
                                  <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: DURATION.loopFast, repeat: Infinity }}
                                    className="absolute inset-0 rounded-full flex items-center justify-center bg-black/10">
                                  </motion.div>
                                )}
                              </motion.div>

                              {/* Label below circle */}
                              <p className={`font-baloo font-black text-xs text-center leading-tight ${
                                isLocked ? "text-[var(--ds-text-tertiary)]" : slot.completed ? "text-[var(--ds-text-primary)]" : "text-[var(--ds-text-primary)]"
                              }`}>
                                {slot.title || t(meta.tKey)}
                              </p>

                              <div className={`text-3xs font-black uppercase tracking-[0.2em] ${
                                slot.completed ? "text-[var(--ds-text-brand)]" : isNext ? "text-amber-600" : "text-slate-400"
                              }`}>
                                {slot.completed && doneCount >= totalCount ? t("masteredLabel") : slot.completed ? "Done ✓" : isNext ? "Ready" : "Soon"}
                              </div>

                              {/* Stars below label */}
                              {!isLocked && (
                                <div className="flex items-center gap-0.5">
                                  <Star className={`w-3 h-3 ${slot.completed ? "text-yellow-400 fill-yellow-400" : "text-yellow-400/40 fill-yellow-400/40"}`} />
                                  <span className={`text-3xs font-bold ${slot.completed ? "text-yellow-600" : "text-yellow-400/40"}`}>{slot.stars ?? 10}</span>
                                </div>
                              )}
                            </motion.div>
                          </Link>
                        </motion.div>
                      </div>
                    );
                  })}

                  {/* ═══ FINISH LINE — Trophy + Piko ═══ */}
                  <div className="relative mt-2">
                    <svg className="w-full h-12 overflow-visible" viewBox="0 0 300 48" preserveAspectRatio="none">
                      <path d={slots.length % 2 === 0 ? "M 230 0 Q 150 48, 150 48" : "M 70 0 Q 150 48, 150 48"}
                        fill="none" stroke={doneCount >= totalCount ? "var(--ds-brand-primary)" : "rgba(0,0,0,0.1)"} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={doneCount >= totalCount ? "none" : "10 10"} />
                    </svg>
                    <div className="flex flex-col items-center gap-2">
                      {/* Trophy */}
                      <motion.div animate={doneCount >= totalCount ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
                        transition={{ duration: DURATION.loopBase, repeat: Infinity }}
                        className={`relative w-24 h-24 rounded-full flex items-center justify-center text-5xl ${
                          doneCount >= totalCount
                            ? "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-2xl shadow-yellow-500/30 ring-4 ring-yellow-400/40"
                            : "bg-[var(--ds-surface-card)] border-2 border-ds-border"
                        }`}>
                        {doneCount >= totalCount ? "🏆" : "🔒"}
                        {doneCount >= totalCount && (
                          <>
                            <motion.span className="absolute -top-3 -left-2 text-sm" animate={{ opacity: [0, 1, 0], y: [0, -10, 0] }} transition={{ duration: DURATION.loopBase, repeat: Infinity }}>⭐</motion.span>
                            <motion.span className="absolute -top-2 -right-3 text-xs" animate={{ opacity: [0, 1, 0], y: [0, -8, 0] }} transition={{ duration: DURATION.loopSlow, repeat: Infinity, delay: DURATION.moderate }}>✨</motion.span>
                          </>
                        )}
                      </motion.div>
                      {/* Piko cheering at the finish */}
                      <div className="relative">
                        <motion.img src={assets.pikoCircle} alt="Piko"
                          animate={{ y: [0, -4, 0] }} transition={{ duration: DURATION.loopBase, repeat: Infinity, delay: DURATION.moderate }}
                          className="w-12 h-12 rounded-full border-3 border-blue-400 shadow-lg" />
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: DURATION.loopSpark, ...SPRING.gentle }}
                          className="absolute -left-24 top-0 bg-[var(--ds-surface-card)] rounded-2xl rounded-br-sm px-2.5 py-1 shadow-lg">
                          <p className="font-baloo font-bold text-ds-text text-3xs whitespace-nowrap">
                            {doneCount >= totalCount ? t("storyBubbleWeDidIt") : t("storyBubbleKeepGoing")}
                          </p>
                          <div className="absolute right-[-5px] top-2.5 w-2.5 h-2.5 bg-[var(--ds-surface-card)] rotate-45" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificate button */}
                {doneCount >= totalCount && totalCount > 0 && (
                  <div className="px-5 mt-4">
                    <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      whileTap={m.buttonPress}
                      onClick={() => { playCelebration(); setPhase("certificate"); }}
                      className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-baloo font-black text-xl rounded-full py-4 shadow-2xl shadow-yellow-500/30 flex items-center justify-center gap-3">
                      {t("storySeeCertificate")}
                    </motion.button>
                  </div>
                )}

              </motion.div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* PHASE 4: CERTIFICATE                       */}
            {/* ═══════════════════════════════════════════ */}
            {phase === "certificate" && (
              <motion.div key="certificate" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center px-6 py-6 text-center relative overflow-hidden">

                {/* Back button */}
                <button
                  onClick={() => setPhase("missions")}
                  className="self-start flex items-center gap-1 text-[var(--ds-text-tertiary)] text-sml font-bold mb-2 hover:text-[var(--ds-text-secondary)] transition">
                  <ArrowLeft className="w-4 h-4" /> {t("storyBackBtn")}
                </button>

                {/* Colored confetti rain */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const cols = ["#fbbf24","#f472b6","#34d399","#60a5fa","#a78bfa","#fb923c"];
                    const col = cols[i % cols.length];
                    const sz = 5 + (i % 4) * 2;
                    return (
                      <motion.div key={i} className="absolute top-0 rounded-sm"
                        style={{ left: `${(i * 97 + 7) % 100}%`, width: sz, height: sz * 1.5, background: col, opacity: 0.7 }}
                        animate={{ y: ["0vh","110vh"], rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)], opacity: [0, 0.8, 0.8, 0] }}
                        transition={{ duration: 2.2 + (i % 5) * 0.3, repeat: Infinity, delay: (i * 0.2) % 3.5, ease: "linear" }}
                      />
                    );
                  })}
                </div>

                {/* Nimi celebrating */}
                <motion.img
                  src={assets.nimiCelebration}
                  alt="Nimi celebrating"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, y: [0, -7, 0] }}
                  transition={{ scale: { type: "spring", stiffness: 240, damping: 16 }, y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
                  className="w-28 h-28 rounded-full object-cover border-4 border-yellow-300 shadow-2xl mb-4"
                />

                {/* Child name — the hero text */}
                <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                  <p className="font-nunito text-[var(--ds-text-tertiary)] text-sml font-bold uppercase tracking-widest mb-1">{t("storyCertWoo")}</p>
                  <h2 className="font-baloo font-black text-3xl leading-tight" style={{ color: "var(--ds-brand-primary)" }}>
                    ⭐ {childName}! ⭐
                  </h2>
                  <p className="font-nunito text-[var(--ds-text-secondary)] text-mbase mt-1">{t("storyCertCompleted")}</p>
                  <h3 className="font-baloo font-black text-ds-text text-xl mt-0.5 leading-tight">{storyTitle}</h3>
                </motion.div>

                {/* Stars earned card */}
                <motion.div
                  initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                  className="mt-5 w-full max-w-sm leaf-lg border border-amber-100 bg-[var(--ds-surface-card)]/90 p-5 shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: DURATION.moderate, ...SPRING.card }}
                    className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/40">
                    <Star className="w-10 h-10 text-white fill-white" />
                  </motion.div>
                  <p className="text-yellow-500 font-baloo font-black text-2xl mt-3">+{totalStars} {t("storyStarsLabel")}</p>
                  <p className="text-[var(--ds-text-tertiary)] text-sml font-bold mt-1">{t("storyCertEarned")}</p>
                  <div className="mt-3 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs font-black text-yellow-700">
                    ✨ A shining finish for {childName}!
                  </div>
                </motion.div>

                {/* ═══ THE MAGIC BUTTON — Champion Reward ═══ */}
                <motion.div className="mt-8 w-full max-w-sm"
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: DURATION.loopSpark, ...SPRING.gentle }}>
                  <motion.button
                    onClick={() => { playCelebration(); setShowRewardModal(true); }}
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(250,204,21,0.4)",
                        "0 0 30px 8px rgba(250,204,21,0.3)",
                        "0 0 0 0 rgba(250,204,21,0.4)",
                      ],
                    }}
                    transition={{ duration: DURATION.loopBase, repeat: Infinity }}
                    whileHover={m.buttonHover}
                    whileTap={m.buttonPress}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-yellow-400 via-amber-400 to-[var(--ds-brand-primary)] text-white font-baloo font-black text-xl leaf py-5 shadow-2xl flex items-center justify-center gap-3">

                    {/* Sparkle particles inside button */}
                    {[0, 1, 2, 3, 4].map(i => (
                      <motion.span key={i} className="absolute text-white/30 pointer-events-none"
                        style={{ left: `${15 + i * 18}%`, top: "20%" }}
                        animate={{ y: [-5, -20, -5], opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
                        transition={{ duration: DURATION.loopFast, repeat: Infinity, delay: i * 0.3 }}>
                        ✦
                      </motion.span>
                    ))}

                    <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: DURATION.loopFast, repeat: Infinity }}
                      className="text-3xl">🏆</motion.span>
                    <span className="relative z-10 drop-shadow-lg">Claim Your Rewards!</span>
                    <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: DURATION.loopSpark, repeat: Infinity }}
                      className="text-2xl">🌟</motion.span>
                  </motion.button>
                </motion.div>

                {/* Emotional check-in */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-5 w-full max-w-xs leaf border border-pink-100 bg-gradient-to-br from-pink-50/60 via-white to-rose-50/40 p-4 text-center"
                >
                  {feeling ? (
                    <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 320, damping: 22 }}>
                      <span className="text-4xl">{feeling}</span>
                      <p className="font-baloo font-black text-ds-text text-mbase mt-2">{t("feelingThanks")}</p>
                    </motion.div>
                  ) : (
                    <>
                      <p className="font-baloo font-black text-ds-text text-sm mb-3">{t("howDidYouFeel")}</p>
                      <div className="flex items-center justify-center gap-3">
                        {["😊", "😢", "😮", "😂", "💖"].map(emoji => (
                          <motion.button key={emoji} onClick={() => handleFeelingSelect(emoji)}
                            whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.2 }}
                            className="text-3xl select-none transition">
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>

                <div className="mt-4 space-y-3 w-full max-w-xs">
                  <ShareAchievementFlow childId={childId} childName={childName} storySlug={slug} shareType="certificate"
                    title={storyTitle} description={`${childName} completed: ${storyTitle}`}
                    imageUrl={details?.cover_url ? getStorageUrl(details.cover_url) : null} />

                  <motion.button whileTap={m.buttonPress}
                    onClick={() => setPhase("challenge")}
                    className="w-full bg-gradient-to-r from-[var(--ds-brand-primary)] to-[var(--ds-brand-hover)] text-[var(--ds-nav-bg)] font-baloo font-black text-base rounded-full py-3.5 shadow-lg flex items-center justify-center gap-2">
                    {t("storyBonusChallenge")}
                  </motion.button>
                </div>

                {/* ═══ REWARD MODAL — Double Reward Effect ═══ */}
                <AnimatePresence>
                  {showRewardModal && (
                    <>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm" style={{ zIndex: 100 }}
                        onClick={() => !treasureAnimating && setShowRewardModal(false)} />

                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        transition={SPRING.bounce}
                        className="fixed inset-x-4 top-[10%] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[400px] bg-[var(--ds-surface-card)] leaf-lg border-2 border-yellow-400/30 p-6 text-center shadow-2xl"
                        style={{ zIndex: 101 }}>

                        {!treasureAnimating ? (
                          <>
                            {/* Eyebrow */}
                            <p className="font-nunito font-black text-2xs text-yellow-500 uppercase tracking-[0.14em] mb-4">
                              🏆 Badge Unlocked!
                            </p>

                            {/* Big badge with glow + shine sweep */}
                            <div className="relative flex justify-center items-center mb-4">
                              {/* Pulsing glow */}
                              <motion.div
                                className="absolute w-40 h-40 rounded-full bg-yellow-300/35 blur-2xl"
                                animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.3, 0.7, 0.3] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                              />
                              {/* Badge + shine */}
                              <div className="relative rounded-full overflow-hidden w-32 h-32">
                                <motion.div
                                  initial={{ scale: 0, rotate: -30 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}>
                                  <BadgeCircle slug={earnedBadgeSlug} size="xl" imageUrl={earnedBadgeImageUrl} />
                                </motion.div>
                                {/* Shine streak */}
                                <motion.div
                                  className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/55 to-transparent -skew-x-12 pointer-events-none"
                                  initial={{ x: "-100%" }}
                                  animate={{ x: "320%" }}
                                  transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 2.8 }}
                                />
                              </div>
                            </div>

                            {/* Badge name */}
                            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                              <h3 className="font-baloo font-black text-[var(--ds-text-primary)] text-1.5xl leading-tight">
                                {earnedBadgeSlug
                                  ? (getMilestoneBadgeMeta(earnedBadgeSlug)?.label ?? badgeDisplayName(earnedBadgeSlug))
                                  : "Story Badge"}
                              </h3>
                              <p className="font-nunito text-[var(--ds-text-tertiary)] text-sml mt-1 leading-snug">
                                {earnedBadgeSlug && getMilestoneBadgeMeta(earnedBadgeSlug)
                                  ? <>{getMilestoneBadgeMeta(earnedBadgeSlug)!.desc} 🎉</>
                                  : earnedBadgeSlug
                                    ? <>{childName} earned this by completing<br /><span className="font-bold text-[var(--ds-text-secondary)]">{storyTitle}</span></>
                                    : <span className="text-[var(--ds-text-tertiary)]">Awarding your badge…</span>
                                }
                              </p>
                            </motion.div>

                            {/* Certificate strip */}
                            <motion.div
                              initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.48 }}
                              className="w-full mt-4 space-y-2">
                              {/* Certificate row */}
                              <div className="bg-gradient-to-r from-amber-50 via-[#faf6ee] to-amber-50 border border-amber-200/70 rounded-2xl p-3.5 flex items-center gap-3">
                                <div className="w-11 h-11 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-xl">
                                  📜
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <p className="font-baloo font-black text-amber-800 text-sml leading-tight">Story Certificate</p>
                                  <p className="font-nunito text-amber-500/80 text-2xs truncate">Awarded to {childName}</p>
                                </div>
                                <div className="flex-shrink-0 flex flex-col gap-1">
                                  {hasSubscription || storyIsFree ? (
                                    <>
                                      <button
                                        onClick={() => void downloadCert("pdf")}
                                        disabled={downloadingCert !== null}
                                        className="bg-amber-100 hover:bg-amber-200 text-amber-700 font-black text-2xs rounded-xl px-3 py-1.5 transition disabled:opacity-60 flex items-center gap-1">
                                        {downloadingCert === "pdf" ? <Loader2 className="w-3 h-3 animate-spin" /> : "📥"} PDF
                                      </button>
                                      <button
                                        onClick={() => void downloadCert("png")}
                                        disabled={downloadingCert !== null}
                                        className="bg-amber-100 hover:bg-amber-200 text-amber-700 font-black text-2xs rounded-xl px-3 py-1.5 transition disabled:opacity-60 flex items-center gap-1">
                                        {downloadingCert === "png" ? <Loader2 className="w-3 h-3 animate-spin" /> : "🖼️"} PNG
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => setShowPricingModal(true)}
                                      className="bg-amber-400 hover:bg-amber-500 text-white font-black text-2xs rounded-xl px-3 py-1.5 transition flex items-center gap-1">
                                      👑 Unlock
                                    </button>
                                  )}
                                </div>
                              </div>
                              {/* Badge row */}
                              {earnedBadgeImageUrl && (
                                <div className="bg-[var(--ds-brand-subtle)] border border-[var(--ds-border-brand)]/70 rounded-2xl p-3.5 flex items-center gap-3">
                                  <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
                                    <BadgeCircle slug={earnedBadgeSlug} size="sm" imageUrl={earnedBadgeImageUrl} />
                                  </div>
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="font-baloo font-black text-[var(--ds-text-primary)] text-sml leading-tight">
                                      {earnedBadgeSlug ? badgeDisplayName(earnedBadgeSlug) : "Story Badge"}
                                    </p>
                                    <p className="font-nunito text-[var(--ds-text-secondary)]/80 text-2xs truncate">Earned by {childName}</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const a = document.createElement("a");
                                      a.href = earnedBadgeImageUrl;
                                      a.download = `${earnedBadgeSlug ?? "badge"}.png`;
                                      a.target = "_blank";
                                      a.click();
                                    }}
                                    className="flex-shrink-0 bg-[var(--ds-brand-soft)] hover:bg-[var(--ds-brand-primary)] text-[var(--ds-text-brand)] hover:text-[var(--ds-nav-bg)] font-black text-2xs rounded-xl px-3 py-1.5 transition">
                                    🖼️ PNG
                                  </button>
                                </div>
                              )}
                            </motion.div>

                            {/* Send to Treasure Box */}
                            <motion.button
                              initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.58 }}
                              whileTap={m.buttonPress}
                              onClick={() => {
                                setTreasureAnimating(true);
                                playStar();
                                setTimeout(() => {
                                  playCelebration();
                                  setTimeout(() => {
                                    setTreasureAnimating(false);
                                    setShowRewardModal(false);
                                    router.push("/treasure");
                                  }, 2000);
                                }, 1500);
                              }}
                              className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-baloo font-black text-mlg rounded-full py-4 shadow-[0_8px_22px_rgba(245,158,11,0.32)] flex items-center justify-center gap-2">
                              <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: DURATION.loopSpark, repeat: Infinity }}>✨</motion.span>
                              Send to My Treasure Box!
                            </motion.button>

                            <button onClick={() => setShowRewardModal(false)}
                              className="mt-3 text-[var(--ds-text-tertiary)] text-xs font-semibold hover:text-[var(--ds-text-secondary)] transition">
                              Maybe later
                            </button>
                          </>
                        ) : (
                          /* Treasure Box animation — items flying in */
                          <div className="py-8">
                            {/* Flying certificate */}
                            <motion.div
                              initial={{ x: -60, y: 0, scale: 1, opacity: 1 }}
                              animate={{ x: 0, y: -100, scale: 0.3, opacity: 0 }}
                              transition={{ duration: DURATION.loopFast, ease: EASE.exit }}
                              className="w-14 h-14 mx-auto mb-2 bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-yellow-300 rounded-xl flex items-center justify-center">
                              <span className="font-baloo font-black text-yellow-700 text-center leading-tight" style={{ fontSize: 7 }}>STORY<br/>CERT</span>
                            </motion.div>

                            {/* Flying badge */}
                            <motion.div
                              initial={{ x: 60, y: 0, scale: 1, opacity: 1 }}
                              animate={{ x: 0, y: -100, scale: 0.3, opacity: 0 }}
                              transition={{ duration: DURATION.loopFast, ease: EASE.exit, delay: DURATION.base }}
                              className="mx-auto mb-4 flex justify-center">
                              <BadgeCircle slug={earnedBadgeSlug} size="sm" imageUrl={earnedBadgeImageUrl} />
                            </motion.div>

                            {/* Treasure chest receiving */}
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{ scale: [0.8, 1.3, 1], rotate: [0, -10, 10, 0] }}
                              transition={{ duration: DURATION.loopFast, delay: DURATION.loopSpark }}
                              className="text-7xl mb-4">🎁</motion.div>

                            {/* Sparkle burst */}
                            {Array.from({ length: 8 }).map((_, i) => (
                              <motion.span key={i} className="absolute text-yellow-400"
                                style={{ left: "50%", top: "50%" }}
                                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                                animate={{
                                  x: Math.cos(i * Math.PI / 4) * 80,
                                  y: Math.sin(i * Math.PI / 4) * 80,
                                  scale: [0, 1.5, 0], opacity: [0, 1, 0],
                                }}
                                transition={{ duration: DURATION.loopSpark, delay: DURATION.loopFast }}>
                                ✨
                              </motion.span>
                            ))}

                            <motion.p
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: DURATION.loopBase }}
                              className="font-baloo font-black text-yellow-600 text-xl mt-4">
                              POOF! 🎉
                            </motion.p>
                            <motion.p
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: DURATION.loopBase + DURATION.base }}
                              className="text-[var(--ds-text-secondary)] text-sm mt-1">
                              Saved to your Champion Treasure Box!
                            </motion.p>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* PHASE 5: CHAMPION CHALLENGE                */}
            {/* ═══════════════════════════════════════════ */}
            {phase === "challenge" && (
              <motion.div key="challenge" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                className="flex-1 flex flex-col px-5 py-6">

                <button onClick={() => { playCelebration(); setPhase("certificate"); }} className="self-start mb-4 text-[var(--ds-text-tertiary)] flex items-center gap-1 text-sml font-bold">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="mb-4 leaf border border-yellow-200 bg-gradient-to-r from-yellow-50 via-amber-50/60 to-yellow-50 p-4 shadow-sm">
                  <p className="font-baloo font-black text-base text-amber-800">🏆 One extra sparkle challenge</p>
                  <p className="text-sml text-[var(--ds-text-secondary)] mt-1">A little kindness mission to finish the story with a happy heart.</p>
                </div>

                <h2 className="font-baloo font-black text-[var(--ds-brand-primary)] text-1.5xl text-center mb-4">{t("storyBonusChallenge")}</h2>

                {challengeDone ? (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center">
                    <motion.span className="text-6xl" animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: DURATION.loopBase, repeat: Infinity }}>🎉</motion.span>
                    <h3 className="font-baloo font-black text-ds-text text-1.5xl mt-4">{t("storyChallengeDone")}</h3>
                    <p className="text-[var(--ds-text-secondary)] text-sm mt-2">You&apos;re a true champion!</p>
                    <motion.button whileTap={m.buttonPress}
                      onClick={() => { playStar(); setPhase("complete"); }}
                      className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-baloo font-black text-lg rounded-full px-8 py-4 shadow-xl flex items-center gap-2">
                      {t("storyContinueBtn")}
                    </motion.button>
                  </motion.div>
                ) : challengeLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <motion.span className="text-4xl" animate={{ rotate: [0, 360] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>⭐</motion.span>
                  </div>
                ) : weeklyChallenge ? (
                  <ChampionChallengeCard
                    title={weeklyChallenge.title || undefined}
                    description={weeklyChallenge.description || undefined}
                    stars={weeklyChallenge.ch_stars}
                    image_url={weeklyChallenge.image_url}
                    video_url={weeklyChallenge.video_url}
                    difficulty={weeklyChallenge.difficulty ?? undefined}
                    reward={weeklyChallenge.reward_badge ?? undefined}
                    completed={challengeDone}
                    onDidIt={handleChallengeDidIt}
                  />
                ) : (
                  <ChampionChallengeCard onDidIt={handleChallengeDidIt} />
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* PHASE 6: COMPLETE — CELEBRATION            */}
            {/* ═══════════════════════════════════════════ */}
            {phase === "complete" && (
              <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center pb-10 text-center overflow-y-auto relative">

                {/* ══ CONFETTI RAIN ══ */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                  {Array.from({ length: 36 }).map((_, i) => {
                    const confettiColors = ["#fbbf24","#f472b6","#34d399","#60a5fa","#a78bfa","#fb923c","#f87171","#22c55e"];
                    const col = confettiColors[i % confettiColors.length];
                    const left = `${(i * 97 + 13) % 100}%`;
                    const delay = (i * 0.23) % 4;
                    const dur = 2.5 + (i % 5) * 0.4;
                    const size = 6 + (i % 4) * 3;
                    return (
                      <motion.div key={i}
                        className="absolute top-0 rounded-sm"
                        style={{ left, width: size, height: size * 1.6, background: col, opacity: 0.75 }}
                        animate={{ y: ["0vh","110vh"], rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)], opacity: [0, 0.8, 0.8, 0] }}
                        transition={{ duration: dur, repeat: Infinity, delay, ease: "linear" }}
                      />
                    );
                  })}
                </div>

                {/* ══ HERO ══ */}
                <div className="relative z-10 w-full flex flex-col items-center pt-8 px-4">

                  {/* YOU DID IT banner */}
                  <motion.div
                    initial={{ scale: 0, rotate: -12 }}
                    animate={{ scale: 1, rotate: -2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="mb-4 bg-gradient-to-r from-yellow-400 to-amber-500 px-6 py-2"
                    style={{ borderRadius: "var(--leaf-r)", boxShadow: "0 8px 32px rgba(251,191,36,0.40), inset 0 1px 0 rgba(255,255,255,0.35)" }}>
                    <p className="font-baloo font-black text-3.5xl text-amber-950 tracking-wide leading-none">
                      🎉 YOU DID IT! 🎉
                    </p>
                  </motion.div>

                  {/* Child name shoutout */}
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="font-baloo font-black text-ds-text text-1.5xl leading-tight">
                    {childName ? `${childName} is a` : "You are a"}
                  </motion.p>
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.35, type: "spring", stiffness: 260 }}
                    className={`mt-1 mb-5 px-6 py-1.5 rounded-full bg-gradient-to-r ${v.zoneGradients.library}`}
                    style={{ boxShadow: `0 6px 24px ${theme.shadow.cta}` }}>
                    <p className="font-baloo font-black text-white text-xl tracking-widest uppercase">
                      ⭐ SUPER EXPLORER ⭐
                    </p>
                  </motion.div>

                  {/* Nimi + Piko celebrating together */}
                  <div className="flex items-end justify-center gap-4 mb-4">
                    <motion.div className="relative"
                      initial={{ x: -40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 220 }}>
                      <motion.img src={assets.nimiCelebration} alt="Nimi"
                        animate={{ y: [0, -12, 0], rotate: [0, -6, 6, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-36 h-36 object-contain drop-shadow-xl" />
                      <motion.span className="absolute -top-3 -right-1 text-3xl"
                        animate={{ scale: [1,1.3,1], rotate: [0,20,-20,0] }}
                        transition={{ duration: 1.6, repeat: Infinity }}>⭐</motion.span>
                    </motion.div>

                    <motion.div className="relative"
                      initial={{ x: 40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 220 }}>
                      <motion.img src={assets.pikoCircle} alt="Piko"
                        animate={{ y: [0, -10, 0], rotate: [0, 8, -8, 0] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                        className="w-28 h-28 object-contain drop-shadow-xl rounded-full" />
                      <motion.span className="absolute -top-3 -left-1 text-2xl"
                        animate={{ scale: [1,1.4,1], rotate: [0,-20,20,0] }}
                        transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}>🌟</motion.span>
                    </motion.div>
                  </div>

                  {/* Story title + XP */}
                  <motion.div
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    className="flex flex-col items-center gap-2 mb-6">
                    <div className="px-4 py-1.5 rounded-full border border-ds-border bg-ds-card">
                      <p className="font-nunito font-black text-ds-text text-sml tracking-wide">
                        📖 {storyTitle}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <motion.div
                        className={`px-3 py-1 rounded-full text-2xs font-black text-white bg-gradient-to-r ${theme.gradients.badge}`}
                        animate={{ scale: [1,1.08,1] }} transition={{ duration: 2, repeat: Infinity }}>
                        ⚡ +100 XP
                      </motion.div>
                      <div className="px-3 py-1 rounded-full text-2xs font-black bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950">
                        🏅 Badge Earned!
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* ── What's Next ── */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.65 }}
                  className="relative z-10 w-full max-w-sm px-5 mb-6">

                  <div className="flex items-center gap-2 mb-3 justify-center">
                    <div className="flex-1 h-px bg-ds-border" />
                    <p className="font-baloo font-black text-ds-muted text-2xs uppercase tracking-[0.18em]">
                      🚀 What&apos;s Next?
                    </p>
                    <div className="flex-1 h-px bg-ds-border" />
                  </div>

                  <div className="flex items-stretch gap-3">
                    {/* Current story — MASTERED */}
                    <div className="flex-1 p-3.5 flex flex-col items-center gap-2 bg-ds-card border border-ds-border shadow-ds-card"
                      style={{ borderRadius: "var(--leaf-r)" }}>
                      <p className="font-baloo font-black text-4xs text-amber-500 uppercase tracking-widest">
                        Story {details?.sort_order ?? ""}
                      </p>
                      <span className="text-4xl leading-none">{details?.theme_emoji ?? "📖"}</span>
                      <p className="font-baloo font-black text-xs text-ds-text text-center leading-tight line-clamp-2 flex-1">
                        {storyTitle}
                      </p>
                      <div className={`w-full font-black text-3xs py-1.5 flex items-center justify-center gap-1 text-white bg-gradient-to-r ${theme.gradients.badge}`}
                        style={{ borderRadius: "var(--leaf-r-sm)" }}>
                        ✅ MASTERED!
                      </div>
                    </div>

                    {/* Connector */}
                    <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0">
                      <div className="w-px h-6 bg-ds-border" />
                      <motion.div
                        animate={nextStory?.unlocked ? { scale: [1, 1.25, 1] } : {}}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-ds-card border border-ds-border shadow-ds-card">
                        {nextStory?.unlocked ? "🔓" : <Lock className="w-4 h-4 text-ds-muted" />}
                      </motion.div>
                      <div className="w-px h-6 bg-ds-border" />
                    </div>

                    {/* Next story */}
                    {nextStory ? (
                      nextStory.unlocked ? (
                        <Link href={`/stories/${nextStory.slug}`} className="flex-1">
                          <motion.div whileTap={m.buttonPress}
                            className="h-full p-3.5 flex flex-col items-center gap-2 bg-ds-card border border-amber-200 shadow-ds-card"
                            style={{ borderRadius: "var(--leaf-r)" }}>
                            <p className="font-baloo font-black text-4xs text-amber-500 uppercase tracking-widest">
                              Story {nextStory.sort_order}
                            </p>
                            <span className="text-4xl leading-none">{nextStory.theme_emoji ?? "📖"}</span>
                            <p className="font-baloo font-black text-xs text-ds-text text-center leading-tight line-clamp-2 flex-1">
                              {nextStory.title}
                            </p>
                            <div className="w-full font-black text-3xs py-1.5 flex items-center justify-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950"
                              style={{ borderRadius: "var(--leaf-r-sm)" }}>
                              🚀 START!
                            </div>
                          </motion.div>
                        </Link>
                      ) : !nextStory.is_free && !hasSubscription ? (
                        <Link href="/pricing" className="flex-1">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={m.buttonPress}
                            className="h-full p-3.5 flex flex-col items-center gap-2 cursor-pointer"
                            style={{ borderRadius: "var(--leaf-r)", background: "linear-gradient(135deg,#6d28d9,#7c3aed)", border: "1px solid rgba(139,92,246,0.4)" }}>
                            <p className="font-baloo font-black text-4xs text-purple-200 uppercase tracking-widest">Story {nextStory.sort_order}</p>
                            <span className="text-4xl leading-none opacity-60">{nextStory.theme_emoji ?? "📖"}</span>
                            <p className="font-baloo font-black text-xs text-white text-center leading-tight line-clamp-2 flex-1">{nextStory.title}</p>
                            <div className="w-full font-black text-3xs py-1.5 flex items-center justify-center gap-1 bg-yellow-300 text-purple-900"
                              style={{ borderRadius: "var(--leaf-r-sm)" }}>
                              👑 Club Only
                            </div>
                          </motion.div>
                        </Link>
                      ) : (
                        <div className="flex-1 p-3.5 flex flex-col items-center gap-2 bg-ds-card border border-ds-border opacity-50"
                          style={{ borderRadius: "var(--leaf-r)" }}>
                          <p className="text-4xs font-black text-ds-muted uppercase tracking-widest">Story {nextStory.sort_order}</p>
                          <span className="text-4xl leading-none opacity-40">{nextStory.theme_emoji ?? "📖"}</span>
                          <p className="font-baloo font-black text-xs text-ds-muted text-center leading-tight line-clamp-2 flex-1">{nextStory.title}</p>
                          <div className="w-full bg-[var(--ds-surface-card-active)] text-ds-muted font-black text-3xs py-1.5 flex items-center justify-center gap-1"
                            style={{ borderRadius: "var(--leaf-r-sm)" }}>🔒 LOCKED</div>
                        </div>
                      )
                    ) : (
                      <div className="flex-1 p-3.5 flex flex-col items-center justify-center gap-2 bg-ds-card border border-dashed border-ds-border"
                        style={{ borderRadius: "var(--leaf-r)" }}>
                        <span className="text-3xl">🌟</span>
                        <p className="font-baloo font-black text-2xs text-ds-muted text-center leading-snug">More coming soon!</p>
                      </div>
                    )}
                  </div>

                  <p className="font-nunito text-ds-muted text-2xs mt-2.5">
                    {nextStory?.unlocked
                      ? "🎉 Your next adventure is ready — tap to begin!"
                      : nextStory && !nextStory.is_free && !hasSubscription
                        ? "👑 This story is Club-exclusive — subscribe to keep the adventure going!"
                        : nextStory
                          ? "Keep going — the next adventure will unlock soon!"
                          : "You've explored all stories so far — more coming soon! 🌟"}
                  </p>
                </motion.div>

                {/* ── Action buttons ── */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.75 }}
                  className="relative z-10 w-full max-w-xs px-5 space-y-3">

                  {/* PRIMARY: View Certificate */}
                  <motion.button
                    whileTap={m.buttonPress}
                    onClick={() => setShowCertModal(true)}
                    className="relative w-full font-baloo font-black text-xl py-4 flex items-center justify-center gap-2.5 overflow-hidden bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950"
                    style={{ borderRadius: "var(--leaf-r-lg)", boxShadow: "0 4px 20px rgba(251,191,36,0.40), inset 0 1px 0 rgba(255,255,255,0.4)" }}>
                    <motion.div className="absolute inset-0 pointer-events-none"
                      animate={{ x: ["-100%","200%"] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                      style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.40),transparent)", width: "45%" }} />
                    <span className="text-2xl">🎓</span>
                    <span>View My Certificate</span>
                  </motion.button>

                  {nextStory?.unlocked ? (
                    <Link href={`/stories/${nextStory.slug}`} className="block">
                      <motion.div whileTap={m.buttonPress}
                        className={`w-full font-baloo font-black text-mlg py-3.5 flex items-center justify-center gap-2 text-white ${v.buttonStyle.primary}`}
                        style={{ borderRadius: "var(--leaf-r-lg)" }}>
                        🚀 {t("storyNextStory")}
                      </motion.div>
                    </Link>
                  ) : nextStory && !nextStory.is_free && !hasSubscription ? (
                    <Link href="/pricing" className="block">
                      <motion.div whileTap={m.buttonPress} whileHover={{ scale: 1.02 }}
                        className="w-full font-baloo font-black text-mlg py-3.5 flex items-center justify-center gap-2 text-white bg-gradient-to-r from-violet-500 to-purple-600"
                        style={{ borderRadius: "var(--leaf-r-lg)", boxShadow: "0 6px 20px rgba(109,40,217,0.30)" }}>
                        👑 Unlock Next Story
                      </motion.div>
                    </Link>
                  ) : (
                    <Link href="/treasure" className="block">
                      <motion.div whileTap={m.buttonPress}
                        className={`w-full font-baloo font-black text-mlg py-3.5 flex items-center justify-center gap-2 text-white bg-gradient-to-r ${v.zoneGradients.treasureRoom}`}
                        style={{ borderRadius: "var(--leaf-r-lg)", boxShadow: "0 6px 20px rgba(245,158,11,0.30)" }}>
                        🏆 {t("storyMyTreasure")}
                      </motion.div>
                    </Link>
                  )}

                  <motion.button
                    whileTap={m.buttonPress}
                    onClick={handleShare}
                    disabled={sharingCert}
                    className={`w-full font-baloo font-black text-mbase py-3 flex items-center justify-center gap-2 text-white bg-gradient-to-r ${v.zoneGradients.communitySquare} disabled:opacity-60`}
                    style={{ borderRadius: "var(--leaf-r)", boxShadow: "0 4px 14px rgba(56,189,248,0.25)" }}>
                    {sharingCert ? "⏳ Preparing..." : "📲 Share on WhatsApp"}
                  </motion.button>

                  <Link href="/stories" className="block">
                    <motion.div whileTap={m.buttonPress}
                      className="w-full font-baloo font-black text-sm py-2.5 flex items-center justify-center gap-2 bg-ds-card border border-ds-border text-ds-text"
                      style={{ borderRadius: "var(--leaf-r)" }}>
                      📚 {t("storyBackBtn")}
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>

          <CelebrationModal isOpen={showCelebration}
            onClose={() => { setShowCelebration(false); setChallengeDone(true); }} childName={childName} />

          <AnimatePresence>
            {showCertModal && (
              <CertificateModal
                childName={childName}
                language={language}
                storyTitle={storyTitle}
                onClose={() => setShowCertModal(false)}
              />
            )}
          </AnimatePresence>
        </main>
      </PageSurface>
    </AppShell>
  );
}
