"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Trophy, Star, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DURATION, SPRING } from "@/lib/design-system/motion";
import { useThemeMotion } from "@/hooks/useThemeMotion";
import type { ChildBadge } from "@/lib/queries";
import { MILESTONE_BADGES } from "@/lib/milestoneBadges";
import BadgeCircle from "@/components/stories/BadgeCircle";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

interface Props {
  weekStreak: boolean[];
  streakCount: number;
  badges: ChildBadge[];
  badgeImageMap?: Record<string, string>;
  todayStars: number;
  activitiesCompleted: number;
}

export default function StatsSidebar({
  weekStreak,
  streakCount,
  badges,
  badgeImageMap = {},
  todayStars,
  activitiesCompleted,
}: Props) {
  const { t } = useLanguage();
  const m = useThemeMotion();
  const certProgress = Math.min(100, (activitiesCompleted / 8) * 100);
  const hasStreak = streakCount > 0;
  const hasStars = todayStars > 0;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Streak card ── */}
      <div className="bg-[var(--ds-surface-card)] border border-[var(--ds-border-primary)] p-4"
        style={{ borderRadius: "var(--leaf-r)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <motion.span className="text-2xl leading-none"
            animate={hasStreak
              ? { y: [0, -5, 0], rotate: [-8, 8, -4, 0] }
              : { y: [0, -2, 0] }}
            transition={{ duration: hasStreak ? DURATION.loopFast : DURATION.loopSlow, repeat: Infinity }}>
            🔥
          </motion.span>
          <h3 className="font-baloo font-black text-[var(--ds-text-primary)] text-sm tracking-wide">
            {t("dayStreak").replace("{count}", String(streakCount))}
          </h3>
          {streakCount >= 7 && (
            <motion.span className="text-sm" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING.bounce}>
              🏆
            </motion.span>
          )}
        </div>

        {/* Week dots */}
        <div className="flex items-center justify-between px-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-[var(--ds-text-tertiary)]">{label}</span>
              <motion.div
                initial={{ scale: 0.7 }}
                animate={{ scale: weekStreak[i] ? 1 : 0.88 }}
                transition={SPRING.soft}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  weekStreak[i]
                    ? "bg-orange-500 border-orange-300 text-white shadow-md"
                    : "bg-[var(--ds-surface-card-active)] border-[var(--ds-border-primary)] text-[var(--ds-text-tertiary)]"
                }`}>
                {weekStreak[i]
                  ? <Check className="w-4 h-4" strokeWidth={3} />
                  : <span className="w-2 h-2 rounded-full bg-[var(--ds-border-primary)] block" />}
              </motion.div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-[var(--ds-text-tertiary)] text-center mt-3 leading-snug">
          {streakCount === 0
            ? "Complete a lesson today to start your streak! 🌱"
            : streakCount < 3
            ? "Nice start! Keep coming back! 👏"
            : streakCount < 7
            ? "You're on fire! Don't break the chain! 🔥"
            : streakCount < 14
            ? "Amazing dedication! You're unstoppable! 🚀"
            : "Legendary streak! You're a true champion! 🏆"}
        </p>
      </div>

      {/* ── Badges preview ── */}
      <div className="bg-[var(--ds-surface-card)] border border-[var(--ds-border-primary)] p-4"
        style={{ borderRadius: "var(--leaf-r)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-baloo font-black text-[var(--ds-text-primary)] text-sm">{t("myBadges")}</h3>
          <Link href="/user-profile" className="text-xs font-bold text-[var(--ds-brand-primary)] hover:underline">
            {t("viewAll")}
          </Link>
        </div>

        {badges.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-3 mb-3">
            {badges.slice(0, 6).map((b, i) => (
              <motion.div key={b.badge_slug}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ filter: "brightness(1.1) saturate(1.25)" }}
                transition={{ ...SPRING.bounce, delay: i * DURATION.fast }}
                whileHover={{ scale: 1.2, rotate: 8, filter: "drop-shadow(0 0 10px rgba(245,200,66,0.9)) brightness(1.2) saturate(1.4)" }}
                whileTap={{ scale: 0.94 }}
                className="cursor-default">
                <BadgeCircle slug={b.badge_slug} size="md" imageUrl={badgeImageMap?.[b.badge_slug]} />
              </motion.div>
            ))}
            {badges.length > 6 && (
              <div className="w-16 h-16 rounded-full bg-[var(--ds-surface-card-active)] border-2 border-dashed border-[var(--ds-border-primary)] flex items-center justify-center">
                <span className="text-xs font-black text-[var(--ds-text-tertiary)]">+{badges.length - 6}</span>
              </div>
            )}
          </div>
        ) : (
          /* Ghost milestone slots */
          <div className="flex items-center justify-center gap-3 mb-3">
            {MILESTONE_BADGES.slice(0, 4).map((badge, i) => (
              <motion.div key={badge.slug}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 0.9, opacity: 1 }}
                transition={{ ...SPRING.bounce, delay: i * DURATION.fast }}
                whileHover={{ scale: 1.06 }}
                title={`🔒 ${badge.desc}`}
                className="w-14 h-14 rounded-full bg-[var(--ds-surface-card-active)] flex items-center justify-center cursor-default relative">
                <span className="grayscale opacity-20 select-none text-2xl">{badge.emoji}</span>
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: DURATION.loopBase, repeat: Infinity, delay: i * 0.3 }}
                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--ds-surface-card)] border border-[var(--ds-border-primary)] shadow flex items-center justify-center">
                  <Lock className="w-2.5 h-2.5 text-[var(--ds-text-tertiary)]" />
                </motion.span>
              </motion.div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-[var(--ds-text-tertiary)] text-center leading-snug font-nunito">
          {badges.length > 0
            ? t("badgesEarned").replace("{count}", String(badges.length))
            : t("noBadgesYet")}
        </p>
      </div>

      {/* ── Certificate teaser ── */}
      <Link href="/certificates">
        <motion.div
          whileHover={{ y: m.hoverLift, boxShadow: "0 8px 28px rgba(34,197,94,0.18)" }}
          whileTap={m.buttonPress}
          className="relative overflow-hidden cursor-pointer"
          style={{
            borderRadius: "var(--leaf-r)",
            background: "var(--ds-surface-card)",
            border: "1px solid var(--ds-border-primary)",
            borderLeft: "4px solid #22C55E",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Left: content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <motion.span className="text-lg leading-none"
                    animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: DURATION.loopBase, repeat: Infinity }}>
                    🏆
                  </motion.span>
                  <h3 className="font-baloo font-black text-[var(--ds-text-primary)] text-sm">{t("certificateTeaserTitle")}</h3>
                </div>
                <p className="text-[10px] text-[var(--ds-text-tertiary)] leading-snug mb-2.5">{t("certificateTeaserBody")}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-[var(--ds-surface-card-active)] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #22C55E, #16A34A)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${certProgress}%` }}
                      transition={{ duration: DURATION.loopBounce }}
                    />
                  </div>
                  <span className="text-xs font-baloo font-black text-[#16A34A] shrink-0">{activitiesCompleted}/8</span>
                </div>
                {certProgress >= 100 && (
                  <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-bold text-green-600 mt-1.5 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> Ready to claim! ✨
                  </motion.p>
                )}
              </div>
              {/* Right: certificate visual */}
              <div className="shrink-0 flex flex-col items-center justify-center"
                style={{ width: 52, height: 56, borderRadius: 10, background: "linear-gradient(145deg, #F0FDF4, #DCFCE7)", border: "1.5px solid #BBF7D0" }}>
                <span className="text-2xl leading-none">📜</span>
                <span className="text-[9px] font-baloo font-black text-green-700 mt-0.5 leading-none">CERT</span>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>

      {/* ── Today's stars ── */}
      <div className="relative overflow-hidden p-4 text-center"
        style={{
          borderRadius: "var(--leaf-r)",
          background: "linear-gradient(145deg, #FFF9E6 0%, #FFF3C4 55%, #FFEAA0 100%)",
          border: "1.5px solid #F5C842",
          boxShadow: "0 4px 16px rgba(245,200,66,0.22)",
          minHeight: 130,
        }}>

        {/* Sparkle decorations */}
        {[
          { top: 8,  left: 8,   rotate: 0  },
          { top: 8,  right: 8,  rotate: 45 },
          { bottom: 32, left: 10, rotate: 15 },
        ].map((pos, i) => (
          <motion.span key={i}
            className="absolute pointer-events-none select-none font-black"
            style={{ fontSize: 14, color: "#F472B6", top: pos.top, left: (pos as {left?:number}).left, right: (pos as {right?:number}).right, bottom: pos.bottom, rotate: pos.rotate }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
            aria-hidden>✦</motion.span>
        ))}

        {/* Nimi bottom-right */}
        <img
          src="/themes/default/characters/nimi.png"
          alt="" aria-hidden draggable={false}
          className="absolute bottom-0 right-0 pointer-events-none select-none"
          style={{ height: 70, width: "auto", objectFit: "contain",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.14))", opacity: 0.95 }}
        />

        <p className="font-baloo font-black text-gray-700 text-xs mb-1 relative z-10">
          {t("todayStarsLabel")}
        </p>

        <motion.div
          key={todayStars}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING.bounce}
          className="flex items-center justify-center gap-1.5 relative z-10">
          <motion.span className="text-4xl leading-none"
            animate={hasStars ? { rotate: [0, -12, 12, 0], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: hasStars ? Infinity : 0, repeatDelay: 2 }}>
            ⭐
          </motion.span>
          <span className="font-baloo font-black leading-none"
            style={{ fontSize: "clamp(2rem, 5vw, 2.6rem)", color: "#B45309",
              textShadow: "0 2px 10px rgba(180,83,9,0.25)" }}>
            {todayStars}
          </span>
        </motion.div>

        {hasStars ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="text-[10px] font-nunito font-bold mt-1 relative z-10"
            style={{ color: "#166534" }}>
            Amazing work! Keep going! 🎉
          </motion.p>
        ) : (
          <p className="text-[10px] mt-1 leading-snug relative z-10 font-nunito" style={{ color: "#92400E" }}>
            {t("keepLearningStars")}
          </p>
        )}
      </div>
    </div>
  );
}
