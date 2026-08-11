"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { ChevronRight, Play, Lock, Star, Crown } from "lucide-react";
import { getStorageUrl } from "@/lib/queries";
import { ZoneDecorations } from "@/components/campus/ZoneDecorations";
import type { StoryLibraryItem } from "@/lib/story-types";


interface Props {
  stories: StoryLibraryItem[];
  curStory: StoryLibraryItem | undefined;
  hasSubscription: boolean;
  up: Variants;
  stagger: Variants;
  pop: Variants;
  onPrefetch?: (storyId: string) => void;
}

function UpgradeWallCard({ lockedCount }: { lockedCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="shrink-0 w-[148px] sm:w-[164px]"
    >
      <Link href="/pricing">
        <div className="rounded-2xl overflow-hidden h-full cursor-pointer group"
          style={{
            background: "linear-gradient(160deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%)",
            boxShadow: "0 8px 28px rgba(109,40,217,0.35), 0 0 0 1px rgba(139,92,246,0.3)",
          }}>
          {/* Top portion — icon + lock count */}
          <div className="flex flex-col items-center justify-center gap-2 px-3 pt-5 pb-3"
            style={{ aspectRatio: "3/4" }}>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="w-14 h-14 rounded-2xl bg-[var(--ds-surface-card)]/20 flex items-center justify-center shadow-lg border border-white/30">
              <Crown className="w-7 h-7 text-yellow-300" />
            </motion.div>
            <div className="text-center">
              <p className="font-baloo font-black text-white text-sml leading-tight">
                {lockedCount} more {lockedCount === 1 ? "story" : "stories"}
              </p>
              <p className="text-purple-200 text-3xs mt-0.5 leading-tight">
                waiting for you
              </p>
            </div>
            {/* Decorative dots */}
            <div className="flex gap-1 mt-1">
              {[...Array(Math.min(lockedCount, 5))].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--ds-surface-card)]/40" />
              ))}
            </div>
          </div>
          {/* Bottom CTA */}
          <div className="px-2.5 py-2.5 bg-[var(--ds-surface-card)]/10 border-t border-white/20 group-hover:bg-[var(--ds-surface-card)]/20 transition">
            <p className="font-baloo font-black text-yellow-300 text-2xs text-center leading-tight">
              👑 Unlock All →
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HomeStoryLibrarySection({ stories, curStory, hasSubscription, up, stagger, pop, onPrefetch }: Props) {
  if (stories.length === 0) return null;

  // For free users: find where free stories end and premium-locked ones begin
  const lastFreeIdx = !hasSubscription
    ? stories.reduce((last, s, i) => (s.is_free ? i : last), -1)
    : -1;
  const premiumLockedCount = !hasSubscription
    ? stories.filter(s => !s.is_free && !s.unlocked).length
    : 0;

  return (
    <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger} className="relative">
      <div className="leaf-lg border border-[var(--ds-border-primary)] bg-[var(--ds-surface-card)] p-4 shadow-[0_16px_36px_rgba(15,23,42,0.06)] sm:p-5">
        <ZoneDecorations zone="library" />

        {/* Section header */}
        <motion.div variants={up} className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--ds-brand-subtle)] flex items-center justify-center text-1.5xl shrink-0 shadow-sm">📚</div>
            <div>
              <p className="font-nunito text-4xs uppercase tracking-widest text-[var(--ds-text-brand)] leading-none mb-0.5">The Library</p>
              <h2 className="font-baloo font-black text-1.5xl sm:text-2xl text-[var(--ds-text-primary)] leading-tight">Story Library</h2>
            </div>
          </div>
          <Link href="/stories" className="flex items-center gap-1 font-nunito font-bold text-[var(--ds-text-brand)] text-sml hover:underline">
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Card scroll row */}
        <motion.div variants={stagger} className="flex gap-3.5 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
          {stories.map((story, idx) => {
            const isActive = !story.complete && story.unlocked && story.sid === curStory?.sid;
            const pctDone  = Math.round((story.progress ?? 0) * 100);
            const isPremiumLocked = !story.unlocked && !story.is_free && !hasSubscription;

            return (
              <React.Fragment key={story.sid}>
                {/* Inject upgrade wall card immediately after the last free story */}
                {!hasSubscription && lastFreeIdx >= 0 && idx === lastFreeIdx + 1 && premiumLockedCount > 0 && (
                  <UpgradeWallCard lockedCount={premiumLockedCount} />
                )}

              <motion.div variants={pop} className="shrink-0 w-[148px] sm:w-[164px]">
                {story.unlocked ? (
                  <div className="rounded-2xl overflow-hidden bg-[var(--ds-surface-card)] transition-all hover:-translate-y-1"
                    style={{
                      boxShadow: isActive
                        ? "0 8px 28px rgba(201,168,76,0.30), 0 0 0 2px rgba(201,168,76,0.50)"
                        : "0 4px 16px rgba(15,23,42,0.08)",
                    }}>
                    <Link href={`/stories/${story.slug}`}
                      onMouseEnter={() => onPrefetch?.(story.sid)}
                      className="group block">

                      {/* Portrait cover image — 3:4 book ratio */}
                      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/4" }}>
                        {story.cover_url
                          ? <Image src={getStorageUrl(story.cover_url)} alt={story.title} fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                              style={{ background: "linear-gradient(135deg,var(--ds-nav-bg),var(--ds-surface-nav))" }}>
                              <span className="text-5xl">{story.theme_emoji ?? "📖"}</span>
                            </div>
                        }

                        {/* Gradient fade for text legibility */}
                        <div className="absolute inset-0"
                          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 40%, transparent 70%)" }} />

                        {/* Top-left status chip */}
                        <div className="absolute top-2.5 left-2.5">
                          {story.complete ? (
                            <span className="flex items-center gap-1 font-baloo font-black text-4xs bg-[var(--ds-brand-primary)] text-[var(--ds-nav-bg)] px-2 py-0.5 rounded-full shadow-md">
                              <Star className="w-2.5 h-2.5 fill-current" /> Done
                            </span>
                          ) : isActive ? (
                            <span className="flex items-center gap-1 font-baloo font-black text-4xs bg-[var(--ds-nav-bg)]/90 text-[var(--ds-text-brand)] px-2 py-0.5 rounded-full shadow-md backdrop-blur-sm">
                              <Play className="w-2 h-2 fill-current" /> Reading
                            </span>
                          ) : story.is_free ? (
                            <span className="font-baloo font-black text-4xs bg-[var(--ds-brand-primary)] text-[var(--ds-nav-bg)] px-2 py-0.5 rounded-full shadow-md">
                              Free
                            </span>
                          ) : null}
                        </div>

                        {/* Bottom overlay — title + progress */}
                        <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-6">
                          <p className="font-baloo font-black text-white text-xs leading-tight line-clamp-2 mb-1.5 drop-shadow">
                            {story.title}
                          </p>
                          {pctDone > 0 && !story.complete && (
                            <div className="h-1.5 bg-[var(--ds-surface-card)]/30 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pctDone}%`, background: "var(--ds-brand-primary)" }} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom pill row */}
                      <div className="flex items-center justify-between px-2.5 py-2 bg-[var(--ds-surface-card)] border-t border-gray-50">
                        {story.category ? (
                          <span className="font-nunito font-bold text-4xs text-[var(--ds-text-brand)] bg-[var(--ds-brand-subtle)] px-2 py-0.5 rounded-full capitalize truncate max-w-[75px]">
                            {story.category}
                          </span>
                        ) : (
                          <span className="font-nunito font-bold text-4xs text-[var(--ds-text-tertiary)]">Story</span>
                        )}
                        {story.complete ? (
                          <span className="font-nunito font-bold text-4xs text-[var(--ds-text-brand)]">✓ All done</span>
                        ) : pctDone > 0 ? (
                          <span className="font-nunito font-bold text-4xs text-[var(--ds-text-tertiary)]">{pctDone}%</span>
                        ) : (
                          <span className="font-nunito font-bold text-4xs text-[var(--ds-text-brand)]">Start →</span>
                        )}
                      </div>
                    </Link>

                    {/* Practice reading strip — separate link so it doesn't nest inside the story link */}
                    <Link href="/talk-to-nimi?mode=practice"
                      className="flex items-center justify-center gap-1 py-1.5 text-4xs font-black transition border-t border-[var(--ds-border-primary)] bg-[var(--ds-brand-subtle)] hover:bg-[var(--ds-brand-soft)] text-[var(--ds-text-brand)]">
                      🎤 Practice Reading
                    </Link>
                  </div>
                ) : (
                  /* Locked card — clickable if premium-locked, static if progress-locked */
                  isPremiumLocked ? (
                    <Link href="/pricing" className="block">
                      <div className="rounded-2xl overflow-hidden bg-[var(--ds-surface-card)] shadow-card-xs group cursor-pointer">
                        <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
                          {story.cover_url
                            ? <Image src={getStorageUrl(story.cover_url)} alt={story.title} fill
                                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                            : <div className="absolute inset-0 flex items-center justify-center text-5xl bg-[var(--ds-surface-card-active)]">
                                {story.theme_emoji ?? "📖"}
                              </div>
                          }
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-purple-900/50 transition-colors duration-300 flex flex-col items-center justify-center gap-1.5">
                            <div className="w-10 h-10 rounded-full bg-[var(--ds-surface-card)]/90 flex items-center justify-center shadow-lg group-hover:bg-yellow-300 transition-colors">
                              <Crown className="w-5 h-5 text-purple-600 group-hover:text-purple-800" />
                            </div>
                            <span className="font-baloo font-black text-white/90 text-3xs group-hover:text-yellow-300 transition-colors">Club Only</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-2 bg-purple-50 border-t border-purple-100 group-hover:bg-purple-100 transition-colors">
                          <p className="font-baloo font-black text-purple-700 text-3xs leading-tight line-clamp-1 flex-1">{story.title}</p>
                          <Crown className="w-3 h-3 text-purple-400 shrink-0 ml-1" />
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="rounded-2xl overflow-hidden bg-[var(--ds-surface-card)] opacity-55 shadow-card-xs">
                      <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
                        {story.cover_url
                          ? <Image src={getStorageUrl(story.cover_url)} alt={story.title} fill
                              className="object-cover grayscale" />
                          : <div className="absolute inset-0 flex items-center justify-center text-5xl bg-[var(--ds-surface-card-active)]">
                              {story.theme_emoji ?? "📖"}
                            </div>
                        }
                        <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-[var(--ds-surface-card)]/90 flex items-center justify-center shadow-lg">
                            <Lock className="w-5 h-5 text-[var(--ds-text-secondary)]" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-2.5 py-2 bg-[var(--ds-surface-card-hover)] border-t border-[var(--ds-border-primary)]">
                        <p className="font-baloo font-black text-[var(--ds-text-tertiary)] text-3xs leading-tight line-clamp-1 flex-1">{story.title}</p>
                        <Lock className="w-3 h-3 text-[var(--ds-text-tertiary)] shrink-0 ml-1" />
                      </div>
                    </div>
                  )
                )}
              </motion.div>
              </React.Fragment>
            );
          })}

          {/* "What's next?" teaser — shown after all stories when child has only 1 */}
          {stories.length === 1 && (
            <motion.div variants={pop} className="shrink-0 w-[148px] sm:w-[164px]">
              <Link href="/stories">
                <div className="rounded-2xl overflow-hidden h-full group cursor-pointer border-2 border-dashed border-[var(--ds-border-brand)] bg-[var(--ds-brand-subtle)] hover:border-[var(--ds-border-brand)] transition-all">
                  <div className="flex flex-col items-center justify-center gap-2 px-3 pt-5 pb-3" style={{ aspectRatio: "3/4" }}>
                    <motion.span className="text-4.5xl leading-none"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}>
                      🔭
                    </motion.span>
                    <div className="text-center">
                      <p className="font-baloo font-black text-[var(--ds-text-brand)] text-sml leading-tight">What&apos;s next?</p>
                      <p className="font-nunito text-[var(--ds-text-secondary)] text-3xs mt-1 leading-snug">More adventures are waiting for you!</p>
                    </div>
                  </div>
                  <div className="px-2.5 py-2 bg-[var(--ds-brand-soft)] border-t border-[var(--ds-border-brand)] group-hover:bg-[var(--ds-brand-soft)] transition">
                    <p className="font-baloo font-black text-[var(--ds-text-brand)] text-2xs text-center">Explore Stories →</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
