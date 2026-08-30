"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { ChevronRight, Crown, Lock, Play } from "lucide-react";
import { getStorageUrl } from "@/lib/queries";
import type { StoryLibraryItem } from "@/lib/story-types";

/* ── Category badge config ──────────────────────────────────────────────── */
const CAT_BADGE: Record<string, { emoji: string; color: string }> = {
  adventure: { emoji: "🌿", color: "bg-emerald-100 text-emerald-700" },
  audio:     { emoji: "🎧", color: "bg-violet-100  text-violet-700"  },
  reading:   { emoji: "📖", color: "bg-sky-100     text-sky-700"     },
  creative:  { emoji: "🎨", color: "bg-amber-100   text-amber-700"   },
  discovery: { emoji: "🌍", color: "bg-teal-100    text-teal-700"    },
  music:     { emoji: "🎵", color: "bg-pink-100    text-pink-700"    },
  science:   { emoji: "🔬", color: "bg-blue-100    text-blue-700"    },
};
function getCat(raw: string | null) {
  if (!raw) return null;
  return CAT_BADGE[raw.toLowerCase()] ?? { emoji: "📖", color: "bg-gray-100 text-gray-600" };
}

/* ══════════════════════════════════════════════════════════════════════════
   StoryCard — book-style card:  artwork on top, info panel below
══════════════════════════════════════════════════════════════════════════ */
interface CardProps {
  story:           StoryLibraryItem;
  isActive:        boolean;
  hasSubscription: boolean;
  onPrefetch?:     (sid: string) => void;
}

function StoryCard({ story, isActive, hasSubscription, onPrefetch }: CardProps) {
  const pct          = Math.round((story.progress ?? 0) * 100);
  const isPremLocked = !story.unlocked && !story.is_free && !hasSubscription;
  const cat          = getCat(story.category);

  /* ── Progress-locked (sequence) ── */
  if (!story.unlocked && !isPremLocked) {
    return (
      <div className="shrink-0 w-[156px] sm:w-[172px] select-none opacity-55">
        <div className="rounded-2xl overflow-hidden shadow-sm border border-[var(--ds-border-primary)]">
          <div className="relative w-full bg-[var(--ds-surface-card-active)]" style={{ aspectRatio: "3/4" }}>
            {story.cover_url
              ? <Image src={getStorageUrl(story.cover_url)} alt={story.title} fill className="object-cover grayscale" />
              : <div className="absolute inset-0 flex items-center justify-center text-5xl">{story.theme_emoji ?? "📖"}</div>}
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
              <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Lock className="w-5 h-5 text-[var(--ds-text-secondary)]" />
              </div>
            </div>
          </div>
          <div className="px-3 py-2.5 bg-[var(--ds-surface-card)]">
            <p className="font-baloo font-black text-[var(--ds-text-tertiary)] text-xs leading-tight line-clamp-2">{story.title}</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Premium-locked ── */
  if (isPremLocked) {
    return (
      <div className="shrink-0 w-[156px] sm:w-[172px]">
        <Link href="/pricing">
          <div className="rounded-2xl overflow-hidden group cursor-pointer border border-purple-200 shadow-sm hover:-translate-y-1 transition-transform duration-200">
            <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
              {story.cover_url
                ? <Image src={getStorageUrl(story.cover_url)} alt={story.title} fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                : <div className="absolute inset-0 flex items-center justify-center text-5xl bg-purple-50">{story.theme_emoji ?? "📖"}</div>}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-purple-900/45 transition-colors flex flex-col items-center justify-center gap-2">
                <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:bg-yellow-300 transition-colors">
                  <Crown className="w-5 h-5 text-purple-600 group-hover:text-purple-800" />
                </div>
                <span className="font-baloo font-black text-white text-3xs group-hover:text-yellow-300 transition-colors">Club Only</span>
              </div>
            </div>
            <div className="px-3 py-2.5 bg-purple-50 border-t border-purple-100 group-hover:bg-purple-100 transition-colors">
              <p className="font-baloo font-black text-purple-700 text-xs leading-tight line-clamp-2">{story.title}</p>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  /* ── Unlocked card — the main book-style design ── */
  const ctaLabel = story.complete
    ? "🏆 View Again"
    : pct > 0
    ? "Continue →"
    : "Start →";

  return (
    <div className="shrink-0 w-[156px] sm:w-[172px]">
      <Link
        href={`/stories/${story.slug}`}
        onMouseEnter={() => onPrefetch?.(story.sid)}
        className="group block"
        aria-label={`${story.complete ? "Revisit" : pct > 0 ? "Continue" : "Start"} story: ${story.title}`}
      >
        <div
          className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 border border-[var(--ds-border-primary)]"
          style={{
            boxShadow: isActive
              ? "0 6px 22px rgba(34,197,94,0.25), 0 0 0 2.5px rgba(34,197,94,0.45)"
              : story.complete
              ? "0 6px 22px rgba(251,191,36,0.18), 0 0 0 2px rgba(251,191,36,0.38)"
              : "0 4px 14px rgba(15,23,42,0.09)",
          }}
        >
          {/* ── Artwork — top section ── */}
          <div className="relative w-full overflow-hidden bg-[var(--ds-surface-card-active)]" style={{ aspectRatio: "3/4" }}>
            {story.cover_url
              ? <Image src={getStorageUrl(story.cover_url)} alt={story.title} fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500" />
              : <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,var(--ds-nav-bg),var(--ds-surface-nav))" }}>
                  <span className="text-5xl">{story.theme_emoji ?? "📖"}</span>
                </div>}

            {/* Status badge — top left */}
            <div className="absolute top-2 left-2">
              {story.complete ? (
                <span className="font-baloo font-black text-4xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full shadow-md">
                  ⭐ Done
                </span>
              ) : isActive ? (
                <span className="font-baloo font-black text-4xs bg-white/92 text-[var(--ds-text-brand)] px-2 py-0.5 rounded-full shadow-md backdrop-blur-sm">
                  ▶ Reading
                </span>
              ) : story.is_free ? (
                <span className="font-baloo font-black text-4xs bg-[var(--ds-brand-primary)] text-[var(--ds-nav-bg)] px-2 py-0.5 rounded-full shadow-md">
                  Free
                </span>
              ) : null}
            </div>

            {/* Play overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-xl backdrop-blur-sm">
                <Play className="w-5 h-5 fill-[var(--ds-brand-primary)] text-[var(--ds-brand-primary)] ml-0.5" />
              </div>
            </div>
          </div>

          {/* ── Info panel — below artwork ── */}
          <div className="bg-[var(--ds-surface-card)] px-3 pt-2.5 pb-3 flex flex-col gap-2">

            {/* Category badge */}
            {cat && (
              <span className={`inline-flex items-center gap-1 font-nunito font-bold text-4xs px-2 py-0.5 rounded-full w-fit capitalize ${cat.color}`}>
                {cat.emoji} {story.category}
              </span>
            )}

            {/* Story title */}
            <p className="font-baloo font-black text-[var(--ds-text-primary)] text-sml leading-tight line-clamp-2">
              {story.title}
            </p>

            {/* Progress bar + percentage */}
            {pct > 0 && !story.complete && (
              <div className="flex flex-col gap-1">
                <div className="h-2 bg-[var(--ds-surface-card-active)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg,var(--ds-brand-primary),var(--ds-brand-hover))" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
                <span className="font-nunito font-bold text-3xs text-[var(--ds-text-brand)]">{pct}% done</span>
              </div>
            )}

            {/* CTA */}
            <div
              className={`text-center font-baloo font-black text-2xs py-1.5 rounded-xl transition-all ${
                story.complete
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-[var(--ds-brand-subtle)] text-[var(--ds-text-brand)] border border-[var(--ds-border-brand)]"
              }`}
            >
              {ctaLabel}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ── "What's next?" discovery card ─────────────────────────────────────── */
function DiscoveryCard({ hasSubscription, lockedCount }: { hasSubscription: boolean; lockedCount: number }) {
  if (!hasSubscription && lockedCount > 0) {
    return (
      <div className="shrink-0 w-[156px] sm:w-[172px]">
        <Link href="/pricing">
          <div
            className="rounded-2xl overflow-hidden cursor-pointer group hover:-translate-y-1.5 transition-transform duration-200"
            style={{
              background: "linear-gradient(160deg,#6d28d9,#7c3aed,#8b5cf6)",
              boxShadow: "0 8px 28px rgba(109,40,217,0.28)",
            }}
          >
            <div className="flex flex-col items-center justify-center gap-3 px-3 py-5 text-center" style={{ aspectRatio: "3/4" }}>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                className="w-13 h-13 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 shadow-lg"
              >
                <Crown className="w-7 h-7 text-yellow-300" />
              </motion.div>
              <div>
                <p className="font-baloo font-black text-white text-sml leading-tight">
                  {lockedCount} more {lockedCount === 1 ? "story" : "stories"}
                </p>
                <p className="font-nunito text-purple-200 text-3xs mt-0.5">waiting for you</p>
              </div>
              <span className="font-baloo font-black text-yellow-300 text-2xs">👑 Unlock All →</span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="shrink-0 w-[156px] sm:w-[172px]">
      <Link href="/stories">
        <div
          className="rounded-2xl overflow-hidden cursor-pointer group hover:-translate-y-1.5 transition-transform duration-200 border-2 border-dashed border-[var(--ds-border-brand)] bg-[var(--ds-brand-subtle)] hover:bg-[var(--ds-brand-soft)]"
          style={{ aspectRatio: "3/4" }}
        >
          <div className="flex flex-col items-center justify-center gap-3 h-full px-3 text-center">
            <motion.span
              className="text-5xl leading-none"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >🔭</motion.span>
            <div>
              <p className="font-baloo font-black text-[var(--ds-text-brand)] text-sml leading-tight">What&apos;s next?</p>
              <p className="font-nunito text-[var(--ds-text-secondary)] text-3xs mt-1 leading-snug">
                More adventures are waiting!
              </p>
            </div>
            <span className="font-baloo font-black text-[var(--ds-text-brand)] text-2xs">Explore →</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HomeStoryLibrarySection
══════════════════════════════════════════════════════════════════════════ */
interface Props {
  stories:         StoryLibraryItem[];
  curStory:        StoryLibraryItem | undefined;
  hasSubscription: boolean;
  up:              Variants;
  stagger:         Variants;
  pop:             Variants;
  onPrefetch?:     (storyId: string) => void;
}

const HOME_MAX_STORIES = 5;

export default function HomeStoryLibrarySection({ stories, curStory, hasSubscription, up, stagger, pop, onPrefetch }: Props) {
  /* Empty state */
  if (stories.length === 0) {
    return (
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
        <div className="leaf-lg border border-[var(--ds-border-primary)] bg-[var(--ds-surface-card)] p-8 flex flex-col items-center gap-4 text-center shadow-sm">
          <motion.span className="text-5xl leading-none"
            animate={{ y: [0,-8,0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>📚</motion.span>
          <div>
            <p className="font-baloo font-black text-[var(--ds-text-primary)] text-xl">No adventures yet!</p>
            <p className="font-nunito text-[var(--ds-text-secondary)] text-sm mt-1">Check back soon — new stories are coming.</p>
          </div>
        </div>
      </motion.section>
    );
  }

  const premiumLockedCount = !hasSubscription
    ? stories.filter(s => !s.is_free && !s.unlocked).length
    : 0;

  /* Show up to HOME_MAX_STORIES on the home page */
  const visibleStories = stories.slice(0, HOME_MAX_STORIES);

  /* Inject upgrade wall after last free story */
  const lastFreeIdx = !hasSubscription
    ? visibleStories.reduce((last, s, i) => (s.is_free ? i : last), -1)
    : -1;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={stagger}
      className="relative h-full"
    >
      <div className="leaf-lg border border-[var(--ds-border-primary)] bg-[var(--ds-surface-card)] shadow-[0_16px_36px_rgba(15,23,42,0.06)] flex flex-col h-full">

        {/* ── Section header ── */}
        <motion.div variants={up} className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[var(--ds-brand-subtle)] flex items-center justify-center text-lg shrink-0 shadow-sm">
              📚
            </div>
            <div>
              <p className="font-nunito text-4xs uppercase tracking-widest text-[var(--ds-text-brand)] leading-none mb-0.5">The Library</p>
              <h2 className="font-baloo font-black text-xl text-[var(--ds-text-primary)] leading-tight">Story Library</h2>
            </div>
          </div>
          <Link href="/stories"
            className="flex items-center gap-0.5 font-nunito font-bold text-[var(--ds-text-brand)] text-sml hover:underline shrink-0"
            aria-label="See all stories">
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="h-px bg-[var(--ds-surface-card-active)] mx-4 mb-1 shrink-0" />

        {/* ── Horizontal story scroll ── */}
        <motion.div
          variants={stagger}
          className="flex gap-3.5 overflow-x-auto px-4 sm:px-5 pb-4 pt-2 flex-1"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {visibleStories.map((story, idx) => {
            const isActive = !story.complete && story.unlocked && story.sid === curStory?.sid;
            return (
              <React.Fragment key={story.sid}>
                {/* Upgrade wall — injected after last free story */}
                {!hasSubscription && lastFreeIdx >= 0 && idx === lastFreeIdx + 1 && premiumLockedCount > 0 && (
                  <motion.div variants={pop}>
                    <DiscoveryCard hasSubscription={false} lockedCount={premiumLockedCount} />
                  </motion.div>
                )}
                <motion.div variants={pop}>
                  <StoryCard
                    story={story}
                    isActive={isActive}
                    hasSubscription={hasSubscription}
                    onPrefetch={onPrefetch}
                  />
                </motion.div>
              </React.Fragment>
            );
          })}

          {/* Discovery / "What's next?" card at the end */}
          {(hasSubscription || premiumLockedCount === 0) && (
            <motion.div variants={pop}>
              <DiscoveryCard hasSubscription={hasSubscription} lockedCount={0} />
            </motion.div>
          )}
        </motion.div>

        {/* ── Practice Reading — tertiary action ── */}
        <div className="px-4 sm:px-5 pb-4 pt-1 shrink-0">
          <Link
            href="/talk-to-nimi?mode=practice"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl font-nunito font-semibold text-[var(--ds-text-tertiary)] text-xs border border-[var(--ds-border-primary)] hover:text-[var(--ds-text-brand)] hover:border-[var(--ds-border-brand)] transition-colors active:scale-[0.98]"
            aria-label="Practice reading with Nimi AI"
          >
            ✏️ Practice Reading
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
