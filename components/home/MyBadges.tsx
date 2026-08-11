"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ACTIVITIES } from "@/app/_activityData";
import { useLanguage } from "@/contexts/LanguageContext";

const BADGE_TITLES: Record<number, string> = {
  1: "Morning Star",
  2: "Movement Master",
  3: "Creative Artist",
  4: "History Explorer",
  5: "Zoom Detective",
  6: "Discovery Champ",
  7: "Story Reader",
  8: "Coloring Star",
};

const BADGE_MAP = ACTIVITIES.map(a => ({
  step: a.number,
  title: BADGE_TITLES[a.number] ?? a.titleKey,
  icon: a.emoji,
  bg: a.numBgGlass,
  href: a.href,
}));

interface Props {
  completedSteps: number[];
}

export default function MyBadges({ completedSteps }: Props) {
  const { t } = useLanguage();

  return (
    <div className="bg-[var(--ds-surface-card)] border border-ds-border shadow-ds-card p-4 flex flex-col h-full" style={{ borderRadius: 'var(--leaf-r)' }}>
      <h3 className="font-black text-ds-text text-xs mb-3 text-center tracking-wide">My Badges</h3>
      <div className="grid grid-cols-3 gap-2 flex-1">
        {BADGE_MAP.map(badge => {
          const earned = completedSteps.includes(badge.step);
          return (
            <div key={badge.title} className="flex flex-col items-center gap-1">
              {earned ? (
                <Link href={badge.href}>
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    className={`w-12 h-12 ${badge.bg} rounded-full flex items-center justify-center text-2xl shadow-md cursor-pointer`}>
                    {badge.icon}
                  </motion.div>
                </Link>
              ) : (
                <div className="w-12 h-12 bg-[var(--ds-surface-card-hover)] opacity-50 rounded-full flex items-center justify-center text-2xl relative">
                  {badge.icon}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                    <span className="text-sm">🔒</span>
                  </div>
                </div>
              )}
              <p className={`text-5xs text-center leading-tight font-semibold ${earned ? "text-ds-text" : "text-[var(--ds-text-tertiary)]"}`}>
                {badge.title}
              </p>
              <span className={`text-xs leading-none ${earned ? "text-yellow-500" : "text-[var(--ds-text-tertiary)]"}`}>⭐</span>
            </div>
          );
        })}
      </div>
      {completedSteps.length === 0 && (
        <p className="text-4xs text-[var(--ds-text-secondary)] text-center mt-2 leading-snug">
          Complete steps to earn badges!
        </p>
      )}
      <Link
        href="/certificates"
        className="block text-center text-3xs font-black text-[var(--ds-text-brand)] mt-2 pt-2 border-t border-ds-border hover:underline"
      >
        {t("viewAllAchievements")} →
      </Link>
    </div>
  );
}
