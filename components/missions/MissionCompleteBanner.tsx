"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import { useAppTheme } from "@/contexts/AppThemeProvider";
import { getThemeAssets } from "@/lib/design-system/assetRegistry";
import { playCelebration } from "@/lib/sounds";
import Link from "next/link";
import { SPRING, DURATION, EASE } from "@/lib/design-system/motion";
import RewardBurst from "@/components/delight/RewardBurst";
import AnimatedCheckmark from "@/components/delight/AnimatedCheckmark";
import { CONFETTI_BURST } from "@/lib/design-system/delight";

interface Props {
  storySlug?: string;
}

export default function MissionCompleteBanner({ storySlug }: Props) {
  const { t } = useLanguage();
  const { themeId } = useAppTheme();
  const assets = getThemeAssets(themeId);
  useEffect(() => { playCelebration(); }, []);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={SPRING.modal}
      className="relative overflow-hidden leaf-lg border p-6 text-center shadow-card-2xl"
      style={{
        background: 'linear-gradient(135deg, #06101F 0%, #0d1e3a 60%, #09152a 100%)',
        borderColor: 'rgba(201,168,76,0.45)',
      }}
    >
      <Image src={assets.rewards.celebration} alt="" aria-hidden="true" fill
        className="object-cover pointer-events-none opacity-[0.04]" />

      <RewardBurst active config={CONFETTI_BURST} className="absolute inset-0" />

      <div className="relative z-10">
        {/* Airways eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="font-nunito font-black text-3xs uppercase tracking-widest mb-2"
          style={{ color: 'rgba(201,168,76,0.85)' }}
        >
          <span aria-hidden="true">✈️ </span>NIMIPIKO AIRWAYS · STOP COMPLETE
        </motion.p>

        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ ...SPRING.gentle, delay: 0.2 }}
          className="relative w-14 h-14 mx-auto mb-2"
        >
          <Image src={assets.starMascot} alt="" width={56} height={56} className="w-14 h-14" />
          <Image src={assets.rewards.badgeFrame} alt="" aria-hidden="true" fill
            className="pointer-events-none opacity-60" />
        </motion.div>

        <motion.p
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
          className="font-baloo font-black text-3xl sm:text-4xl leading-none"
          style={{ color: '#F5C842' }}
        >
          YOU DID IT! 🎉
        </motion.p>

        <AnimatedCheckmark className="mx-auto my-2" />

        <motion.p
          initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: DURATION.base, ease: EASE.enter }}
          className="font-baloo font-black text-xl text-white"
        >
          {t("storyMissionCompleteTitle")}
        </motion.p>

        {/* 3-star animated reveal */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          aria-hidden="true"
          className="flex items-center justify-center gap-3 my-3"
        >
          {[0, 1, 2].map(i => (
            <motion.span key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 16, delay: 0.55 + i * 0.18 }}
              className="text-4xl leading-none select-none"
            >
              ⭐
            </motion.span>
          ))}
        </motion.div>

        <motion.p
          initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: DURATION.base, ease: EASE.enter }}
          className="font-nunito text-white/70 text-sm"
        >
          {t("storyMissionCompleteDesc")}
        </motion.p>

        {storySlug && (
          <motion.div
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: DURATION.base, ease: EASE.enter }}
          >
            <Link
              href={`/stories/${storySlug}`}
              className="inline-flex items-center gap-2 mt-4 font-baloo font-black text-base rounded-full px-7 py-3.5 min-h-[48px] shadow-lg transition hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: '#C9A84C', color: '#06101F' }}
            >
              ✈️ Return to My Flight
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
