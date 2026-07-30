"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { ChildAchievement } from "@/lib/queries";
import { useLanguage } from "@/contexts/LanguageContext";

interface BadgeDisplay {
  emoji: string;
  label: string;
  bg: string;       // Tailwind bg class
  text: string;     // Tailwind text class
  ring: string;     // Tailwind ring/border class
}

const CAT_BADGE_DISPLAY: Record<string, BadgeDisplay> = {
  morning:   { emoji: "🎵", label: "Music Master",   bg: "bg-pink-100",   text: "text-pink-600",   ring: "border-pink-200" },
  movement:  { emoji: "🤸", label: "Move Champion",  bg: "bg-red-100",    text: "text-red-500",    ring: "border-red-200" },
  artistic:  { emoji: "🎨", label: "Art Star",       bg: "bg-amber-100",  text: "text-amber-600",  ring: "border-amber-200" },
  histoire:  { emoji: "📖", label: "Story Master",   bg: "bg-sky-100",    text: "text-sky-600",    ring: "border-sky-200" },
  zoom:      { emoji: "🔍", label: "Zoom Explorer",  bg: "bg-emerald-100",text: "text-emerald-600",ring: "border-emerald-200" },
  discovery: { emoji: "🌍", label: "Discoverer",     bg: "bg-cyan-100",   text: "text-cyan-600",   ring: "border-cyan-200" },
  flipflop:  { emoji: "🎧", label: "Audio Legend",   bg: "bg-violet-100", text: "text-violet-600", ring: "border-violet-200" },
  coloring:  { emoji: "🦋", label: "Color Expert",   bg: "bg-fuchsia-100",text: "text-fuchsia-600",ring: "border-fuchsia-200" },
};

const LOCKED_PLACEHOLDERS: BadgeDisplay[] = [
  { emoji: "🎨", label: "Art Star",    bg: "bg-[var(--ds-surface-card-hover)]", text: "text-[var(--ds-text-tertiary)]", ring: "border-[var(--ds-border-primary)]" },
  { emoji: "🧩", label: "Puzzle Pro",  bg: "bg-[var(--ds-surface-card-hover)]", text: "text-[var(--ds-text-tertiary)]", ring: "border-[var(--ds-border-primary)]" },
  { emoji: "🔥", label: "Streak Hero", bg: "bg-[var(--ds-surface-card-hover)]", text: "text-[var(--ds-text-tertiary)]", ring: "border-[var(--ds-border-primary)]" },
];

function parseBadgeSlug(slug: string): BadgeDisplay {
  if (slug.startsWith("trilingual-story-"))
    return { emoji: "🌐", label: "Trilingual!", bg: "bg-teal-100", text: "text-teal-600", ring: "border-teal-200" };
  if (slug.startsWith("story-streak-")) {
    const n = slug.split("-")[2] ?? "5";
    return { emoji: "🔥", label: `${n}-Story Streak`, bg: "bg-orange-100", text: "text-orange-600", ring: "border-orange-200" };
  }
  if (slug.startsWith("story-") && slug.includes("-complete-"))
    return { emoji: "📚", label: "Story Complete", bg: "bg-indigo-100", text: "text-indigo-600", ring: "border-indigo-200" };
  if (slug.startsWith("level-") && slug.includes("-complete-")) {
    const n = slug.split("-")[1] ?? "1";
    return { emoji: "⭐", label: `Level ${n} Champ`, bg: "bg-amber-100", text: "text-amber-600", ring: "border-amber-200" };
  }
  const cat = slug.split("-")[0] ?? "";
  return CAT_BADGE_DISPLAY[cat] ?? { emoji: "🏅", label: "Achievement", bg: "bg-violet-100", text: "text-violet-600", ring: "border-violet-200" };
}

interface Props {
  achievements: ChildAchievement[];
}

export default function HomeAchievementsPanel({ achievements }: Props) {
  const { t } = useLanguage();
  const earned = achievements.slice(-3).reverse();

  return (
    <div className="overflow-hidden leaf-lg border border-[var(--ds-border-primary)] bg-[var(--ds-surface-card)] shadow-card-md">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shadow-sm shrink-0">
            🏆
          </div>
          <div>
            <p className="font-nunito text-amber-500 text-3xs uppercase tracking-widest leading-none mb-0.5">
              {t("homeTrophyRoomEyebrow")}
            </p>
            <h3 className="font-baloo font-black text-[var(--ds-text-primary)] text-mlg leading-tight">
              {t("homeMyTreasuresTitle")}
            </h3>
          </div>
        </div>
        <Link href="/user-profile"
          className="flex items-center gap-0.5 font-nunito font-bold text-amber-500 text-2xs hover:text-amber-600 transition-colors">
          {t("homeViewAllBadges")} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="h-px bg-[var(--ds-surface-card-hover)] mx-4" />

      {/* Badges grid */}
      <div className="px-4 py-5">
        <div className="flex justify-around gap-3">
          {Array.from({ length: 3 }).map((_, i) => {
            const ach      = earned[i];
            const badge    = ach ? parseBadgeSlug(ach.slug) : LOCKED_PLACEHOLDERS[i] ?? LOCKED_PLACEHOLDERS[0];
            const isEarned = !!ach;
            return (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div className="relative">
                  <motion.div
                    className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-4xl border-2 ${badge.bg} ${badge.ring}`}
                    animate={isEarned ? { scale: [1, 1.05, 1] } : undefined}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}>
                    {isEarned ? badge.emoji : <span className="text-3.5xl opacity-30">🔒</span>}
                  </motion.div>

                  {/* Earned check */}
                  {isEarned && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-3xs font-black shadow-md">
                      ✓
                    </div>
                  )}
                </div>

                <p className={`font-nunito font-bold text-3xs text-center leading-tight ${
                  isEarned ? badge.text : "text-[var(--ds-text-tertiary)]"
                }`}>
                  {isEarned ? badge.label : "Locked"}
                </p>
              </div>
            );
          })}
        </div>

        {earned.length === 0 && (
          <p className="text-center font-nunito text-[var(--ds-text-tertiary)] text-2xs mt-3">
            Complete missions to unlock badges ✨
          </p>
        )}
      </div>
    </div>
  );
}
