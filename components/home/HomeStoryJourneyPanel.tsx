"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Crown } from "lucide-react";
import { getStorageUrl } from "@/lib/queries";
import type { StoryLibraryItem, StorySlot } from "@/lib/story-types";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  curStory: StoryLibraryItem | undefined;
  slots: StorySlot[];
  pct: number;
  hasSubscription?: boolean;
  nextPremiumStory?: StoryLibraryItem | null;
}

export default function HomeStoryJourneyPanel({ curStory, slots, pct, hasSubscription, nextPremiumStory }: Props) {
  const { t } = useLanguage();
  const done  = slots.filter(s => s.completed).length;
  const total = slots.length;
  const showPremiumUpsell = !!nextPremiumStory && !hasSubscription && (!curStory || curStory.complete);

  return (
    <div className="overflow-hidden leaf-lg border border-[var(--ds-border-primary)] bg-[var(--ds-surface-card)] shadow-card-md">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--ds-brand-subtle)] flex items-center justify-center text-xl shadow-sm shrink-0">
            📖
          </div>
          <div>
            <p className="font-nunito text-[var(--ds-text-brand)] text-3xs uppercase tracking-widest leading-none mb-0.5">
              {t("journeyEyebrow")}
            </p>
            <h3 className="font-baloo font-black text-[var(--ds-text-primary)] text-mlg leading-tight">
              {t("journeyTitle")}
            </h3>
          </div>
        </div>
      </div>

      <div className="h-px bg-[var(--ds-surface-card-hover)] mx-4" />

      {/* Content */}
      <div className="px-4 py-3">
        {curStory ? (
          <>
            {/* Story cover + info */}
            <div className="flex items-center gap-3 mb-3">
              {curStory.cover_url ? (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md border border-[var(--ds-border-primary)]">
                  <Image src={getStorageUrl(curStory.cover_url)} alt={curStory.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-[var(--ds-brand-subtle)] border border-[var(--ds-border-brand)]/30">
                  {curStory.theme_emoji ?? "📖"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-baloo font-black text-[var(--ds-text-primary)] text-sm leading-tight line-clamp-2">
                  {curStory.title}
                </p>
                <p className="font-nunito text-[var(--ds-text-brand)] text-2xs mt-0.5">
                  {curStory.complete
                    ? "✓ " + t("journeyCompleted")
                    : t("journeyMissionsOf").replace("{done}", String(done)).replace("{total}", String(total || 6))}
                </p>
              </div>
            </div>

            {/* Mission progress dots */}
            {slots.length > 0 && (
              <div className="flex gap-1.5 mb-1.5">
                {slots.map((slot, i) => (
                  <motion.div key={slot.slot_key}
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.06, ease: "easeOut" }}
                    className={`flex-1 h-2 rounded-full origin-left ${
                      slot.completed ? "bg-[var(--ds-brand-primary)]" : "bg-[var(--ds-surface-card-hover)]"
                    }`} />
                ))}
              </div>
            )}

            {!curStory.complete && (
              <p className="font-nunito text-[var(--ds-text-tertiary)] text-3xs text-right mb-2">{pct}{t("journeyPctComplete")}</p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center py-4 mb-2 gap-1 text-center">
            <motion.span className="text-4xl leading-none"
              animate={{ y: [0,-6,0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>🔭</motion.span>
            <p className="font-nunito text-[var(--ds-text-tertiary)] text-xs mt-1">{t("journeyChooseStory")}</p>
          </div>
        )}

        {/* CTA — certificate is already in the hero, so skip it here when complete */}
        {showPremiumUpsell ? (
          <Link href="/pricing"
            className="flex items-center justify-center gap-2 w-full font-baloo font-black text-white text-sml py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 transition-all hover:-translate-y-0.5 active:scale-95 shadow-md shadow-violet-200">
            <Crown className="w-3.5 h-3.5 text-yellow-300" />
            Unlock next story
          </Link>
        ) : curStory && !curStory.complete ? (
          <Link href={`/stories/${curStory.slug}`}
            className="flex items-center justify-center gap-2 w-full font-baloo font-black text-sml py-2.5 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95"
            style={{ background: "linear-gradient(135deg,var(--ds-brand-primary),var(--ds-brand-hover))", color: "var(--ds-nav-bg)", boxShadow: "var(--ds-shadow-cta)" }}>
            <Play className="w-3.5 h-3.5 fill-current" />
            {t("storyStatusContinue")}
          </Link>
        ) : !curStory ? (
          <Link href="/stories"
            className="flex items-center justify-center gap-2 w-full font-baloo font-black text-sml py-2.5 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95"
            style={{ background: "linear-gradient(135deg,var(--ds-brand-primary),var(--ds-brand-hover))", color: "var(--ds-nav-bg)", boxShadow: "var(--ds-shadow-cta)" }}>
            <Play className="w-3.5 h-3.5 fill-current" />
            {t("homeAdventureStartJourney")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
