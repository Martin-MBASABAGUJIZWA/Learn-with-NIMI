"use client";

import { motion } from "framer-motion";
import { useAppTheme } from "@/contexts/AppThemeProvider";
import { getThemeAssets } from "@/lib/design-system/assetRegistry";
import { SPRING } from "@/lib/design-system/motion";
import { useThemeMotion } from "@/hooks/useThemeMotion";

// Airways-toned reactions — warm, playful, child-friendly flight-guide persona.
// Deterministic: only reactions[0] is used (stable across re-mounts).
const REACTIONS: Record<string, string[]> = {
  story:       ["Great listening, traveler! 🎧✈️", "You followed every word! 📚", "What a journey! 🌟"],
  read:        ["You read the whole stop! 📖✈️", "Incredible reading, explorer! 🌟", "Look at you go, bookworm! 📚"],
  color:       ["Beautiful work, little traveler! 🎨✈️", "What amazing colors you chose! ✨", "You're a real artist! 🖌️"],
  move:        ["Wonderful moves, superstar! 🕺✈️", "Your flight energy is amazing! 💪", "Look at those awesome moves! 🤸"],
  sing:        ["What a voice, superstar traveler! 🎵✈️", "Beautiful singing! 🎶", "You're a superstar! ⭐"],
  watch:       ["You watched it all the way through! 🎬✈️", "Great job paying attention! 👀", "Movie champion! 🍿"],
  destination: ["You discovered this stop! Great exploring! ✨✈️", "Your curiosity made this stop wonderful! 🌍", "Wonderful exploring! 🌟"],
  challenge:   ["You tackled the challenge stop! Amazing! 🏆✈️", "What a champion you are! 🌟", "Incredible effort! ⭐"],
};

interface NimiReactionProps {
  missionType: string;
}

export default function NimiReaction({ missionType }: NimiReactionProps) {
  const { themeId } = useAppTheme();
  const assets = getThemeAssets(themeId);
  const m = useThemeMotion();
  const reactions = REACTIONS[missionType] ?? REACTIONS.story;
  const reaction = reactions[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...SPRING.card, delay: 0.1 }}
      className="flex items-center gap-3"
    >
      <motion.img
        src={assets.nimiCircle}
        alt="Nimi"
        animate={m.reduced ? {} : { y: [0, -5, 0] }}
        transition={m.reduced ? {} : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-14 h-14 rounded-full border-4 shadow-lg flex-shrink-0"
        style={{ borderColor: '#C9A84C' }}
      />
      <div
        className="relative flex-1 leaf px-4 py-3 shadow-sm border"
        style={{
          borderColor: 'rgba(201,168,76,0.5)',
          background: 'rgba(201,168,76,0.09)',
        }}
      >
        {/* Speech tail */}
        <div
          className="absolute left-[-6px] top-[14px] w-3 h-3 rotate-45 border-l border-b"
          style={{
            borderColor: 'rgba(201,168,76,0.5)',
            backgroundColor: 'rgba(201,168,76,0.09)',
          }}
        />
        {/* Airways eyebrow */}
        <p
          className="font-nunito font-black text-3xs uppercase tracking-widest mb-1"
          style={{ color: 'rgba(201,168,76,0.75)' }}
          aria-hidden="true"
        >
          <span>✈️ </span>Nimi says
        </p>
        <p className="font-baloo font-black text-mbase text-[var(--ds-text-primary)] leading-snug">
          {reaction}
        </p>
      </div>
    </motion.div>
  );
}
