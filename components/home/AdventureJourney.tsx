"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, ChevronRight, Play } from "lucide-react";
import type { StorySlot } from "@/lib/story-types";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  storySlug: string;
  slots: StorySlot[];
}

const MISSION_META: Record<string, { nameKey: string; descKey: string; icon: string; bg: string; mascot: string }> = {
  flipflop_audio: { nameKey: "missionMagicStories", descKey: "missionMagicStoriesDesc", icon: "📖", bg: "from-violet-500 to-purple-700", mascot: "🎧" },
  story_pdf: { nameKey: "missionShinyReaders", descKey: "missionShinyReadersDesc", icon: "📄", bg: "from-blue-500 to-indigo-700", mascot: "📚" },
  coloring: { nameKey: "missionLittleCreators", descKey: "missionLittleCreatorsDesc", icon: "🎨", bg: "from-orange-400 to-pink-600", mascot: "🖌️" },
  move_explore: { nameKey: "missionMoveGroove", descKey: "missionMoveGrooveDesc", icon: "🤸", bg: "from-green-400 to-emerald-700", mascot: "💃" },
  sing_along: { nameKey: "missionSingAlong", descKey: "missionSingAlongDesc", icon: "🎵", bg: "from-pink-400 to-rose-700", mascot: "🎤" },
  bonus_video: { nameKey: "missionJourney", descKey: "missionJourneyDesc", icon: "🎬", bg: "from-red-400 to-orange-700", mascot: "🎥" },
};

export default function AdventureJourney({ storySlug, slots }: Props) {
  const { t } = useLanguage();
  const done = slots.filter(s => s.completed).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <p className="font-black text-ds-text text-sm sm:text-base uppercase tracking-wider">
          ⭐ Complete all 6 steps to earn your Story Certificate! ⭐
        </p>
      </div>

      {/* 6 Mission Cards — horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide lg:grid lg:grid-cols-6 lg:overflow-visible">
        {slots.map((slot, i) => {
          const meta = MISSION_META[slot.slot_key];
          const m = meta ? { name: t(meta.nameKey), desc: t(meta.descKey), icon: meta.icon, bg: meta.bg, mascot: meta.mascot } : { name: slot.slot_key, desc: "", icon: "📌", bg: "from-gray-500 to-gray-700", mascot: "📌" };
          const isNext = !slot.completed && (i === 0 || slots[i - 1]?.completed);
          const isLocked = !slot.completed && !isNext;

          const card = (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={!isLocked ? { y: -6, scale: 1.03 } : undefined}
              className={`relative leaf overflow-hidden border-2 flex flex-col min-w-[140px] sm:min-w-[150px] lg:min-w-0 shadow-xl transition-all ${
                slot.completed
                  ? "border-[var(--ds-border-brand)]/40 bg-[var(--ds-surface-card)]"
                  : isNext
                    ? "border-yellow-400/40 bg-[var(--ds-surface-card)] ring-2 ring-yellow-400/15"
                    : "border-ds-border bg-[var(--ds-surface-card)] opacity-50"
              }`}
            >
              {/* Background accent for active/next */}
              {isNext && (
                <div className={`absolute inset-0 bg-gradient-to-b ${m.bg} opacity-5`} />
              )}
              {slot.completed && (
                <div className="absolute inset-0 bg-[var(--ds-brand-primary)]/5" />
              )}

              {/* Number badge */}
              <div className="relative z-10 p-3 pb-0 flex items-center justify-between">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow ${
                  slot.completed ? "bg-[var(--ds-brand-primary)] text-[var(--ds-nav-bg)]"
                    : isNext ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                    : "bg-[var(--ds-surface-card-hover)] text-[var(--ds-text-tertiary)]"
                }`}>
                  {i + 1}
                </div>
                {isNext && (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
                    className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/40">
                    <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                  </motion.div>
                )}
              </div>

              {/* Icon + Mascot area */}
              <div className="relative z-10 flex items-center justify-center py-3 px-2">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-ds-border ${
                  slot.completed ? "bg-[var(--ds-brand-subtle)]"
                    : isLocked ? "bg-[var(--ds-surface-card-hover)]"
                    : `bg-gradient-to-br ${m.bg} bg-opacity-20`
                }`}>
                  {slot.completed ? <CheckCircle2 className="w-8 h-8 text-[var(--ds-brand-primary)]" /> :
                   isLocked ? <Lock className="w-6 h-6 text-[var(--ds-text-tertiary)]" /> :
                   <span className="drop-shadow-lg">{m.icon}</span>}
                </div>
              </div>

              {/* Text */}
              <div className="relative z-10 px-3 pb-2 text-center flex-1">
                <p className={`font-black text-2xs leading-tight whitespace-pre-line ${
                  slot.completed ? "text-[var(--ds-brand-primary)]" : isNext ? "text-ds-text" : "text-[var(--ds-text-tertiary)]"
                }`}>
                  {m.name}
                </p>
                {!isLocked && (
                  <p className={`text-5xs mt-1 leading-snug ${
                    slot.completed ? "text-[var(--ds-text-tertiary)]" : "text-[var(--ds-text-secondary)]"
                  }`}>
                    {m.desc}
                  </p>
                )}
              </div>

              {/* Status button */}
              <div className="relative z-10 px-3 pb-3">
                {slot.completed ? (
                  <div className="bg-[var(--ds-brand-primary)] text-[var(--ds-nav-bg)] text-4xs font-black py-1.5 rounded-lg text-center shadow-lg">
                    ✓ COMPLETED
                  </div>
                ) : isNext ? (
                  <motion.div animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-4xs font-black py-1.5 rounded-lg text-center shadow-lg shadow-orange-500/25">
                    ▶ START
                  </motion.div>
                ) : (
                  <div className="bg-[var(--ds-surface-card-hover)] text-[var(--ds-text-tertiary)] text-4xs font-bold py-1.5 rounded-lg text-center border border-ds-border">
                    🔒 LOCKED
                  </div>
                )}
              </div>
            </motion.div>
          );

          return isLocked ? (
            <div key={slot.slot_key}>{card}</div>
          ) : (
            <Link key={slot.slot_key} href={`/stories/${storySlug}/mission/${slot.slot_key}`} className="contents">
              {card}
            </Link>
          );
        })}
      </div>

      {/* Arrow connectors (desktop only) */}
      <div className="hidden lg:flex items-center justify-center gap-1 -mt-2">
        {slots.map((slot, i) => (
          i < slots.length - 1 && (
            <div key={i} className="flex items-center">
              <div className="w-12" />
              <ChevronRight className={`w-4 h-4 ${slot.completed ? "text-[var(--ds-brand-primary)]/50" : "text-gray-200"}`} />
              <div className="w-12" />
            </div>
          )
        ))}
      </div>
    </div>
  );
}
