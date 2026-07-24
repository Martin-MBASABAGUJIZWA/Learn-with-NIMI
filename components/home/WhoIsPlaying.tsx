"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useThemeMotion } from "@/hooks/useThemeMotion";
import { SPRING, DURATION } from "@/lib/design-system/motion";
import { Settings, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Child } from "@/lib/queries";
import { useAppTheme } from "@/contexts/AppThemeProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import ChildAvatar from "@/components/avatar/ChildAvatar";
import { getThemeAssets } from "@/lib/design-system/assetRegistry";
import { getThemeEffects } from "@/lib/design-system/themeEffects";

const LANGUAGE_DISPLAY: Record<string, { flag: string; name: string }> = {
  en: { flag: "🇬🇧", name: "English" },
  fr: { flag: "🇫🇷", name: "Français" },
  rw: { flag: "🇷🇼", name: "Kinyarwanda" },
};

const AVATAR_COLORS = [
  "from-pink-400 to-rose-500",
  "from-green-500 to-emerald-600",
  "from-yellow-400 to-orange-500",
  "from-green-400 to-teal-500",
  "from-blue-400 to-cyan-500",
  "from-fuchsia-400 to-pink-500",
];

interface Props {
  children: Child[];
  onSelect: (child: Child) => void;
  onAddChild: () => void;
}

export default function WhoIsPlaying({ children, onSelect, onAddChild }: Props) {
  const router = useRouter();
  const { themeId, theme } = useAppTheme();
  const { t } = useLanguage();
  const assets = getThemeAssets(themeId);
  const effects = getThemeEffects(themeId);
  const m = useThemeMotion();

  // Stable positions — avoids position jitter on every re-render
  const sparkles = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      left: `${(i * 19 + 5) % 97}%`,
      top:  `${(i * 31 + 11) % 90}%`,
      color: effects.particles.colors[i % effects.particles.colors.length],
      duration: 2 + (i % 4) * 0.6,
      delay: (i * 0.28) % 2.2,
    })),
  [effects.particles.colors]);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${theme.gradients.pageBg} flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden`}>

      {/* Background sparkles */}
      {sparkles.map((s, i) => (
        <motion.div key={i}
          className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
          style={{ left: s.left, top: s.top, backgroundColor: s.color, opacity: 0.4 }}
          animate={{ opacity: [0.1, 0.6, 0.1], scale: [0.8, 1.4, 0.8] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay }}
        />
      ))}

      {/* NIMI logo */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: DURATION.slow }}
        className="flex items-center gap-3 mb-2"
      >
        <Image src={assets.nimiCircle} alt="NIMI" width={56} height={56}
          className="rounded-full border-3 border-yellow-300 shadow-xl" />
        <div>
          <p className="font-black text-3xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-yellow-200 to-cyan-300">
            NIMIPIKO
          </p>
          <p className="text-gray-500 text-[11px] font-semibold tracking-widest uppercase">
            {t("whoIsPlayingTagline")}
          </p>
        </div>
        <Image src={assets.pikoCircle} alt="PIKO" width={56} height={56}
          className="rounded-full border-3 border-blue-300 shadow-xl" />
      </motion.div>

      {/* Who's playing? */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.base, delay: 0.2 }}
        className="text-gray-900 text-2xl sm:text-3xl font-black mb-8 mt-4 tracking-wide text-center"
      >
        {t("whoIsPlayingToday")}
      </motion.p>

      {/* Child cards — only real children, no Add Child mixed in */}
      <div className={`grid gap-5 mb-6 ${
        children.length === 1 ? "grid-cols-1" :
        children.length === 2 ? "grid-cols-2" :
        children.length <= 4 ? "grid-cols-2 sm:grid-cols-2" :
        "grid-cols-2 sm:grid-cols-3"
      }`}>
        {children.map((child, idx) => {
          const lang = LANGUAGE_DISPLAY[child.language] ?? { flag: "🌍", name: child.language };
          return (
            <motion.button
              key={child.id}
              onClick={() => onSelect(child)}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...SPRING.gentle, delay: 0.1 * idx + 0.3 }}
              whileHover={m.cardHover}
              whileTap={m.dangerPress}
              className="flex flex-col items-center gap-3 group"
            >
              {/* Avatar circle */}
              <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center shadow-2xl border-4 border-white/50 group-hover:border-white transition-all overflow-hidden`}>
                <ChildAvatar avatarUrl={child.avatar_url} name={child.name} size={128} />
              </div>

              {/* Name badge */}
              <div className="bg-white shadow-sm px-5 py-1.5 rounded-full border border-ds-border">
                <p className="text-gray-900 font-black text-base sm:text-lg tracking-wide">
                  {child.name}
                </p>
              </div>

              {/* Language badge instead of fake stars */}
              <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-0.5 rounded-full border border-ds-border shadow-sm">
                <span className="text-[13px] leading-none">{lang.flag}</span>
                <span className="font-nunito font-semibold text-gray-500 text-[11px]">{lang.name}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Add new child — separated from the children grid */}
      <motion.button
        onClick={onAddChild}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.bounce, delay: 0.1 * children.length + 0.35 }}
        whileHover={m.cardHover}
        whileTap={m.dangerPress}
        className="flex items-center gap-2.5 mb-6 bg-white/80 hover:bg-white border border-dashed border-gray-300 hover:border-gray-400 shadow-sm rounded-full px-5 py-2.5 transition-all group"
      >
        <div className="w-7 h-7 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
          <Plus className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
        </div>
        <span className="font-baloo font-black text-gray-500 group-hover:text-gray-700 text-[14px] transition-colors">
          {t("whoAddChild")}
        </span>
      </motion.button>

      {/* Parent zone button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.base, delay: 0.8 }}
        onClick={() => router.push("/parents")}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-gray-50 border border-ds-border text-gray-500 hover:text-gray-700 text-xs font-semibold transition-all shadow-sm"
      >
        <Settings className="w-3.5 h-3.5" />
        {t("whoParentZone")}
      </motion.button>

      {/* NIMI + PIKO mascots — split to sides so they frame the center rather than covering it */}
      <motion.img
        src={`/themes/${themeId}/characters/nimi.png`}
        alt="" aria-hidden
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 0.85, y: [0, -8, 0] }}
        transition={{ opacity: { duration: 0.7, delay: 1.1 }, y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.1 } }}
        className="absolute bottom-0 left-2 sm:left-8 h-[110px] sm:h-[140px] w-auto object-contain drop-shadow-2xl pointer-events-none select-none"
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <motion.img
        src={`/themes/${themeId}/characters/piko.png`}
        alt="" aria-hidden
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 0.85, y: [0, -6, 0] }}
        transition={{ opacity: { duration: 0.7, delay: 1.3 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.3 } }}
        className="absolute bottom-0 right-2 sm:right-8 h-[95px] sm:h-[120px] w-auto object-contain drop-shadow-2xl pointer-events-none select-none"
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    </div>
  );
}
