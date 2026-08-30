"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Crown } from "lucide-react";
import { getStorageUrl } from "@/lib/queries";
import type { StoryLibraryItem, StorySlot } from "@/lib/story-types";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  curStory:          StoryLibraryItem | undefined;
  slots:             StorySlot[];
  pct:               number;
  hasSubscription?:  boolean;
  nextPremiumStory?: StoryLibraryItem | null;
}

export default function HomeStoryJourneyPanel({ curStory, slots, pct, hasSubscription, nextPremiumStory }: Props) {
  const { t } = useLanguage();
  const done  = slots.filter(s => s.completed).length;
  const total = slots.length || 6;
  const showPremiumUpsell = !!nextPremiumStory && !hasSubscription && (!curStory || curStory.complete);

  return (
    <div className="overflow-hidden leaf-lg border border-[var(--ds-border-primary)] bg-[var(--ds-surface-card)] shadow-card-md">

      {/* Green accent header strip */}
      <div
        className="px-4 pt-3.5 pb-3"
        style={{ background: "linear-gradient(135deg,var(--ds-brand-primary),var(--ds-brand-hover))" }}
      >
        <p className="font-nunito font-bold text-white/80 text-3xs uppercase tracking-widest leading-none mb-0.5">
          🎯 Today&apos;s Mission
        </p>
        <h3 className="font-baloo font-black text-white text-mlg leading-tight">
          {t("journeyTitle")}
        </h3>
      </div>

      {/* Body */}
      <div className="px-4 py-3.5 flex flex-col gap-3">

        {!curStory && !showPremiumUpsell ? (
          /* Empty state */
          <div className="flex flex-col items-center py-3 gap-2 text-center">
            <motion.span aria-hidden="true" className="text-4xl leading-none"
              animate={{ y: [0,-6,0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              🔭
            </motion.span>
            <p className="font-nunito text-[var(--ds-text-tertiary)] text-xs">{t("journeyChooseStory")}</p>
          </div>
        ) : curStory ? (
          <>
            {/* Story cover + info row */}
            <div className="flex items-center gap-3">
              {/* Larger cover thumbnail */}
              {curStory.cover_url ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-md border border-[var(--ds-border-primary)]">
                  <Image src={getStorageUrl(curStory.cover_url)} alt={curStory.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-[var(--ds-brand-subtle)] border border-[var(--ds-border-brand)]/30">
                  {curStory.theme_emoji ?? "📖"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-baloo font-black text-[var(--ds-text-primary)] text-sm leading-tight line-clamp-2">
                  {curStory.title}
                </p>
                <p className="font-nunito font-bold text-[var(--ds-text-brand)] text-2xs mt-0.5">
                  {curStory.complete
                    ? "✓ " + t("journeyCompleted")
                    : t("journeyMissionsOf").replace("{done}", String(done)).replace("{total}", String(total))}
                </p>
              </div>
            </div>

            {/* Mission progress dots */}
            {slots.length > 0 && !curStory.complete && (
              <div className="flex gap-1.5">
                {slots.map((slot, i) => (
                  <motion.div
                    key={slot.slot_key}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.06, ease: "easeOut" }}
                    className={`flex-1 h-2 rounded-full origin-left ${
                      slot.completed
                        ? "bg-[var(--ds-brand-primary)]"
                        : "bg-[var(--ds-surface-card-hover)]"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Progress percentage */}
            {!curStory.complete && (
              <p className="font-nunito text-[var(--ds-text-tertiary)] text-3xs text-right -mt-1.5">
                {pct}{t("journeyPctComplete")}
              </p>
            )}
          </>
        ) : null}

        {/* CTA */}
        {showPremiumUpsell ? (
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full font-baloo font-black text-white text-sml py-3 rounded-xl shadow-md hover:-translate-y-0.5 active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" }}
          >
            <Crown className="w-3.5 h-3.5 text-yellow-300" />
            Unlock next story
          </Link>
        ) : curStory && !curStory.complete ? (
          <Link
            href={`/stories/${curStory.slug}`}
            className="flex items-center justify-center gap-2 w-full font-baloo font-black text-sml py-3 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95"
            style={{
              background: "linear-gradient(135deg,var(--ds-brand-primary),var(--ds-brand-hover))",
              color: "var(--ds-nav-bg)",
              boxShadow: "var(--ds-shadow-cta)",
            }}
          >
            <Play className="w-4 h-4 fill-current" />
            {t("storyStatusContinue")}
          </Link>
        ) : !curStory ? (
          <Link
            href="/stories"
            className="flex items-center justify-center gap-2 w-full font-baloo font-black text-sml py-3 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95"
            style={{
              background: "linear-gradient(135deg,var(--ds-brand-primary),var(--ds-brand-hover))",
              color: "var(--ds-nav-bg)",
              boxShadow: "var(--ds-shadow-cta)",
            }}
          >
            <Play className="w-4 h-4 fill-current" />
            {t("homeAdventureStartJourney")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
