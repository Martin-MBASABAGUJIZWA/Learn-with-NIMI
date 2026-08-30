"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Play, Crown, ChevronRight } from "lucide-react";
import { getStorageUrl } from "@/lib/queries";
import type { StoryLibraryItem, StorySlot } from "@/lib/story-types";
import { useLanguage } from "@/contexts/LanguageContext";

/* ── Slot-type → icon mapping ──────────────────────────────────────────────── */
const SLOT_ICONS: Record<string, string> = {
  flipflop_audio: "🎧",
  story_pdf:      "📖",
  coloring:       "🎨",
  move_explore:   "🤸",
  sing_along:     "🎵",
  bonus_video:    "🎬",
};

interface Props {
  curStory:         StoryLibraryItem | undefined;
  doneSlots:        number;
  totalSlots:       number;
  pct:              number;
  slots:            StorySlot[];
  up:               Variants;
  stagger:          Variants;
  hasSubscription?: boolean;
  nextPremiumStory?: StoryLibraryItem | null;
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyAdventure() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-6 py-10 text-center h-full">
      <motion.span
        className="text-6xl leading-none select-none"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >🔭</motion.span>
      <div>
        <p className="font-baloo font-black text-[var(--ds-text-primary)] text-xl leading-tight mb-1">
          Ready for an adventure?
        </p>
        <p className="font-nunito text-[var(--ds-text-secondary)] text-sm">
          Pick a story and start exploring!
        </p>
      </div>
      <Link
        href="/stories"
        className="flex items-center gap-2 font-baloo font-black text-sm px-6 py-3 rounded-2xl transition-all hover:-translate-y-0.5 active:scale-95"
        style={{
          background: "linear-gradient(135deg,var(--ds-brand-primary),var(--ds-brand-hover))",
          color: "var(--ds-nav-bg)",
          boxShadow: "var(--ds-shadow-cta)",
        }}
      >
        Explore Stories <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

/* ── Premium upsell ──────────────────────────────────────────────────────── */
function PremiumUpsell({ story }: { story: StoryLibraryItem }) {
  return (
    <Link href="/pricing" className="flex flex-col h-full">
      <div
        className="relative flex-1 overflow-hidden rounded-2xl flex flex-col items-center justify-center gap-4 px-5 text-center"
        style={{ background: "linear-gradient(145deg,#6d28d9,#7c3aed,#8b5cf6)" }}
      >
        {/* Blurred cover background */}
        {story.cover_url && (
          <Image
            src={getStorageUrl(story.cover_url)}
            alt=""
            fill
            className="object-cover blur-sm brightness-50 opacity-60"
          />
        )}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 shadow-2xl"
          >
            <Crown className="w-8 h-8 text-yellow-300" />
          </motion.div>
          <div>
            <p className="font-baloo font-black text-white text-xl leading-tight">
              🎉 You&apos;ve finished all free stories!
            </p>
            <p className="font-nunito text-white/70 text-sml mt-1">
              Next: <span className="text-white/90 font-bold">{story.title}</span>
            </p>
          </div>
          <span className="bg-yellow-300 text-purple-900 font-black text-sml px-5 py-2 rounded-full shadow-lg">
            👑 Subscribe →
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export default function HomeAdventureSection({
  curStory, doneSlots, totalSlots, pct, slots,
  up, stagger, hasSubscription, nextPremiumStory,
}: Props) {
  const { t } = useLanguage();
  const showPremiumUpsell =
    !!nextPremiumStory && !hasSubscription && (!curStory || curStory.complete);

  /* Next uncompleted slot — shown as "what's coming next" */
  const nextSlot = slots.find(s => !s.completed);
  const displayTotal = totalSlots || 6;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={stagger}
      className="relative h-full"
    >
      <motion.div
        variants={up}
        className="relative h-full overflow-hidden flex flex-col leaf-lg border border-[var(--ds-border-primary)] shadow-lg"
        style={{ background: "linear-gradient(165deg,#FEFBF0 0%,#FDF4D5 55%,#F5E8B0 100%)" }}
      >

        {/* ── Section header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">🌿</span>
            <div>
              <h2 className="font-baloo font-black text-[#1F5C38] text-lg leading-none">
                {t("homeAdventureLabel")}
              </h2>
              {curStory && !curStory.complete && (
                <p className="font-nunito text-[#4A7C5A] text-3xs leading-none mt-0.5">
                  Continue where you left off
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 px-4 pb-4 gap-3">

          {showPremiumUpsell && nextPremiumStory ? (
            <PremiumUpsell story={nextPremiumStory} />
          ) : !curStory ? (
            <EmptyAdventure />
          ) : (
            <>
              {/* ── Story artwork — the hero ─────────────────────────────── */}
              <Link
                href={`/stories/${curStory.slug}`}
                className="block group relative overflow-hidden rounded-2xl shrink-0 shadow-xl"
                aria-label={`Open story: ${curStory.title}`}
                style={{ aspectRatio: "16/9" }}
              >
                {curStory.cover_url ? (
                  <Image
                    src={getStorageUrl(curStory.cover_url)}
                    alt={curStory.title}
                    fill
                    priority
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)" }}
                  >
                    <span className="text-7xl leading-none select-none">
                      {curStory.theme_emoji ?? "📖"}
                    </span>
                  </div>
                )}

                {/* Dark gradient — bottom readability */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.28) 45%, transparent 75%)",
                  }}
                />

                {/* Status badge — top-left */}
                <div className="absolute top-2.5 left-2.5">
                  {curStory.complete ? (
                    <span className="flex items-center gap-1 font-baloo font-black text-2xs bg-amber-400 text-amber-900 px-2.5 py-1 rounded-full shadow-md">
                      🏆 {t("homeAdventureCompleteLabel")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-baloo font-black text-2xs bg-white/90 text-[var(--ds-text-brand)] px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm">
                      📖 {t("homeAdventureLabel")}
                    </span>
                  )}
                </div>

                {/* Play overlay — always on mobile, hover on desktop */}
                <div className="absolute inset-0 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm">
                    <Play className="w-6 h-6 fill-[var(--ds-brand-primary)] text-[var(--ds-brand-primary)] ml-0.5" />
                  </div>
                </div>

                {/* Story title overlay — bottom */}
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8 pointer-events-none">
                  <h3 className="font-baloo font-black text-white text-lg leading-tight drop-shadow-lg line-clamp-1">
                    {curStory.title}
                  </h3>
                  {curStory.category && (
                    <p className="font-nunito text-white/70 text-2xs mt-0.5 capitalize">
                      {curStory.category}
                    </p>
                  )}
                </div>
              </Link>

              {/* ── Progress section ──────────────────────────────────────── */}
              <div className="flex flex-col gap-2 shrink-0">

                {/* Mission dots + count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {/* Slot dots — max 10 visible, use partial dots for longer */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(displayTotal, 10) }).map((_, i) => {
                        const slot = slots[i];
                        const done = slot?.completed ?? false;
                        const isCurrent = !done && slots.slice(0, i).every(s => s?.completed);
                        return (
                          <motion.div
                            key={i}
                            className={`rounded-full transition-all duration-300 ${
                              done
                                ? "bg-[var(--ds-brand-primary)] shadow-sm"
                                : isCurrent
                                ? "border-2 border-[var(--ds-brand-primary)] bg-white"
                                : "bg-[rgba(0,0,0,0.12)]"
                            }`}
                            style={{ width: done ? 10 : isCurrent ? 10 : 8, height: done ? 10 : isCurrent ? 10 : 8 }}
                            animate={isCurrent ? { scale: [1, 1.25, 1] } : undefined}
                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                          />
                        );
                      })}
                    </div>
                    <span className="font-nunito font-bold text-[#3D6B4A] text-2xs">
                      {curStory.complete
                        ? "✓ " + t("journeyCompleted")
                        : `Mission ${doneSlots + 1} of ${displayTotal}`}
                    </span>
                  </div>
                  <span className="font-baloo font-black text-[#3D6B4A] text-sml">
                    {curStory.complete ? "100%" : `${pct}%`}
                  </span>
                </div>

                {/* Progress bar — game-style */}
                <div className="relative h-3 bg-[rgba(0,0,0,0.1)] rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background: curStory.complete
                        ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
                        : "linear-gradient(90deg,#22c55e,#16a34a,#15803d)",
                      boxShadow: "0 1px 4px rgba(34,197,94,0.40)",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${curStory.complete ? 100 : pct}%` }}
                    transition={{ duration: 1.4, ease: "easeOut", delay: 0.35 }}
                  />
                  {/* Shine glint */}
                  <div
                    className="absolute inset-y-0 left-0 w-full rounded-full pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 60%)",
                    }}
                  />
                </div>

                {/* Next activity hint */}
                {nextSlot && !curStory.complete && (
                  <p className="font-nunito text-[#4A7C5A] text-2xs flex items-center gap-1">
                    <span>{SLOT_ICONS[nextSlot.slot_key] ?? "▶"}</span>
                    <span>Next: {nextSlot.title}</span>
                  </p>
                )}
              </div>

              {/* ── Primary CTA ───────────────────────────────────────────── */}
              {curStory.complete ? (
                <Link
                  href="/stories"
                  className="flex items-center justify-center gap-2 w-full font-baloo font-black text-sm py-3.5 rounded-2xl transition-all hover:-translate-y-0.5 active:scale-95 shadow-md shrink-0"
                  style={{
                    background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
                    color: "#7c2d12",
                    boxShadow: "0 4px 14px rgba(251,191,36,0.45)",
                  }}
                >
                  <span>🏆</span> {t("homeAdventureViewCert")}
                </Link>
              ) : (
                <Link
                  href={`/stories/${curStory.slug}`}
                  className="flex items-center justify-center gap-2 w-full font-baloo font-black text-sm py-3.5 rounded-2xl transition-all hover:-translate-y-0.5 active:scale-95 shrink-0"
                  style={{
                    background: "linear-gradient(135deg,var(--ds-brand-primary),var(--ds-brand-hover))",
                    color: "var(--ds-nav-bg)",
                    boxShadow: "var(--ds-shadow-cta)",
                  }}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {doneSlots === 0 ? "Start Adventure" : t("homeAdventureKeepGoing")}
                </Link>
              )}

              {/* ── Today's progress footer ───────────────────────────────── */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-xl shrink-0"
                style={{ background: "rgba(30,60,30,0.08)", border: "1px solid rgba(30,60,30,0.12)" }}
              >
                <span className="font-nunito font-bold text-[#4A7C5A] text-2xs uppercase tracking-wider">
                  Today&apos;s Progress
                </span>
                <span className="font-baloo font-black text-[#1F5C38] text-sml">
                  {doneSlots} / {displayTotal}
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.section>
  );
}
