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
import { getChildren, getStorageUrl, getConsecutiveStreak, awardMilestoneBadges, awardBadge, getBadgeImages, createNotification, getStoryPages, getNimipikoPlatformIntroVideoUrl, markChildIntroWatched } from "@/lib/queries";
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
import { getWeeklyChallenges, completeWeeklyChallenge } from "@/lib/weeklyChallengeRepository";
import { getStoryCertificate } from "@/lib/storyCertificateRepository";
import type { StoryDetails, StorySlot, StoryCertificate, WeeklyChallenge } from "@/lib/story-types";
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


const MISSION_META: Record<string, { emoji: string; tKey: string; actionKey: string }> = {
  flipflop_audio:    { emoji: "📚", tKey: "flipflopAudioLabel",    actionKey: "storyMissionOpenBook"      },
  story_pdf:         { emoji: "📖", tKey: "storyPdfLabel",         actionKey: "storyMissionReadStory"     },
  coloring:          { emoji: "🎨", tKey: "coloringLabel",         actionKey: "storyMissionStartColoring" },
  move_explore:      { emoji: "🤸", tKey: "moveExploreLabel",      actionKey: "storyMissionLetsMove"      },
  sing_along:        { emoji: "🎤", tKey: "singAlongLabel",        actionKey: "storyMissionSingAlong"     },
  bonus_video:       { emoji: "🎬", tKey: "bonusVideoLabel",       actionKey: "storyMissionWatchVideo"    },
  challenge_1:       { emoji: "🏅", tKey: "weeklyChallenge1Label", actionKey: "storyMissionChallenge1"    },
  challenge_2:       { emoji: "🏅", tKey: "weeklyChallenge2Label", actionKey: "storyMissionChallenge2"    },
  challenge_3:       { emoji: "🏅", tKey: "weeklyChallenge3Label", actionKey: "storyMissionChallenge3"    },
  destination_video: { emoji: "🌍", tKey: "destinationVideoLabel", actionKey: "storyMissionDestination"   },
};

// Phase 4 — Book 1 activity stickers; hover added in Phase 7
const BOOK1_ACTIVITIES = [
  { key:"flipflop_audio", label:"Listen", bg:"#dbeafe", ring:"#3b82f6", icon:"/assets/icon-flipflop.svg", hover:{ scale:1.13, y:-5, rotate:-4 } },
  { key:"story_pdf",      label:"Read",   bg:"#fef3c7", ring:"#d97706", icon:"/assets/icon-pdf.svg",      hover:{ scale:1.10, y:-4, rotate:2  } },
  { key:"coloring",       label:"Create", bg:"#fce7f3", ring:"#ec4899", icon:"/assets/icon-coloring.svg", hover:{ scale:1.12, y:-5, rotate:-3 } },
  { key:"move_explore",   label:"Move",   bg:"#dcfce7", ring:"#22c55e", icon:"/assets/icon-move.svg",     hover:{ scale:1.15, y:-6, rotate:5  } },
  { key:"sing_along",     label:"Sing",   bg:"#ede9fe", ring:"#8b5cf6", icon:"/assets/icon-sing.svg",     hover:{ scale:1.11, y:-4, rotate:-2 } },
  { key:"bonus_video",    label:"Watch",  bg:"#e0e7ff", ring:"#6366f1", icon:"/assets/icon-video.svg",    hover:{ scale:1.10, y:-4, rotate:3  } },
];

const SLOT_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  flipflop_audio:    { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
  story_pdf:         { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
  coloring:          { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200"  },
  move_explore:      { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200"    },
  sing_along:        { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200"  },
  bonus_video:       { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200"  },
  challenge_1:       { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200"  },
  challenge_2:       { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200"  },
  challenge_3:       { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200"  },
  destination_video: { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200"    },
};

type Phase = "onboarding" | "welcome" | "missions" | "certificate" | "challenge" | "complete";


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
  const [giantBookUrl, setGiantBookUrl] = useState<string | null>(null);
  const [details, setDetails] = useState<StoryDetails | null>(null);
  const [slots, setSlots] = useState<StorySlot[]>([]);
  const [certificate, setCertificate] = useState<StoryCertificate | null>(null);
  const [challengeDone, setChallengeDone] = useState(false);
  const [weeklyChallenge, setWeeklyChallenge] = useState<WeeklyChallenge | null>(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null);
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
  // Phase 3 connection point: book-opening animation state
  const [isBookOpening, setIsBookOpening] = useState(false);
  const [bookIsOpen, setBookIsOpen] = useState(false);
  // Phase 5: Nimi/Piko reaction when an activity sticker is tapped
  const [nimiReacting, setNimiReacting] = useState(false);
  // Guard: prevent badge award effect from firing more than once per mount
  const badgeAwardedRef = useRef(false);
  // Phase 7: prevent double-navigation when a sticker is tapped
  const navigatingRef = useRef(false);

  // Phase 6: restore open-book state when child returns from a mission activity
  useEffect(() => {
    const key = `nimipiko:story-book-open:${slug}`;
    try {
      if (sessionStorage.getItem(key) === "1") {
        setIsBookOpening(true);
        setBookIsOpen(true);
      }
    } catch { /* sessionStorage unavailable — remain closed */ }
  }, [slug]);

  // Phase 6: persist open-book state so the child lands back inside the book on return
  useEffect(() => {
    if (!bookIsOpen) return;
    const key = `nimipiko:story-book-open:${slug}`;
    try { sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
  }, [bookIsOpen, slug]);

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
    let cancelled = false;
    void (async () => {
      const [{ data: { user } }, list, story, platformIntroUrl] = await Promise.all([
        supabase.auth.getUser(),
        getChildren(),
        getStoryBySlug(slug),
        getNimipikoPlatformIntroVideoUrl(),
      ]);
      if (cancelled) return;
      if (!user) { router.replace("/loginpage"); return; }
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
      setGiantBookUrl(story.giant_book_url ?? null);
      const [det, sl, cert] = await Promise.all([
        getStoryDetails(story.id, child.language),
        getStorySlots(child.id, story.id, child.language),
        getStoryCertificate(child.id, story.id, child.language),
      ]);
      if (cancelled) return;
      setDetails(det);
      setSlots(sl);
      setCertificate(cert);

      // Prefetch story pages in background so the flipflop_audio slot opens instantly
      void getStoryPages(story.id, child.language as "en" | "fr" | "rw");

      // Auto-detect phase based on progress
      const doneSlots = sl.filter(s => s.completed).length;
      const allMissionsDone = doneSlots >= sl.length && sl.length > 0;

      // Check onboarding: if a platform intro video exists and this child hasn't seen it yet, show it first
      const childRecord = await supabase.from("children").select("nimipiko_intro_watched").eq("id", child.id).maybeSingle();
      const introWatched = childRecord.data?.nimipiko_intro_watched ?? false;
      if (platformIntroUrl && !introWatched) {
        setIntroVideoUrl(platformIntroUrl);
        setPhase("onboarding");
      } else if (allMissionsDone && cert) {
        setPhase("complete");
      } else if (allMissionsDone) {
        setPhase("certificate");
      } else {
        setPhase("welcome");
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
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
  const nextMission = slots.find((s, i) => !s.completed && (i === 0 || slots[i - 1]?.completed));

  return (
    <AppShell>
      <PreviewBanner />
      <PageSurface className={isPreview ? "pt-10" : ""}>
        <main className="max-w-3xl mx-auto w-full min-h-screen flex flex-col">

          <AnimatePresence mode="wait">

            {/* ═══════════════════════════════════════════ */}
            {/* PHASE 0: PLATFORM ONBOARDING VIDEO        */}
            {/* ═══════════════════════════════════════════ */}
            {phase === "onboarding" && introVideoUrl && (
              <motion.div key="onboarding"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex flex-col items-center justify-center relative min-h-screen"
                style={{ background: "linear-gradient(160deg, #04111f 0%, #091829 45%, #100e24 100%)" }}>

                {/* Star field */}
                {STARS.map((s, i) => (
                  <motion.div key={i} className="absolute rounded-full pointer-events-none select-none"
                    style={{ left:`${s.x}%`, top:`${s.y}%`, width:s.size, height:s.size, background:"#fff" }}
                    animate={{ opacity:[0.15, s.peakOpacity, 0.15] }}
                    transition={{ duration:s.duration, delay:s.delay, repeat:Infinity, ease:"easeInOut" }} />
                ))}

                <div className="relative z-10 w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6 py-10">
                  <div className="text-center space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-widest text-amber-400">Welcome to Nimipiko ✨</p>
                    <h1 className="text-2xl font-black text-white leading-tight">Watch before you begin!</h1>
                    <p className="text-[13px] text-white/60">This short video shows you how the adventure works.</p>
                  </div>

                  <div className="w-full rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-black">
                    <video
                      src={getStorageUrl(introVideoUrl)}
                      controls
                      autoPlay
                      className="w-full"
                      style={{ maxHeight: 400 }}
                    />
                  </div>

                  <button
                    onClick={async () => {
                      if (childId) await markChildIntroWatched(childId).catch(() => {})
                      const doneSlots = slots.filter(s => s.completed).length
                      const allDone = doneSlots >= slots.length && slots.length > 0
                      if (allDone && certificate) setPhase("complete")
                      else if (allDone) setPhase("certificate")
                      else setPhase("welcome")
                    }}
                    className="w-full max-w-xs py-4 rounded-2xl font-black text-[15px] text-white shadow-lg transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg, #C9A84C 0%, #e4c06e 100%)" }}>
                    ✨ Start My Adventure
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* PHASE 1: GIANT BOOK ENTRY SCENE           */}
            {/* ═══════════════════════════════════════════ */}
            {phase === "welcome" && (
              <motion.div key="welcome"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex flex-col relative overflow-hidden"
                style={{ background: "linear-gradient(175deg, #03101e 0%, #07182e 38%, #0d1628 65%, #120d20 100%)" }}>

                {/* Starfield */}
                {STARS.map((s, i) => (
                  <motion.div key={i} className="absolute rounded-full pointer-events-none select-none"
                    style={{ left:`${s.x}%`, top:`${s.y}%`, width:s.size, height:s.size, background:"#fff" }}
                    animate={{ opacity:[0.15, s.peakOpacity, 0.15] }}
                    transition={{ duration:s.duration, repeat:Infinity, delay:s.delay, ease:"easeInOut" }} />
                ))}

                {/* Warm amber bloom — ground plane beneath the book */}
                <div className="absolute inset-x-0 bottom-0 pointer-events-none"
                  style={{ height:"55%", background:"radial-gradient(ellipse 80% 60% at 50% 100%, rgba(180,110,30,0.10) 0%, transparent 70%)" }} />

                {/* Top nav */}
                <div className="relative z-10 flex items-center justify-between px-4 pt-5 pb-2 shrink-0">
                  <button onClick={() => router.push("/stories")}
                    className="flex items-center gap-1.5 text-white/40 hover:text-white/70 font-nunito font-bold text-sm transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Library
                  </button>
                  <div className="flex items-center gap-2">
                    {streak > 0 && (
                      <div className="flex items-center gap-1 rounded-full px-3 py-1 border border-orange-400/25"
                        style={{ background:"rgba(251,146,60,0.12)" }}>
                        <motion.span animate={{ scale:[1,1.25,1] }} transition={{ duration:1.4, repeat:Infinity }}>🔥</motion.span>
                        <span className="font-baloo font-black text-orange-300 text-xs">{streak} day streak</span>
                      </div>
                    )}
                    {isPreview && (
                      <span className="font-nunito text-2xs px-2 py-0.5 rounded-full"
                        style={{ background:"rgba(201,168,76,0.15)", color:"#c9a84c", border:"1px solid rgba(201,168,76,0.3)" }}>
                        Preview
                      </span>
                    )}
                  </div>
                </div>

                {/* Collection eyebrow */}
                <motion.p initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
                  className="relative z-10 text-center font-nunito text-xs tracking-[0.28em] uppercase shrink-0"
                  style={{ color:"rgba(201,168,76,0.45)" }}>
                  Nimipiko · Story Collection
                </motion.p>

                {/* Story title */}
                <motion.h1 initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}
                  className="relative z-10 text-center font-baloo font-black mt-1 mb-1 shrink-0 px-6 leading-tight"
                  style={{ fontSize:"clamp(1.05rem,3.5vw,1.55rem)", color:"#f5e6c8" }}>
                  {storyTitle}
                </motion.h1>

                {/* Giant Book hero — takes remaining vertical space */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-2 min-h-0">

                  {/* Ambient gold glow under the book — gentle breathing */}
                  <motion.div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 pointer-events-none"
                    animate={{ scale:[1,1.18,1], opacity:[0.65,1,0.65] }}
                    transition={{ duration:4.5, repeat:Infinity, ease:"easeInOut" }}
                    style={{ width:"70%", height:"35%", background:"radial-gradient(ellipse, rgba(201,168,76,0.26) 0%, transparent 70%)", filter:"blur(36px)" }} />

                  {/* ── Mastered state ── */}
                  {doneCount >= totalCount && totalCount > 0 ? (
                    <div className="flex flex-col items-center gap-4">
                      <motion.div
                        initial={{ scale:0, rotate:-15 }} animate={{ scale:1, rotate:0 }}
                        transition={{ type:"spring", stiffness:220, damping:16, delay:0.2 }}
                        className="w-24 h-24 rounded-full flex items-center justify-center"
                        style={{ background:"radial-gradient(circle at 35% 35%, #fef9c3, #fde68a 60%, #f59e0b)", boxShadow:"0 0 48px rgba(245,158,11,0.35)" }}>
                        <span className="text-5xl">🏆</span>
                      </motion.div>
                      <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
                        className="font-baloo font-black text-2xl" style={{ color:"#f5e6c8" }}>
                        Story Complete!
                      </motion.p>
                      <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
                        className="font-nunito text-sm text-center" style={{ color:"rgba(201,168,76,0.6)" }}>
                        All {totalCount} chapters mastered
                      </motion.p>
                      <motion.button
                        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
                        whileHover={{ scale:1.04 }} whileTap={{ scale:0.95 }}
                        onClick={() => { playCelebration(); setPhase("certificate"); }}
                        className="font-baloo font-black text-base py-3 px-8 rounded-2xl flex items-center gap-2"
                        style={{ background:"linear-gradient(135deg, #F5C842, #C9A84C)", color:"#07111F", boxShadow:"0 8px 32px rgba(201,168,76,0.4)" }}>
                        🌟 {t("storySeeCertificate")}
                      </motion.button>
                      <motion.button
                        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.75 }}
                        whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}
                        onClick={() => { playTap(); setPhase("missions"); }}
                        className="font-nunito text-sm underline underline-offset-4"
                        style={{ color:"rgba(201,168,76,0.5)" }}>
                        Review missions →
                      </motion.button>
                    </div>

                  ) : (
                    /* ── Giant Book: closed → opening → open ── */
                    <div style={{ perspective:"1200px", perspectiveOrigin:"50% 40%" }} className="flex flex-col items-center w-full">

                      {!bookIsOpen ? (
                        /* CLOSED / OPENING STATE — portrait card with 3D cover rotation */
                        <motion.div
                          initial={{ opacity:0, y:24, scale:0.92 }}
                          animate={{ opacity:1, y: isBookOpening ? -10 : 0, scale: isBookOpening ? 1.04 : 1 }}
                          transition={isBookOpening
                            ? { duration:0.35, ease:"easeOut" }
                            : { type:"spring", stiffness:110, damping:18, delay:0.22 }}
                          style={{
                            position:"relative",
                            width:"min(300px,82vw)",
                            aspectRatio:"3/4",
                            transformStyle:"preserve-3d",
                          }}>

                          {/* Pages behind the cover — revealed when cover rotates away */}
                          <div style={{
                            position:"absolute", inset:0, borderRadius:18, overflow:"hidden",
                            boxShadow:"0 0 0 1px rgba(201,168,76,0.18)",
                            display:"flex",
                          }}>
                            <div style={{ width:"50%", background:"#150d05", display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ color:"rgba(201,168,76,0.18)", fontSize:36 }}>✦</span>
                            </div>
                            <div style={{ width:2, background:"rgba(201,168,76,0.22)", flexShrink:0 }} />
                            <div style={{ flex:1, background:"#f0ebe0", display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ color:"rgba(120,80,20,0.12)", fontSize:36 }}>✦</span>
                            </div>
                          </div>

                          {/* Cover — rotates open on tap (transform-origin: left spine edge) */}
                          <motion.div
                            animate={{ rotateY: isBookOpening ? -175 : 0 }}
                            transition={{ type:"spring", stiffness:52, damping:16, delay:0.1 }}
                            onClick={() => {
                              if (isBookOpening) return;
                              playTap();
                              setIsBookOpening(true);
                              const reducedMotion = typeof window !== "undefined" &&
                                window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                              setTimeout(() => setBookIsOpen(true), reducedMotion ? 50 : 1100);
                            }}
                            style={{
                              position:"absolute", inset:0,
                              transformOrigin:"left center",
                              backfaceVisibility:"hidden" as const,
                              borderRadius:18, overflow:"hidden",
                              cursor: isBookOpening ? "default" : "pointer",
                              boxShadow: isBookOpening
                                ? "-12px 0 40px rgba(0,0,0,0.55), 0 28px 60px rgba(0,0,0,0.65)"
                                : "0 0 0 1.5px rgba(201,168,76,0.45), 0 0 64px rgba(201,168,76,0.22), 0 32px 80px rgba(0,0,0,0.72)",
                            }}>

                            {giantBookUrl ? (
                              <Image src={getStorageUrl(giantBookUrl)} alt={storyTitle} fill className="object-cover" priority />
                            ) : (
                              /* Fallback cover — shown until artwork is uploaded in the admin */
                              <div className="w-full h-full flex flex-col items-center justify-between overflow-hidden"
                                style={{ background:"linear-gradient(155deg, #1c3a5e 0%, #0d1f3a 40%, #060f1d 100%)" }}>
                                {/* Top section */}
                                <div className="flex flex-col items-center pt-6 px-4 gap-1">
                                  <span style={{ fontFamily:"var(--font-nunito)", fontSize:"clamp(7px,1.4vw,9px)", letterSpacing:"0.32em", textTransform:"uppercase", color:"rgba(201,168,76,0.55)" }}>
                                    Nimipiko · Book 1
                                  </span>
                                  <div className="w-8 h-px mt-1" style={{ background:"rgba(201,168,76,0.3)" }} />
                                </div>
                                {/* Nimi character as cover art */}
                                <motion.div className="flex-1 flex items-end justify-center overflow-hidden"
                                  animate={!isBookOpening ? { y:[0,-6,0] } : { y:0 }}
                                  transition={{ duration:4.2, repeat:Infinity, ease:"easeInOut" }}>
                                  <img src="/nimi.png" alt="Nimi"
                                    style={{ height:"clamp(120px,48%,210px)", width:"auto", objectFit:"contain",
                                      filter:"drop-shadow(0 8px 28px rgba(59,130,246,0.35)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }} />
                                </motion.div>
                                {/* Title band */}
                                <div className="w-full flex flex-col items-center pb-5 pt-3 px-4 gap-0.5"
                                  style={{ background:"linear-gradient(to top, rgba(4,10,22,0.92), transparent)" }}>
                                  <span className="font-baloo font-black text-center leading-tight"
                                    style={{ fontSize:"clamp(0.95rem,3vw,1.3rem)", color:"#f5e6c8", textShadow:"0 2px 14px rgba(0,0,0,0.8)" }}>
                                    {storyTitle}
                                  </span>
                                  <span style={{ fontFamily:"var(--font-nunito)", fontWeight:700, fontSize:"clamp(0.55rem,1.3vw,0.7rem)", color:"rgba(201,168,76,0.55)", letterSpacing:"0.18em", textTransform:"uppercase" }}>
                                    {childName ? `${childName}'s Story` : "Your Story"}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Pulsing gold border — only when idle */}
                            <motion.div className="absolute inset-0 z-10 pointer-events-none"
                              animate={isBookOpening ? { opacity:0 } : { opacity:[0.5,1,0.5] }}
                              transition={isBookOpening
                                ? { duration:0.25 }
                                : { duration:2.4, repeat:Infinity, ease:"easeInOut" }}
                              style={{ borderRadius:18, border:"1.5px solid rgba(201,168,76,0.38)", boxShadow:"inset 0 0 28px rgba(201,168,76,0.16)" }} />

                            {/* Bottom tap hint — fades when opening starts */}
                            <motion.div
                              animate={{ opacity: isBookOpening ? 0 : 1 }}
                              transition={{ duration:0.2 }}
                              className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-center pb-5 pt-16 pointer-events-none"
                              style={{ background:"linear-gradient(to top, rgba(6,16,31,0.88) 0%, transparent 100%)" }}>
                              <motion.div
                                animate={{ opacity:[0.75,1,0.75], y:[0,-2,0] }}
                                transition={{ duration:2.2, repeat:Infinity, ease:"easeInOut" }}
                                className="flex items-center gap-2">
                                <span className="font-baloo font-black text-sm tracking-wide" style={{ color:"#F5C842" }}>
                                  {doneCount === 0 ? "Open the Book" : `Continue · ${doneCount}/${totalCount}`}
                                </span>
                                <motion.span animate={{ x:[0,4,0] }} transition={{ duration:1.2, repeat:Infinity }}
                                  style={{ color:"#C9A84C" }}>→</motion.span>
                              </motion.div>
                            </motion.div>

                            {/* Flash of warm light on tap */}
                            {isBookOpening && (
                              <motion.div className="absolute inset-0 pointer-events-none z-30"
                                initial={{ opacity:0.55 }}
                                animate={{ opacity:0 }}
                                transition={{ duration:0.55, ease:"easeOut" }}
                                style={{ background:"radial-gradient(circle at 40% 35%, rgba(255,240,190,0.65), transparent 70%)", borderRadius:18 }} />
                            )}
                          </motion.div>
                        </motion.div>

                      ) : (
                        /* ══════════════════════════════════════════════════ */
                        /* PHASE 4 — LIVING TWO-PAGE BOOK SPREAD             */
                        /* ══════════════════════════════════════════════════ */
                        <motion.div
                          initial={{ opacity:0, scale:0.88 }}
                          animate={{ opacity:1, scale:1 }}
                          transition={{ type:"spring", stiffness:105, damping:20 }}
                          className="flex"
                          style={{
                            width:"min(720px,96vw)",
                            borderRadius:18,
                            overflow:"hidden",
                            boxShadow:"0 0 0 1.5px rgba(201,168,76,0.3), 0 0 80px rgba(201,168,76,0.18), 0 40px 100px rgba(0,0,0,0.72)",
                          }}>

                          {/* ══ LEFT PAGE — NIMI AT SCHOOL ══ */}
                          <div style={{
                            width:"44%", flexShrink:0,
                            background:"linear-gradient(165deg, #2c1206 0%, #1a0c04 55%, #200e05 100%)",
                            position:"relative", overflow:"hidden",
                            display:"flex", flexDirection:"column",
                            minHeight:"min(460px,66vh)",
                          }}>
                            {/* Paper texture overlay */}
                            <div className="absolute inset-0 pointer-events-none"
                              style={{ backgroundImage:"url(/paper-texture.png)", backgroundSize:"220px", backgroundRepeat:"repeat", opacity:0.07, mixBlendMode:"overlay" }} />
                            {/* Ruled lines */}
                            {[14,25,36,47,58,69,80].map((pct,li) => (
                              <div key={li} className="absolute inset-x-0 h-px pointer-events-none"
                                style={{ top:`${pct}%`, background:"rgba(201,168,76,0.038)" }} />
                            ))}
                            {/* Floating gold stars */}
                            {([14,84,10,88] as number[]).map((x, si) => (
                              <motion.span key={si} className="absolute pointer-events-none select-none"
                                style={{ left:`${x}%`, top:`${[9,22,52,66][si]}%`, color:"rgba(201,168,76,0.2)", fontSize:"clamp(7px,1.5vw,10px)" }}
                                animate={{ y:[0,-3,0], opacity:[0.16,0.3,0.16] }}
                                transition={{ duration:2.8+si*0.7, repeat:Infinity, delay:si*0.45, ease:"easeInOut" }}>
                                ✦
                              </motion.span>
                            ))}
                            {/* Corner decorations */}
                            <span className="absolute top-3.5 right-3.5 pointer-events-none select-none"
                              style={{ fontSize:"clamp(13px,2.2vw,18px)", opacity:0.48 }}>🍎</span>
                            <span className="absolute pointer-events-none select-none"
                              style={{ bottom:"22%", left:"8%", fontSize:"clamp(10px,1.8vw,15px)", opacity:0.28, transform:"rotate(-18deg)" }}>✏️</span>

                            {/* Chapter heading */}
                            <div className="relative z-10 px-4 pt-4 pb-0 shrink-0">
                              <div className="flex items-center gap-2 mb-2.5">
                                <div className="flex-1 h-px" style={{ background:"linear-gradient(to right, transparent, rgba(201,168,76,0.26))" }} />
                                <span style={{ fontFamily:"var(--font-nunito)", fontSize:"clamp(7px,1.3vw,9px)", letterSpacing:"0.26em", textTransform:"uppercase", color:"rgba(201,168,76,0.42)" }}>Book I</span>
                                <div className="flex-1 h-px" style={{ background:"linear-gradient(to left, transparent, rgba(201,168,76,0.26))" }} />
                              </div>
                              <motion.h2
                                initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
                                className="font-baloo font-black text-center leading-tight"
                                style={{ fontSize:"clamp(0.95rem,2.6vw,1.35rem)", color:"#f5e6c8", textShadow:"0 2px 18px rgba(0,0,0,0.72)" }}>
                                The Talking Faces
                              </motion.h2>
                              <motion.p
                                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.42 }}
                                className="text-center font-nunito font-bold mt-1"
                                style={{ fontSize:"clamp(0.55rem,1.3vw,0.7rem)", letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(201,168,76,0.46)" }}>
                                Nimi at School
                              </motion.p>
                            </div>

                            {/* Ornamental divider */}
                            <div className="relative z-10 flex items-center gap-2 px-4 mt-2 mb-1 shrink-0">
                              <div className="flex-1 h-px" style={{ background:"linear-gradient(to right, transparent, rgba(201,168,76,0.2))" }} />
                              <span style={{ color:"rgba(201,168,76,0.36)", fontSize:8 }}>✦</span>
                              <div className="flex-1 h-px" style={{ background:"linear-gradient(to left, transparent, rgba(201,168,76,0.2))" }} />
                            </div>

                            {/* Nimi character — floats in remaining space */}
                            <div className="relative z-10 flex-1 flex items-end justify-center px-3 overflow-hidden">
                              {/* Floor shadow */}
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none"
                                style={{ width:"62%", height:14, background:"radial-gradient(ellipse, rgba(0,0,0,0.42), transparent 70%)", filter:"blur(5px)" }} />
                              <motion.div animate={{ y:[0,-5,0] }} transition={{ duration:3.8, repeat:Infinity, ease:"easeInOut" }}>
                                <motion.img src="/nimi.png" alt="Nimi"
                                  initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
                                  transition={{ type:"spring", stiffness:105, damping:18, delay:0.45 }}
                                  style={{ height:"clamp(100px,19vh,170px)", width:"auto", objectFit:"contain",
                                    filter:"drop-shadow(0 6px 16px rgba(0,0,0,0.58))" }} />
                              </motion.div>
                              {/* Cloud deco */}
                              <span className="absolute top-4 right-4 pointer-events-none select-none"
                                style={{ fontSize:"clamp(11px,2vw,16px)", opacity:0.2 }}>☁️</span>
                            </div>

                            {/* Progress bar */}
                            {totalCount > 0 && (
                              <div className="relative z-10 px-4 py-3 shrink-0"
                                style={{ borderTop:"1px solid rgba(201,168,76,0.1)" }}>
                                <div className="flex justify-between items-center mb-1">
                                  <span style={{ fontFamily:"var(--font-nunito)", fontSize:"clamp(7px,1.2vw,9px)", letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(201,168,76,0.36)" }}>Progress</span>
                                  <span style={{ fontFamily:"var(--font-nunito)", fontWeight:700, fontSize:"clamp(7px,1.2vw,9px)", color:"rgba(201,168,76,0.36)" }}>{doneCount}/{totalCount}</span>
                                </div>
                                <div style={{ height:3, borderRadius:3, background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
                                  <motion.div
                                    initial={{ width:0 }}
                                    animate={{ width:`${totalCount>0?(doneCount/totalCount)*100:0}%` }}
                                    transition={{ duration:1.2, delay:0.7, ease:"easeOut" }}
                                    style={{ height:"100%", borderRadius:3, background:"linear-gradient(to right,#c9a84c,#f5d67b)" }} />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ══ SPINE ══ */}
                          <div style={{
                            width:20, flexShrink:0,
                            background:"linear-gradient(to right, rgba(4,1,0,0.88), rgba(38,18,4,0.95), rgba(4,1,0,0.88))",
                            position:"relative", display:"flex", flexDirection:"column",
                            alignItems:"center", justifyContent:"space-between", padding:"16px 0",
                          }}>
                            <div style={{ width:"100%", height:1, background:"rgba(201,168,76,0.26)" }} />
                            {/* Page-curl shadows */}
                            <div className="absolute inset-y-0 left-0 w-1.5 pointer-events-none"
                              style={{ background:"linear-gradient(to right, rgba(0,0,0,0.28), transparent)" }} />
                            <div className="absolute inset-y-0 right-0 w-1.5 pointer-events-none"
                              style={{ background:"linear-gradient(to left, rgba(0,0,0,0.16), transparent)" }} />
                            <span style={{ writingMode:"vertical-rl", fontFamily:"var(--font-nunito)", fontWeight:900, fontSize:"4.5px", letterSpacing:"0.9em", textTransform:"uppercase", color:"rgba(201,168,76,0.3)", userSelect:"none" }}>NIMIPIKO</span>
                            <div style={{ width:"100%", height:1, background:"rgba(201,168,76,0.26)" }} />
                          </div>

                          {/* ══ RIGHT PAGE — WHAT ARE WE DOING TODAY? ══ */}
                          <div style={{
                            flex:1, background:"#f7f2e6",
                            borderRadius:"0 18px 18px 0",
                            position:"relative", overflow:"hidden",
                            display:"flex", flexDirection:"column",
                          }}>
                            {/* Paper texture */}
                            <div className="absolute inset-0 pointer-events-none"
                              style={{ backgroundImage:"url(/paper-texture.png)", backgroundSize:"220px", backgroundRepeat:"repeat", opacity:0.2 }} />
                            {/* Ruled lines */}
                            {[8,14,20,26,32,38,44,50,56,62,68,74,80,86,92].map((pct,li) => (
                              <div key={li} className="absolute inset-x-0 h-px pointer-events-none"
                                style={{ top:`${pct}%`, background:"rgba(120,80,20,0.05)" }} />
                            ))}
                            {/* Binding shadow */}
                            <div className="absolute inset-y-0 left-0 w-5 pointer-events-none z-10"
                              style={{ background:"linear-gradient(to right, rgba(0,0,0,0.065), transparent)" }} />
                            {/* Bookmark ribbon */}
                            <div className="absolute top-0 right-7 z-20 pointer-events-none hidden sm:block"
                              style={{ filter:"drop-shadow(-1px 2px 3px rgba(0,0,0,0.2))" }}>
                              <div style={{ width:15, height:44, background:"linear-gradient(to right,#7c3aed,#a855f7,#7c3aed)", clipPath:"polygon(0 0,100% 0,100% 80%,50% 100%,0 80%)" }} />
                            </div>

                            {/* Page header */}
                            <div className="relative z-10 px-4 pt-3.5 pb-0 shrink-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="flex-1 h-px" style={{ background:"rgba(120,80,20,0.13)" }} />
                                <span style={{ fontFamily:"var(--font-nunito)", fontSize:"clamp(7px,1.2vw,9px)", letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(120,80,20,0.32)" }}>Your Adventure</span>
                                <div className="flex-1 h-px" style={{ background:"rgba(120,80,20,0.13)" }} />
                              </div>
                              <motion.h2
                                initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.38 }}
                                className="font-baloo font-black text-center leading-snug"
                                style={{ fontSize:"clamp(0.86rem,2.2vw,1.05rem)", color:"#2d1a06" }}>
                                What are we doing today?
                              </motion.h2>
                            </div>

                            {/* Top row of activity stickers — Listen / Read / Create */}
                            <div className="relative z-10 flex justify-around px-3 pt-2 pb-1 shrink-0">
                              {BOOK1_ACTIVITIES.slice(0,3).map((act, ai) => {
                                const slot = slots.find(s => s.slot_key === act.key);
                                const available = !!slot;
                                const done = slot?.completed ?? false;
                                const isHero = act.key === "flipflop_audio";

                                const circle = (
                                  <div style={{
                                    width:"clamp(36px,6vw,50px)", height:"clamp(36px,6vw,50px)",
                                    borderRadius:"50%", flexShrink:0,
                                    background: available ? act.bg : "#e5e7eb",
                                    border:`2px solid ${available ? act.ring : "#d1d5db"}`,
                                    display:"flex", alignItems:"center", justifyContent:"center",
                                    boxShadow: done
                                      ? `0 0 0 3px ${act.ring}66, 0 0 16px ${act.ring}35, 0 3px 10px rgba(0,0,0,0.1)`
                                      : isHero && available
                                        ? `0 2px 14px ${act.ring}55`
                                        : available
                                          ? `0 2px 10px ${act.ring}30`
                                          : "0 2px 6px rgba(0,0,0,0.07)",
                                    position:"relative",
                                  }}>
                                    {/* Pulsing attention ring — hero (Listen) sticker only */}
                                    {isHero && available && (
                                      <motion.div className="absolute inset-0 pointer-events-none"
                                        animate={{ scale:[1,1.45,1], opacity:[0.55,0,0.55] }}
                                        transition={{ duration:2.4, repeat:Infinity, ease:"easeOut" }}
                                        style={{ borderRadius:"50%", border:`2px solid ${act.ring}` }} />
                                    )}
                                    <img src={act.icon} alt={act.label} style={{ width:"54%", height:"54%", objectFit:"contain" }} />
                                    {done && (
                                      <div style={{ position:"absolute", bottom:-4, right:-4, background:"#16a34a", borderRadius:"50%",
                                        width:"clamp(12px,2vw,15px)", height:"clamp(12px,2vw,15px)",
                                        display:"flex", alignItems:"center", justifyContent:"center",
                                        fontSize:"clamp(7px,1.2vw,9px)", color:"white", border:"1.5px solid white", lineHeight:1 }}>✓</div>
                                    )}
                                  </div>
                                );

                                // ── Available sticker — interactive button ──
                                if (available) {
                                  return (
                                    <motion.button key={act.key}
                                      type="button"
                                      aria-label={`${act.label} activity`}
                                      initial={{ opacity:0, y:8, scale:0.85 }}
                                      animate={{ opacity:1, y:0, scale:1 }}
                                      transition={{ delay:0.5+ai*0.09, type:"spring", stiffness:155, damping:18 }}
                                      whileHover={act.hover}
                                      whileTap={{ scale:0.88 }}
                                      onClick={() => {
                                        if (navigatingRef.current) return;
                                        navigatingRef.current = true;
                                        playTap();
                                        setNimiReacting(true);
                                        setTimeout(() => {
                                          router.push(`/stories/${slug}/mission/${act.key}`);
                                        }, 380);
                                      }}
                                      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                                        background:"none", border:"none", padding:"5px 6px", margin:"-5px -6px", cursor:"pointer" }}>
                                      {circle}
                                      <span style={{ fontFamily:"var(--font-baloo)", fontWeight:900,
                                        fontSize:"clamp(0.62rem,1.5vw,0.72rem)", color:"#2d1a06", textAlign:"center", lineHeight:1.1 }}>
                                        {act.label}
                                      </span>
                                    </motion.button>
                                  );
                                }

                                // ── Unavailable sticker — visual only ──
                                return (
                                  <motion.div key={act.key}
                                    initial={{ opacity:0, y:8, scale:0.85 }}
                                    animate={{ opacity:1, y:0, scale:1 }}
                                    transition={{ delay:0.5+ai*0.09, type:"spring", stiffness:155, damping:18 }}
                                    style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                                      opacity:0.28, cursor:"default" }}>
                                    {circle}
                                    <span style={{ fontFamily:"var(--font-baloo)", fontWeight:900,
                                      fontSize:"clamp(0.62rem,1.5vw,0.72rem)", color:"#2d1a06", textAlign:"center", lineHeight:1.1 }}>
                                      {act.label}
                                    </span>
                                  </motion.div>
                                );
                              })}
                            </div>

                            {/* Nimi + Piko characters — centered, dominant */}
                            <div className="relative z-10 flex items-end justify-center flex-1 pb-0 overflow-hidden"
                              style={{ gap:"clamp(2px,1.2vw,10px)", minHeight:"clamp(65px,13vh,110px)" }}>
                              {/* Nimi — reacts when an activity is tapped */}
                              <motion.div
                                animate={nimiReacting
                                  ? { y:[0,-14,5,-9,0], scale:[1,1.16,0.93,1.1,1] }
                                  : { y:[0,-4,0], rotate:[0,-1,0] }}
                                transition={nimiReacting
                                  ? { duration:0.44, ease:"easeOut" }
                                  : { duration:3.6, repeat:Infinity, ease:"easeInOut" }}>
                                <motion.img src="/nimi.png" alt="Nimi"
                                  initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                                  transition={{ delay:0.55, type:"spring", stiffness:100, damping:18 }}
                                  style={{ height:"clamp(68px,13.5vh,108px)", width:"auto", objectFit:"contain",
                                    filter: nimiReacting
                                      ? "drop-shadow(0 6px 18px rgba(59,130,246,0.45))"
                                      : "drop-shadow(0 4px 10px rgba(0,0,0,0.22))" }} />
                              </motion.div>
                              {/* Piko — follows with a slight delay */}
                              <motion.div
                                animate={nimiReacting
                                  ? { y:[0,-9,3,-6,0], rotate:[0,6,-2,4,0] }
                                  : { y:[0,-4,0], rotate:[0,0.9,0] }}
                                transition={nimiReacting
                                  ? { duration:0.5, ease:"easeOut", delay:0.06 }
                                  : { duration:3.1, repeat:Infinity, ease:"easeInOut", delay:0.4 }}>
                                <motion.img src="/themes/default/characters/piko.png" alt="Piko"
                                  initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }}
                                  transition={{ delay:0.65, type:"spring", stiffness:100, damping:18 }}
                                  style={{ height:"clamp(56px,11vh,88px)", width:"auto", objectFit:"contain",
                                    filter:"drop-shadow(0 4px 10px rgba(0,0,0,0.18))", marginBottom:4 }} />
                              </motion.div>
                            </div>

                            {/* Bottom row of activity stickers — Move / Sing / Watch */}
                            <div className="relative z-10 flex justify-around px-3 pt-1 pb-2 shrink-0">
                              {BOOK1_ACTIVITIES.slice(3,6).map((act, ai) => {
                                const slot = slots.find(s => s.slot_key === act.key);
                                const available = !!slot;
                                const done = slot?.completed ?? false;

                                const circle = (
                                  <div style={{
                                    width:"clamp(36px,6vw,50px)", height:"clamp(36px,6vw,50px)",
                                    borderRadius:"50%", flexShrink:0,
                                    background: available ? act.bg : "#e5e7eb",
                                    border:`2px solid ${available ? act.ring : "#d1d5db"}`,
                                    display:"flex", alignItems:"center", justifyContent:"center",
                                    boxShadow: done
                                      ? `0 0 0 3px ${act.ring}66, 0 0 16px ${act.ring}35, 0 3px 10px rgba(0,0,0,0.1)`
                                      : available
                                        ? `0 2px 10px ${act.ring}30`
                                        : "0 2px 6px rgba(0,0,0,0.07)",
                                    position:"relative",
                                  }}>
                                    <img src={act.icon} alt={act.label} style={{ width:"54%", height:"54%", objectFit:"contain" }} />
                                    {done && (
                                      <div style={{ position:"absolute", bottom:-4, right:-4, background:"#16a34a", borderRadius:"50%",
                                        width:"clamp(12px,2vw,15px)", height:"clamp(12px,2vw,15px)",
                                        display:"flex", alignItems:"center", justifyContent:"center",
                                        fontSize:"clamp(7px,1.2vw,9px)", color:"white", border:"1.5px solid white", lineHeight:1 }}>✓</div>
                                    )}
                                  </div>
                                );

                                if (available) {
                                  return (
                                    <motion.button key={act.key}
                                      type="button"
                                      aria-label={`${act.label} activity`}
                                      initial={{ opacity:0, y:8, scale:0.85 }}
                                      animate={{ opacity:1, y:0, scale:1 }}
                                      transition={{ delay:0.7+ai*0.09, type:"spring", stiffness:155, damping:18 }}
                                      whileHover={act.hover}
                                      whileTap={{ scale:0.88 }}
                                      onClick={() => {
                                        if (navigatingRef.current) return;
                                        navigatingRef.current = true;
                                        playTap();
                                        setNimiReacting(true);
                                        setTimeout(() => {
                                          router.push(`/stories/${slug}/mission/${act.key}`);
                                        }, 380);
                                      }}
                                      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                                        background:"none", border:"none", padding:"5px 6px", margin:"-5px -6px", cursor:"pointer" }}>
                                      {circle}
                                      <span style={{ fontFamily:"var(--font-baloo)", fontWeight:900,
                                        fontSize:"clamp(0.62rem,1.5vw,0.72rem)", color:"#2d1a06", textAlign:"center", lineHeight:1.1 }}>
                                        {act.label}
                                      </span>
                                    </motion.button>
                                  );
                                }

                                return (
                                  <motion.div key={act.key}
                                    initial={{ opacity:0, y:8, scale:0.85 }}
                                    animate={{ opacity:1, y:0, scale:1 }}
                                    transition={{ delay:0.7+ai*0.09, type:"spring", stiffness:155, damping:18 }}
                                    style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                                      opacity:0.28, cursor:"default" }}>
                                    {circle}
                                    <span style={{ fontFamily:"var(--font-baloo)", fontWeight:900,
                                      fontSize:"clamp(0.62rem,1.5vw,0.72rem)", color:"#2d1a06", textAlign:"center", lineHeight:1.1 }}>
                                      {act.label}
                                    </span>
                                  </motion.div>
                                );
                              })}
                            </div>

                            {/* Page footer */}
                            <div className="relative z-10 flex items-center justify-between px-4 py-2 shrink-0"
                              style={{ borderTop:"1px solid rgba(120,80,20,0.08)" }}>
                              <span style={{ fontFamily:"var(--font-nunito)", fontStyle:"italic", fontSize:"clamp(7px,1.1vw,9px)", color:"rgba(120,80,20,0.26)" }}>nimipiko.com</span>
                              <span style={{ fontFamily:"var(--font-nunito)", fontSize:"clamp(7px,1.1vw,9px)", color:"rgba(120,80,20,0.26)" }}>— {childName} —</span>
                            </div>
                          </div>

                        </motion.div>
                      )}

                      {/* Progress dots — only when book is closed */}
                      {!bookIsOpen && totalCount > 0 && (
                        <motion.div
                          initial={{ opacity:0 }}
                          animate={{ opacity: isBookOpening ? 0 : 1 }}
                          transition={{ delay: isBookOpening ? 0 : 0.52 }}
                          className="flex items-center gap-1.5 mt-4">
                          {slots.map((slot, i) => (
                            <div key={i} style={{
                              width: slot.completed ? 8 : 6,
                              height: slot.completed ? 8 : 6,
                              borderRadius:"50%",
                              background: slot.completed ? "#C9A84C" : "rgba(255,255,255,0.15)",
                              transition:"all 0.3s",
                              flexShrink:0,
                            }} />
                          ))}
                        </motion.div>
                      )}

                      {/* Hint text — only when closed and idle */}
                      {!bookIsOpen && (
                        <motion.p
                          initial={{ opacity:0 }}
                          animate={{ opacity: isBookOpening ? 0 : 1 }}
                          transition={{ delay: isBookOpening ? 0 : 0.68 }}
                          className="font-nunito text-xs mt-2.5 text-center"
                          style={{ color:"rgba(201,168,76,0.38)" }}>
                          {doneCount === 0 ? `${childName}, tap the book to begin` : `${doneCount} of ${totalCount} chapters complete`}
                        </motion.p>
                      )}
                    </div>
                  )}
                </div>

                {/* Nimi + République des Champions + Piko footer — fades when book is open */}
                <motion.div
                  animate={{ opacity: bookIsOpen ? 0 : 1, height: bookIsOpen ? 0 : "auto" }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10 flex items-end justify-between px-5 pb-5 shrink-0 overflow-hidden">
                  <motion.img src={assets.nimiCircle} alt="Nimi"
                    animate={{ y:[0,-5,0] }} transition={{ duration:3.2, repeat:Infinity, ease:"easeInOut" }}
                    className="w-11 h-11 rounded-full opacity-50"
                    style={{ border:"1.5px solid rgba(201,168,76,0.32)", boxShadow:"0 0 16px rgba(201,168,76,0.16)" }} />

                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.9 }}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5"
                    style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(201,168,76,0.18)" }}>
                    <span className="text-sm">👑</span>
                    <span className="font-nunito text-xs tracking-wide" style={{ color:"rgba(201,168,76,0.5)" }}>
                      République des Champions
                    </span>
                  </motion.div>

                  <motion.img src={assets.pikoCircle} alt="Piko"
                    animate={{ y:[0,-5,0] }} transition={{ duration:2.8, repeat:Infinity, ease:"easeInOut", delay:0.5 }}
                    className="w-11 h-11 rounded-full opacity-50"
                    style={{ border:"1.5px solid rgba(201,168,76,0.32)", boxShadow:"0 0 16px rgba(201,168,76,0.16)" }} />
                </motion.div>

              </motion.div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* PHASE 2: MISSION PATH                      */}
            {/* ═══════════════════════════════════════════ */}
            {phase === "missions" && (
              <motion.div key="missions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col pb-28 relative" style={{ background: '#06101F' }}>

                {/* Airways starfield background */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                  {Array.from({ length: 44 }).map((_, si) => (
                    <div key={si} style={{ position: 'absolute', left: `${((si * 137.5) % 100).toFixed(1)}%`, top: `${((si * 61.8) % 100).toFixed(1)}%`, width: si % 6 === 0 ? 2 : 1, height: si % 6 === 0 ? 2 : 1, borderRadius: '50%', background: '#F0E8D5', opacity: 0.03 + (si % 4) * 0.025 }} />
                  ))}
                  <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: '10%', left: '30%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
                </div>

                {/* Top bar */}
                <div className="flex items-center justify-between px-5 py-4 relative z-10">
                  <button onClick={() => setPhase("welcome")} className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#F0E8D5' }}>
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2">
                    {streak > 0 && (
                      <div className="flex items-center gap-1 rounded-full px-3 py-1.5" style={{ background: 'rgba(251,146,60,0.14)', border: '1px solid rgba(251,146,60,0.22)' }}>
                        <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>🔥</motion.span>
                        <span className="font-baloo font-black text-sml" style={{ color: '#FCA17D' }}>{streak}</span>
                      </div>
                    )}
                    <motion.div
                      initial={{ scale: 1 }} animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: DURATION.slow, delay: DURATION.base }}
                      className="flex items-center gap-1.5 rounded-full px-4 py-2" style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.28)', boxShadow: '0 4px 16px rgba(201,168,76,0.1)' }}>
                      <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: DURATION.loopBase, repeat: Infinity }}>
                        <Star className="w-5 h-5" style={{ color: '#F5C842', fill: '#F5C842' } as React.CSSProperties} />
                      </motion.div>
                      <span className="font-baloo font-black text-base" style={{ color: '#F5C842' }}>{totalStars}</span>
                    </motion.div>
                  </div>
                </div>

                <div className="mx-5 mb-4 leaf p-4 relative z-10" style={{ background: 'rgba(14,30,58,0.92)', border: '1.5px solid rgba(201,168,76,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-baloo font-black text-mbase" style={{ color: '#F0E8D5' }}>{t("storyAdventureBegins")}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(240,232,213,0.45)' }}>{doneCount} / {totalCount} · {totalStars} ⭐</p>
                    </div>
                    {(() => {
                      const ne = nextMission ? (MISSION_META[nextMission.slot_key]?.emoji ?? "⭐") : null;
                      return (
                        <div className="rounded-full px-3 py-1.5 text-2xs font-black whitespace-nowrap" style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', color: '#F5C842' }}>
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
                      className="absolute -right-28 top-1 px-3 py-1.5 shadow-lg min-w-[100px]" style={{ borderRadius: 'var(--leaf-r)', background: '#0E1E3A', border: '1.5px solid rgba(255,255,255,0.09)' }}>
                      <p className="font-baloo font-bold text-2xs whitespace-nowrap" style={{ color: '#F0E8D5' }}>
                        {doneCount === 0 ? t("storyBubbleLetsGo") : doneCount < totalCount / 2 ? t("storyBubbleGreatStart") : doneCount < totalCount ? t("storyBubbleAlmostThere") : t("storyBubbleYouDidIt")}
                      </p>
                      <div className="absolute left-[-6px] top-3 w-3 h-3 rotate-45" style={{ background: '#0E1E3A' }} />
                    </motion.div>
                  </div>
                </div>

                {/* ═══ AIRWAYS MISSION PATH ═══ */}
                <div className="px-4 flex-1 relative z-10 flex flex-col">

                  {slots.map((slot, i) => {
                    const metaBase = MISSION_META[slot.slot_key] ?? { emoji: "📌", tKey: slot.slot_key, actionKey: "storyMissionGo" };
                    const isNext = !slot.completed && (i === 0 || slots[i - 1]?.completed);
                    const isLocked = !slot.completed && !isNext;
                    const isChallenge = slot.slot_key.startsWith('challenge_');
                    const challengeWeek = isChallenge ? slot.slot_key.split('_')[1] : null;
                    const isDestination = slot.slot_key === 'destination_video';

                    type CardTheme = { bg: string; border: string; shadow: string; orbBg: string; orbGlow: string; eye: string };
                    const CARD_THEMES: Record<string, CardTheme> = {
                      flipflop_audio:    { bg: 'linear-gradient(135deg,#1A2F58 0%,#0E1E3A 100%)', border: 'rgba(96,165,250,0.35)',   shadow: 'rgba(59,130,246,0.22)',  orbBg: 'linear-gradient(135deg,#3B82F6,#1D4ED8)',  orbGlow: 'rgba(59,130,246,0.55)',  eye: '#93C5FD'  },
                      story_pdf:         { bg: 'linear-gradient(135deg,#2D1A06 0%,#1A1006 100%)', border: 'rgba(251,146,60,0.35)',   shadow: 'rgba(234,88,12,0.22)',   orbBg: 'linear-gradient(135deg,#F97316,#C2410C)',  orbGlow: 'rgba(249,115,22,0.55)', eye: '#FCA17D'  },
                      coloring:          { bg: 'linear-gradient(135deg,#2D0A2A 0%,#1A0618 100%)', border: 'rgba(232,121,249,0.35)',  shadow: 'rgba(192,38,211,0.22)',  orbBg: 'linear-gradient(135deg,#E879F9,#A21CAF)',  orbGlow: 'rgba(232,121,249,0.55)', eye: '#F0ABFC'  },
                      move_explore:      { bg: 'linear-gradient(135deg,#062218 0%,#03140E 100%)', border: 'rgba(52,211,153,0.35)',   shadow: 'rgba(16,185,129,0.22)',  orbBg: 'linear-gradient(135deg,#34D399,#047857)',  orbGlow: 'rgba(52,211,153,0.55)',  eye: '#6EE7B7'  },
                      sing_along:        { bg: 'linear-gradient(135deg,#1E0A38 0%,#110520 100%)', border: 'rgba(167,139,250,0.35)',  shadow: 'rgba(124,58,237,0.22)',  orbBg: 'linear-gradient(135deg,#A78BFA,#6D28D9)',  orbGlow: 'rgba(167,139,250,0.55)', eye: '#C4B5FD'  },
                      bonus_video:       { bg: 'linear-gradient(135deg,#2A0A10 0%,#180508 100%)', border: 'rgba(251,113,133,0.35)',  shadow: 'rgba(225,29,72,0.22)',   orbBg: 'linear-gradient(135deg,#FB7185,#BE123C)',  orbGlow: 'rgba(251,113,133,0.55)', eye: '#FCA5A5'  },
                      challenge_1:       { bg: 'linear-gradient(135deg,#241800 0%,#150E00 100%)', border: 'rgba(253,224,71,0.4)',    shadow: 'rgba(202,138,4,0.28)',   orbBg: 'linear-gradient(135deg,#FDE047,#B45309)',  orbGlow: 'rgba(253,224,71,0.6)',   eye: '#FDE047'  },
                      challenge_2:       { bg: 'linear-gradient(135deg,#241800 0%,#150E00 100%)', border: 'rgba(253,224,71,0.4)',    shadow: 'rgba(202,138,4,0.28)',   orbBg: 'linear-gradient(135deg,#FDE047,#B45309)',  orbGlow: 'rgba(253,224,71,0.6)',   eye: '#FDE047'  },
                      challenge_3:       { bg: 'linear-gradient(135deg,#241800 0%,#150E00 100%)', border: 'rgba(253,224,71,0.4)',    shadow: 'rgba(202,138,4,0.28)',   orbBg: 'linear-gradient(135deg,#FDE047,#B45309)',  orbGlow: 'rgba(253,224,71,0.6)',   eye: '#FDE047'  },
                      destination_video: { bg: 'linear-gradient(135deg,#032430 0%,#011520 100%)', border: 'rgba(34,211,238,0.35)',   shadow: 'rgba(6,182,212,0.22)',   orbBg: 'linear-gradient(135deg,#22D3EE,#0E7490)',  orbGlow: 'rgba(34,211,238,0.55)',  eye: '#67E8F9'  },
                    };
                    const FALLBACK_THEME: CardTheme = { bg: 'linear-gradient(135deg,#1A2F58,#0E1E3A)', border: 'rgba(255,255,255,0.08)', shadow: 'rgba(0,0,0,0.2)', orbBg: 'linear-gradient(135deg,#4B5563,#1F2937)', orbGlow: 'rgba(0,0,0,0.3)', eye: '#9CA3AF' };
                    const theme = CARD_THEMES[slot.slot_key] ?? FALLBACK_THEME;

                    const cardBorder = isLocked ? 'rgba(255,255,255,0.04)' : isNext ? theme.border : theme.border.replace(/[\d.]+\)$/, '0.14)');
                    const cardShadow = isLocked ? 'none' : isNext ? `0 8px 32px ${theme.shadow}, 0 0 0 1px ${theme.border}` : `0 4px 16px rgba(0,0,0,0.25)`;

                    const showChallengeDivider = isChallenge && slot.slot_key === 'challenge_1';
                    const showDestDivider = isDestination;

                    return (
                      <div key={slot.slot_key}>
                        {/* Section dividers */}
                        {(showChallengeDivider || showDestDivider) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0 5px' }}>
                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(240,232,213,0.22)', whiteSpace: 'nowrap' }}>
                              {showChallengeDivider ? '🏆 Weekly Challenges' : '✈️ Destination'}
                            </span>
                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                          </div>
                        )}

                        {/* Connector stem between cards */}
                        {i > 0 && (
                          <div style={{ width: 3, height: showChallengeDivider || showDestDivider ? 5 : 18, margin: '0 auto', borderRadius: 2, background: slots[i - 1]?.completed ? 'linear-gradient(180deg,#C9A84C,#F5C842)' : 'rgba(255,255,255,0.07)' }} />
                        )}

                        {/* Airways mission card */}
                        <Link href={isLocked ? '#' : `/stories/${slug}/mission/${slot.slot_key}`}
                          onClick={e => { if (isLocked) e.preventDefault(); }}
                          style={{ display: 'block', textDecoration: 'none' }}>
                          <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 26 }}
                            whileHover={!isLocked ? { y: -2, scale: 1.01 } : {}}
                            whileTap={!isLocked ? { scale: 0.97 } : {}}
                            style={{
                              background: isLocked ? '#0B1826' : theme.bg,
                              border: `2px solid ${cardBorder}`,
                              boxShadow: cardShadow,
                              borderRadius: 22,
                              padding: '14px 14px 14px 13px',
                              display: 'flex', alignItems: 'center', gap: 12,
                              position: 'relative', overflow: 'hidden',
                              opacity: isLocked ? 0.42 : 1,
                              cursor: isLocked ? 'default' : 'pointer',
                            }}>

                            {/* Glass shimmer */}
                            {!isLocked && (
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%)', pointerEvents: 'none', borderRadius: 22 }} />
                            )}

                            {/* "Your turn!" badge — top center of next card */}
                            {isNext && (
                              <div style={{ position: 'absolute', top: 0, left: 18, background: 'linear-gradient(90deg,#F5C842,#C9A84C)', color: '#07111F', fontSize: 8, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '0 0 9px 9px' }}>
                                ⚡ Your turn!
                              </div>
                            )}

                            {/* Week label for challenges */}
                            {isChallenge && challengeWeek && !isLocked && (
                              <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(253,224,71,0.5)' }}>
                                Week {challengeWeek}
                              </div>
                            )}

                            {/* Mission orb */}
                            <motion.div
                              animate={isNext ? { scale: [1, 1.09, 1] } : {}}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                              style={{
                                width: 54, height: 54, borderRadius: 15, flexShrink: 0,
                                background: isLocked ? 'rgba(255,255,255,0.03)' : theme.orbBg,
                                boxShadow: isLocked ? 'none' : `0 4px 14px ${theme.orbGlow}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: isLocked ? 20 : isChallenge && challengeWeek ? 20 : 26,
                                fontWeight: 900,
                                color: isChallenge && challengeWeek && !isLocked ? '#07111F' : undefined,
                                filter: isLocked ? 'grayscale(1)' : 'none',
                                marginTop: isNext ? 8 : 0,
                              }}>
                              {isLocked ? '🔒' : isChallenge && challengeWeek ? challengeWeek : metaBase.emoji}
                            </motion.div>

                            {/* Text block */}
                            <div style={{ flex: 1, minWidth: 0, marginTop: isNext ? 8 : 0 }}>
                              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: isLocked ? 'rgba(255,255,255,0.18)' : theme.eye, marginBottom: 3 }}>
                                {slot.completed ? 'Completed ✓' : isChallenge && challengeWeek ? `Week ${challengeWeek} Challenge` : isDestination ? 'Final Destination' : `Mission ${i + 1}`}
                              </div>
                              <div style={{ fontSize: 16, fontWeight: 900, color: isLocked ? 'rgba(240,232,213,0.2)' : slot.completed ? 'rgba(240,232,213,0.5)' : '#F0E8D5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                                {slot.title || t(metaBase.tKey)}
                              </div>
                              {slot.subtitle && !isLocked && (
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,232,213,0.38)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {slot.subtitle}
                                </div>
                              )}
                              {/* Star pips */}
                              {!isLocked && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 7 }}>
                                  {[0, 1, 2].map(j => (
                                    <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: slot.completed ? '#F5C842' : 'rgba(255,255,255,0.08)', boxShadow: slot.completed ? '0 0 4px rgba(245,200,66,0.6)' : 'none' }} />
                                  ))}
                                  <span style={{ fontSize: 9, fontWeight: 800, color: slot.completed ? '#F5C842' : 'rgba(240,232,213,0.28)', marginLeft: 3 }}>
                                    {slot.stars ?? 10} ⭐
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Right CTA */}
                            <div style={{ flexShrink: 0, marginTop: isNext ? 8 : 0 }}>
                              {slot.completed ? (
                                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(201,168,76,0.12)', border: '2px solid rgba(201,168,76,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✅</div>
                              ) : isNext ? (
                                <motion.div
                                  animate={{ scale: [1, 1.06, 1] }}
                                  transition={{ duration: 1.4, repeat: Infinity }}
                                  style={{ background: 'linear-gradient(135deg,#F5C842,#C9A84C)', color: '#07111F', fontSize: 13, fontWeight: 900, border: 'none', borderRadius: 13, padding: '9px 14px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(201,168,76,0.5)' }}>
                                  Start! →
                                </motion.div>
                              ) : isLocked ? (
                                <span style={{ fontSize: 16 }}>🔒</span>
                              ) : (
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(240,232,213,0.35)', fontSize: 15 }}>›</div>
                              )}
                            </div>

                            {/* Floating stars when done */}
                            {slot.completed && (
                              <>
                                <motion.span style={{ position: 'absolute', fontSize: 10, left: '64%', top: '12%', pointerEvents: 'none' }}
                                  animate={{ opacity: [0.8, 0, 0.8], y: [0, -26, 0] }} transition={{ duration: 2.6, repeat: Infinity, delay: 0 }}>⭐</motion.span>
                                <motion.span style={{ position: 'absolute', fontSize: 8, left: '76%', top: '42%', pointerEvents: 'none' }}
                                  animate={{ opacity: [0.6, 0, 0.6], y: [0, -20, 0] }} transition={{ duration: 2.6, repeat: Infinity, delay: 0.9 }}>✨</motion.span>
                              </>
                            )}
                          </motion.div>
                        </Link>
                      </div>
                    );
                  })}

                  {/* ═══ AIRWAYS FINISH LINE ═══ */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0 8px' }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(240,232,213,0.2)', whiteSpace: 'nowrap' }}>🏁 Finish Line</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 24 }}>
                    <motion.div
                      animate={doneCount >= totalCount ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
                      transition={{ duration: DURATION.loopBase, repeat: Infinity }}
                      style={{
                        width: 88, height: 88, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42,
                        background: doneCount >= totalCount ? 'linear-gradient(135deg,#F5C842,#C9A84C)' : 'rgba(255,255,255,0.04)',
                        border: doneCount >= totalCount ? '3px solid rgba(245,200,66,0.5)' : '2px solid rgba(255,255,255,0.07)',
                        boxShadow: doneCount >= totalCount ? '0 12px 40px rgba(201,168,76,0.4)' : 'none',
                        position: 'relative',
                      }}>
                      {doneCount >= totalCount ? '🏆' : '🔒'}
                      {doneCount >= totalCount && (
                        <>
                          <motion.span style={{ position: 'absolute', top: -10, left: -6, fontSize: 13 }}
                            animate={{ opacity: [0, 1, 0], y: [0, -12, 0] }} transition={{ duration: DURATION.loopBase, repeat: Infinity }}>⭐</motion.span>
                          <motion.span style={{ position: 'absolute', top: -8, right: -10, fontSize: 11 }}
                            animate={{ opacity: [0, 1, 0], y: [0, -10, 0] }} transition={{ duration: DURATION.loopSlow, repeat: Infinity, delay: DURATION.moderate }}>✨</motion.span>
                        </>
                      )}
                    </motion.div>
                    <div style={{ position: 'relative' }}>
                      <motion.img src={assets.pikoCircle} alt="Piko"
                        animate={{ y: [0, -4, 0] }} transition={{ duration: DURATION.loopBase, repeat: Infinity, delay: DURATION.moderate }}
                        style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(96,165,250,0.55)', boxShadow: '0 4px 16px rgba(59,130,246,0.22)' }} />
                      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: DURATION.loopSpark, ...SPRING.gentle }}
                        style={{ position: 'absolute', left: -88, top: 0, background: '#0E1E3A', border: '1.5px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '6px 10px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                        <p style={{ fontFamily: 'inherit', fontWeight: 900, fontSize: 10, color: '#F0E8D5', whiteSpace: 'nowrap' }}>
                          {doneCount >= totalCount ? t("storyBubbleWeDidIt") : t("storyBubbleKeepGoing")}
                        </p>
                        <div style={{ position: 'absolute', right: -5, top: 10, width: 10, height: 10, background: '#0E1E3A', transform: 'rotate(45deg)', borderRight: '1.5px solid rgba(255,255,255,0.09)', borderBottom: '1.5px solid rgba(255,255,255,0.09)' }} />
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Certificate button */}
                {doneCount >= totalCount && totalCount > 0 && (
                  <div className="px-5 mt-2 pb-4">
                    <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      whileTap={m.buttonPress}
                      onClick={() => { playCelebration(); setPhase("certificate"); }}
                      className="w-full font-baloo font-black text-xl rounded-full py-4 flex items-center justify-center gap-3"
                      style={{ background: 'linear-gradient(135deg,#F5C842,#C9A84C)', color: '#07111F', boxShadow: '0 8px 32px rgba(201,168,76,0.45)' }}>
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
