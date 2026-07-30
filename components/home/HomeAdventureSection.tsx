"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Play, ChevronRight, Crown } from "lucide-react";
import { getStorageUrl } from "@/lib/queries";
import type { StoryLibraryItem, StorySlot } from "@/lib/story-types";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  curStory: StoryLibraryItem | undefined;
  doneSlots: number;
  totalSlots: number;
  pct: number;
  slots: StorySlot[];
  up: Variants;
  stagger: Variants;
  hasSubscription?: boolean;
  nextPremiumStory?: StoryLibraryItem | null;
}

export default function HomeAdventureSection({ curStory, doneSlots, totalSlots, pct, slots, up, stagger, hasSubscription, nextPremiumStory }: Props) {
  const { t } = useLanguage();

  // Free user has finished all free stories — show the next premium story as a Club upsell
  const showPremiumUpsell = !!nextPremiumStory && !hasSubscription && (!curStory || curStory.complete);

  return (
    <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="relative">
      <motion.div variants={up}
        className="leaf-lg overflow-hidden border border-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">

        {showPremiumUpsell ? (
          /* ── Premium upsell: free user finished all free stories ── */
          <Link href="/pricing" className="block">
            <div className="relative overflow-hidden" style={{ aspectRatio: "16/7" }}>
              {nextPremiumStory.cover_url ? (
                <Image src={getStorageUrl(nextPremiumStory.cover_url)} alt={nextPremiumStory.title}
                  fill className="object-cover scale-105 blur-[2px] brightness-50" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#4c1d95,#5b21b6)" }}>
                  <span className="text-6.5xl opacity-30">{nextPremiumStory.theme_emoji ?? "📖"}</span>
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-900/50 border border-white/20">
                  <Crown className="w-8 h-8 text-yellow-300" />
                </motion.div>
                <div>
                  <p className="font-baloo font-black text-white text-xl sm:text-1.5xl leading-tight drop-shadow-lg">
                    🎉 You finished all free stories!
                  </p>
                  <p className="font-nunito text-white/75 text-sml mt-1">
                    Next up: <span className="font-bold text-white/90">{nextPremiumStory.title}</span> — Club exclusive
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-4 sm:px-5 py-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-baloo font-black text-white text-mbase leading-tight">Unlock with NIMIPIKO Club</p>
                <p className="text-purple-200 text-xs mt-0.5">All stories · Unlimited Nimi · Certificates</p>
              </div>
              <span className="shrink-0 bg-yellow-300 text-purple-900 font-black text-sml px-4 py-2 rounded-full shadow-lg">
                👑 Subscribe →
              </span>
            </div>
          </Link>
        ) : curStory ? (
          <>
            {/* Cover hero — full-bleed image with gradient overlay */}
            <Link href={`/stories/${curStory.slug}`} className="relative block w-full overflow-hidden group"
              style={{ aspectRatio: "16/7" }}>
              {curStory.cover_url ? (
                <Image src={getStorageUrl(curStory.cover_url)} alt={curStory.title} fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700" priority />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)" }}>
                  <span className="text-6.5xl">{curStory.theme_emoji ?? "📖"}</span>
                </div>
              )}
              {/* Gradient overlay — readable text over any image */}
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 45%, transparent 100%)" }} />

              {/* Status badge */}
              <div className="absolute top-3 left-3">
                {curStory.complete ? (
                  <span className="flex items-center gap-1.5 font-baloo font-black text-2xs text-amber-900 bg-amber-400 px-3 py-1 rounded-full shadow-md">
                    {t("homeAdventureCompleteLabel")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-baloo font-black text-2xs text-white bg-emerald-600/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
                    {t("homeAdventureLabel")}
                  </span>
                )}
              </div>

              {/* Play button — always visible on mobile, hover-reveal on desktop */}
              <div className="absolute inset-0 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-14 h-14 bg-[var(--ds-surface-card)] rounded-full flex items-center justify-center shadow-2xl">
                  <Play className="w-6 h-6 fill-emerald-600 text-emerald-600 ml-0.5" />
                </div>
              </div>

              {/* Bottom title overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
                <p className="font-nunito text-white/70 text-3xs uppercase tracking-widest mb-0.5">
                  {curStory.complete ? t("homeAdventureFinished") : t("homeAdventureMissionOf").replace("{done}", String(doneSlots)).replace("{total}", String(totalSlots || 6))}
                </p>
                <h2 className="font-baloo font-black text-white text-xl sm:text-1.5xl leading-tight drop-shadow-lg line-clamp-1">
                  {curStory.title}
                </h2>
              </div>
            </Link>

            {/* Progress + CTA */}
            <div className="bg-[var(--ds-surface-card)] px-4 sm:px-5 pt-4 pb-4">
              {!curStory.complete && (
                <>
                  {/* Mission dots */}
                  {slots.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      {slots.map((slot, i) => (
                        <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-2xs font-black shadow-sm transition-all ${
                          slot.completed
                            ? "bg-emerald-500 text-white shadow-emerald-200"
                            : "bg-[var(--ds-surface-card-hover)] text-[var(--ds-text-tertiary)] border border-[var(--ds-border-primary)]"
                        }`}>
                          {slot.completed ? "⭐" : i + 1}
                        </div>
                      ))}
                      <span className="font-nunito text-[var(--ds-text-tertiary)] text-2xs ml-1">{pct}{t("homeAdventurePercentDone")}</span>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="h-2.5 bg-[var(--ds-surface-card-hover)] rounded-full overflow-hidden mb-4">
                    <motion.div className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg,#34d399,#059669)" }}
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }} />
                  </div>
                </>
              )}

              <Link href={`/stories/${curStory.slug}`}
                className="flex items-center justify-center gap-2 w-full font-baloo font-black text-mbase sm:text-base py-3.5 leaf shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
                style={{
                  background: curStory.complete
                    ? "linear-gradient(135deg,#fbbf24,#f59e0b)"
                    : "linear-gradient(135deg,#059669,#047857)",
                  color: curStory.complete ? "#78350f" : "white",
                  boxShadow: curStory.complete
                    ? "0 4px 18px rgba(245,158,11,0.35)"
                    : "0 4px 18px rgba(5,150,105,0.35)",
                }}>
                {curStory.complete ? t("homeAdventureViewCert") : t("homeAdventureKeepGoing")}
                <Play className="w-4 h-4" fill="currentColor" />
              </Link>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center gap-4 p-8 text-center bg-[var(--ds-surface-card)]">
            <motion.span className="text-5.5xl leading-none select-none"
              animate={{ y: [0,-8,0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>🔭</motion.span>
            <div>
              <p className="font-baloo font-black text-[var(--ds-text-primary)] text-xl">{t("homeAdventureStoryAwaits")}</p>
              <p className="font-nunito text-[var(--ds-text-secondary)] text-sm mt-1">{t("homeAdventureZiloDesc")}</p>
            </div>
            <Link href="/stories"
              className="flex items-center gap-2 font-baloo font-black text-white text-base px-8 py-3.5 leaf shadow-xl transition-all hover:-translate-y-0.5 active:scale-95"
              style={{ background: "linear-gradient(135deg,#059669,#047857)", boxShadow: "0 6px 22px rgba(5,150,105,0.4)" }}>
              {t("homeAdventureStartJourney")} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </motion.div>
    </motion.section>
  );
}
