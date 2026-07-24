"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  weekStreak: boolean[];
  consecutiveStreak: number;
  totalStars: number;
  streakBroke?: boolean;
}

const DAYS = ["M","T","W","T","F","S","S"];

export default function HomeWeekStreakPanel({ weekStreak, consecutiveStreak, totalStars, streakBroke = false }: Props) {
  const { t } = useLanguage();
  const todayRaw = new Date().getDay();
  const todayIdx = todayRaw === 0 ? 6 : todayRaw - 1;

  const isBroke  = streakBroke && consecutiveStreak === 0;
  const hasStreak = consecutiveStreak > 0;

  const message = isBroke              ? t("homeStreakBroke") :
    consecutiveStreak >= 7             ? t("homeStreakUnstoppable") :
    consecutiveStreak >= 3             ? t("homeStreakOnFire") :
    consecutiveStreak > 0              ? t("homeStreakKeepItUp") :
                                         t("homeStreakStart");

  /* Active colour — orange-red for fire streak, emerald for growth/broke, gray for zero */
  const noStreak   = !isBroke && consecutiveStreak === 0;
  const accentBg   = isBroke ? "bg-emerald-100" : noStreak ? "bg-gray-100" : "bg-orange-100";
  const accentText = isBroke ? "text-emerald-600" : noStreak ? "text-gray-500" : "text-orange-500";
  const eyebrow    = isBroke ? "text-emerald-500" : noStreak ? "text-gray-400" : "text-orange-400";
  const numColor   = isBroke ? "text-emerald-600" : noStreak ? "text-gray-400" : "text-orange-500";
  const dotDone    = isBroke ? "bg-emerald-400" : "bg-orange-400";
  const todayRing  = isBroke ? "border-emerald-300 bg-emerald-50" : "border-orange-300 bg-orange-50";

  const heading = isBroke          ? "Keep going!"     :
    consecutiveStreak >= 7         ? "Unstoppable! 🚀" :
    consecutiveStreak >= 3         ? "On Fire! 🔥"     :
    consecutiveStreak > 0          ? "Keep it up!"     :
                                     "Start today!";

  return (
    <div className="overflow-hidden leaf-lg border border-gray-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.07)]">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[20px] shadow-sm shrink-0 ${accentBg}`}>
            {isBroke ? "🌱" : noStreak ? "🔥" : "🔥"}
          </div>
          <div>
            <p className={`font-nunito text-[10px] uppercase tracking-widest leading-none mb-0.5 ${eyebrow}`}>
              {isBroke ? "Fresh start" : noStreak ? "Your streak" : "Daily streak"}
            </p>
            <h3 className="font-baloo font-black text-gray-900 text-[17px] leading-tight">
              {heading}
            </h3>
          </div>
        </div>

        {/* Stars pill */}
        <div className="flex items-center gap-1 bg-amber-50 rounded-full px-2.5 py-1 border border-amber-100">
          <span className="text-[12px] leading-none">⭐</span>
          <span className="font-baloo font-black text-amber-600 text-[13px] leading-none">{totalStars}</span>
        </div>
      </div>

      <div className="h-px bg-gray-100 mx-4" />

      {/* Big number + message — or empty-state prompt */}
      {noStreak ? (
        <div className="px-4 pt-3 pb-2 flex items-center gap-3">
          <motion.span className="text-[40px] leading-none"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
            🔥
          </motion.span>
          <div>
            <p className="font-baloo font-black text-gray-700 text-[14px] leading-tight">Build your streak!</p>
            <p className="font-nunito text-gray-400 text-[11px] mt-0.5">{message}</p>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-3 pb-2 flex items-end gap-3">
          <motion.span
            className={`font-baloo font-black leading-none ${numColor}`}
            style={{ fontSize: "clamp(44px,8vw,60px)" }}
            animate={hasStreak ? { scale: [1, 1.04, 1] } : undefined}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            {consecutiveStreak}
          </motion.span>
          <div className="pb-1.5">
            <p className="font-baloo font-black text-gray-400 text-[15px] leading-none">
              {consecutiveStreak === 1 ? t("homeStreakDayLabel") : t("homeStreakDaysLabel")}
            </p>
            <p className={`font-nunito font-semibold text-[11px] mt-0.5 leading-snug max-w-[130px] ${accentText}`}>
              {message}
            </p>
          </div>
        </div>
      )}

      {/* Week grid */}
      <div className="mx-3 mb-4 bg-gray-50 rounded-2xl px-3 py-3 border border-gray-100">
        <div className="flex justify-between gap-1">
          {DAYS.map((day, i) => {
            const done    = weekStreak[i] ?? false;
            const isToday = i === todayIdx;
            const future  = i > todayIdx;
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <motion.div
                  className={`w-full aspect-square max-w-[34px] rounded-full flex items-center justify-center text-[14px] transition-all duration-200 border ${
                    done    ? `${dotDone} border-transparent shadow-sm` :
                    isToday ? `border-2 ${todayRing}` :
                    future  ? "bg-white border-gray-100 opacity-40" :
                              "bg-white border-gray-200"
                  }`}
                  animate={done ? { scale: [1, 1.08, 1] } : undefined}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}>
                  {done    ? <span className="text-white text-[13px]">{isBroke ? "🌿" : "🔥"}</span> :
                   isToday ? <span className="font-black text-gray-400 text-[9px]">•</span> :
                             null}
                </motion.div>
                <span className={`font-nunito font-bold text-[9px] ${
                  done ? (isBroke ? "text-emerald-500" : "text-orange-400") :
                  isToday ? "text-gray-600" :
                  "text-gray-300"
                }`}>{day}</span>
              </div>
            );
          })}
        </div>

        {isBroke && (
          <p className="text-center font-nunito text-gray-400 text-[10px] mt-2.5 leading-snug">
            {t("homeStreakBrokeHint")}
          </p>
        )}
      </div>
    </div>
  );
}
