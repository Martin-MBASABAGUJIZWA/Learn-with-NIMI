"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useAppTheme } from "@/contexts/AppThemeProvider";
import { getThemeAssets } from "@/lib/design-system/assetRegistry";

export default function NimiAssistant({ mood = "happy", phrase = "" }) {
  const { themeId } = useAppTheme();
  const assets = getThemeAssets(themeId);

  const moodImage: Record<string, string> = {
    happy:       assets.nimiHappy,
    sad:         assets.nimiSad,
    locked:      assets.nimiLocked,
    celebration: assets.nimiCelebration,
  };

  const src = moodImage[mood] ?? assets.nimiHappy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-3 bg-[var(--ds-surface-card)] rounded-xl shadow p-3 max-w-xs"
    >
      <Image
        src={src}
        alt={mood}
        width={50}
        height={50}
        className="rounded-full"
      />
      <p className="text-[var(--ds-text-primary)] font-medium">{phrase}</p>
    </motion.div>
  );
}
