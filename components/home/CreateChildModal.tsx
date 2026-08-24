"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeMotion } from "@/hooks/useThemeMotion";
import { X, ChevronLeft, ChevronRight, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { createChild } from "@/lib/queries";
import type { Child } from "@/lib/queries";
import AvatarBuilder from "@/components/avatar/AvatarBuilder";
import AvatarSvg from "@/components/avatar/AvatarSvg";
import { serializeAvatar, DEFAULT_AVATAR, type AvatarConfig } from "@/lib/avatarConfig";
import { SPRING } from "@/lib/design-system/motion";

export const AVATARS = ["🦁", "🐧", "🦊", "🐬", "🦋", "🐸", "🐨", "🦄"];

const LANGUAGES: { code: Child["language"]; label: string; flag: string }[] = [
  { code: "en", label: "English",     flag: "🇬🇧" },
  { code: "fr", label: "Français",    flag: "🇫🇷" },
  { code: "rw", label: "Kinyarwanda", flag: "🇷🇼" },
];

const AGE_GROUPS = [
  { label: "2–4", emoji: "🍼", desc: "Little Explorer",  age: 3  },
  { label: "5–6", emoji: "🌟", desc: "Story Starter",    age: 6  },
  { label: "7–9", emoji: "🚀", desc: "Adventure Seeker", age: 8  },
  { label: "10+", emoji: "🏆", desc: "Champion Reader",  age: 11 },
];

type Step = "design" | "details" | "success";

interface Props {
  onCreated: (child: Child) => void;
  onClose?: () => void;
}

const slideRight = {
  hidden:  { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { ...SPRING.gentle } },
  exit:    { opacity: 0, x: -24, transition: { duration: 0.15 } },
};

const slideLeft = {
  hidden:  { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { ...SPRING.gentle } },
  exit:    { opacity: 0, x: 24, transition: { duration: 0.15 } },
};

export default function CreateChildModal({ onCreated, onClose }: Props) {
  const m = useThemeMotion();
  const [step, setStep]           = useState<Step>("design");
  const [avatarCfg, setAvatarCfg] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [name, setName]           = useState("");
  const [ageIdx, setAgeIdx]       = useState(1);
  const [language, setLanguage]   = useState<Child["language"]>("en");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [createdChild, setCreatedChild] = useState<Child | null>(null);
  // H30: clear the success-delay timer on unmount
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { clearTimeout(successTimerRef.current); }, []);

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Please enter a name!"); return; }
    setSaving(true);
    setError("");
    const { data: child, error: err } = await createChild({
      name: name.trim(),
      age: AGE_GROUPS[ageIdx].age,
      language,
      avatar_url: serializeAvatar(avatarCfg),
    });
    setSaving(false);
    if (err === "subscription_required") { setError("subscription_required"); return; }
    if (err || !child) { setError(err ?? "Something went wrong. Please try again."); return; }
    setCreatedChild(child);
    setStep("success");
    successTimerRef.current = setTimeout(() => onCreated(child), 2200);
  };

  const stepLabel = step === "design" ? "1 of 2" : step === "details" ? "2 of 2" : "";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="bg-ds-card border border-ds-border shadow-[0_24px_64px_rgba(0,0,0,0.22)] w-full max-w-lg overflow-hidden my-4"
          style={{ borderRadius: "var(--leaf-r-lg)" }}
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, var(--ds-nav-bg) 0%, var(--ds-surface-nav) 100%)" }}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--ds-text-brand)]">
                {stepLabel ? `Nimipiko Airways · ${stepLabel}` : "Nimipiko Airways"}
              </p>
              <p className="text-white font-baloo font-black text-[17px] leading-tight">
                {step === "design"  ? "Design your Explorer 🎨"
                 : step === "details" ? "Who's the hero? ✈️"
                 : "Boarding pass ready! 🎉"}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              {step !== "success" && (
                <div className="flex gap-1.5">
                  {(["design", "details"] as Step[]).map((s, i) => (
                    <div key={s} className={`rounded-full transition-all duration-400 ${
                      step === s ? "bg-white w-6 h-2" : i < ["design","details"].indexOf(step) ? "bg-white/70 w-2 h-2" : "bg-white/30 w-2 h-2"
                    }`} />
                  ))}
                </div>
              )}
              {onClose && step !== "success" && (
                <button onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ── Body ────────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">

            {/* Step 1 — Avatar designer */}
            {step === "design" && (
              <motion.div key="design" variants={slideRight} initial="hidden" animate="visible" exit="exit">
                <div className="p-4">
                  <AvatarBuilder initial={avatarCfg} onChange={setAvatarCfg} />
                </div>
                <div className="px-4 pb-4">
                  <motion.button
                    onClick={() => setStep("details")}
                    whileTap={m.buttonPress}
                    className="w-full font-baloo font-black py-3.5 text-base flex items-center justify-center gap-2 transition hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, var(--ds-brand-primary) 0%, var(--ds-brand-hover) 100%)", color: "var(--ds-nav-bg)", borderRadius: "14px", boxShadow: "var(--ds-shadow-cta)" }}
                  >
                    Next: Name your Explorer
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Details */}
            {step === "details" && (
              <motion.div key="details" variants={slideRight} initial="hidden" animate="visible" exit="exit"
                className="px-5 py-5 space-y-5">

                {/* Avatar preview */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 shadow-md flex-shrink-0"
                    style={{ borderColor: "var(--ds-border-brand)", backgroundColor: `#${avatarCfg.bg}` }}>
                    <AvatarSvg config={avatarCfg} size={56} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ds-text-tertiary)]">Your Explorer</p>
                    <p className="font-baloo font-black text-[var(--ds-text-primary)] text-base leading-tight">
                      {name || "…"}
                    </p>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ds-text-secondary)] block mb-2">
                    Child's name
                  </label>
                  <input
                    type="text" value={name}
                    onChange={e => { setName(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && name.trim() && handleSubmit()}
                    placeholder="Enter name…" maxLength={30} autoFocus
                    className="w-full border-2 border-[var(--ds-border-primary)] focus:border-[var(--ds-border-brand)] bg-[var(--ds-surface-card-hover)] px-4 py-3 text-[15px] font-semibold text-[var(--ds-text-primary)] focus:outline-none transition placeholder:text-[var(--ds-text-tertiary)]"
                    style={{ borderRadius: "12px" }}
                  />
                </div>

                {/* Age group */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ds-text-secondary)] mb-2">Age group</p>
                  <div className="grid grid-cols-2 gap-2">
                    {AGE_GROUPS.map((g, i) => (
                      <motion.button key={g.label} whileTap={{ scale: 0.95 }}
                        onClick={() => setAgeIdx(i)}
                        className={`py-3 px-3 flex items-center gap-2.5 border-2 transition text-left ${
                          ageIdx === i
                            ? "border-[var(--ds-border-brand)] bg-[var(--ds-brand-subtle)]"
                            : "border-[var(--ds-border-primary)] bg-[var(--ds-surface-card-hover)] hover:border-[var(--ds-border-strong)]"
                        }`}
                        style={{ borderRadius: "12px" }}
                      >
                        <span className="text-2xl leading-none">{g.emoji}</span>
                        <div>
                          <p className="font-baloo font-black text-[var(--ds-text-primary)] text-sm leading-none">{g.label} yrs</p>
                          <p className="font-nunito text-[var(--ds-text-secondary)] text-[10px]">{g.desc}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ds-text-secondary)] mb-2">Learning language</p>
                  <div className="grid grid-cols-3 gap-2">
                    {LANGUAGES.map(l => (
                      <motion.button key={l.code} whileTap={{ scale: 0.95 }}
                        onClick={() => setLanguage(l.code)}
                        className={`py-3 flex flex-col items-center gap-1 border-2 transition ${
                          language === l.code
                            ? "border-[var(--ds-border-brand)] bg-[var(--ds-brand-subtle)]"
                            : "border-[var(--ds-border-primary)] bg-[var(--ds-surface-card-hover)] hover:border-[var(--ds-border-strong)]"
                        }`}
                        style={{ borderRadius: "12px" }}
                      >
                        <span className="text-2xl">{l.flag}</span>
                        <span className="font-baloo font-black text-[var(--ds-text-primary)] text-[11px]">{l.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Subscription gate */}
                {error === "subscription_required" ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col items-center gap-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-black text-[var(--ds-text-primary)] text-sm">Free plan: 1 child included</p>
                      <p className="text-[var(--ds-text-secondary)] text-xs mt-0.5">Upgrade to Nimipiko Club to add unlimited explorers.</p>
                    </div>
                    <Link href="/pricing?reason=add-child"
                      className="w-full text-center text-white font-black text-sm py-2.5 rounded-xl transition hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, var(--ds-brand-primary), var(--ds-brand-hover))", color: "var(--ds-nav-bg)" }}>
                      See Plans →
                    </Link>
                  </div>
                ) : error ? (
                  <p className="text-red-500 text-xs font-semibold text-center">{error}</p>
                ) : null}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setStep("design")}
                    className="flex items-center gap-1.5 px-4 py-3 border border-[var(--ds-border-primary)] text-[var(--ds-text-secondary)] font-bold text-sm hover:bg-[var(--ds-surface-card-hover)] transition shrink-0"
                    style={{ borderRadius: "12px" }}>
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <motion.button
                    onClick={handleSubmit}
                    disabled={saving || !name.trim()}
                    whileTap={m.buttonPress}
                    className="flex-1 font-baloo font-black text-base py-3.5 flex items-center justify-center gap-2 disabled:opacity-40 transition hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, var(--ds-brand-primary) 0%, var(--ds-brand-hover) 100%)", color: "var(--ds-nav-bg)", borderRadius: "14px", boxShadow: "var(--ds-shadow-cta)" }}
                  >
                    {saving ? (
                      <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>⭐</motion.span>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Begin the Adventure!</>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Success */}
            {step === "success" && createdChild && (
              <motion.div key="success" variants={slideRight} initial="hidden" animate="visible"
                className="px-6 py-8 flex flex-col items-center text-center gap-4">

                {/* Avatar burst */}
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
                  className="w-24 h-24 rounded-full overflow-hidden border-4 shadow-xl"
                  style={{ borderColor: "var(--ds-border-brand)", boxShadow: "var(--ds-shadow-cta)", backgroundColor: `#${avatarCfg.bg}` }}
                >
                  <AvatarSvg config={avatarCfg} size={96} />
                </motion.div>

                {/* Stars */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.span key={i} className="text-amber-400 text-lg"
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300 }}>
                      ⭐
                    </motion.span>
                  ))}
                </div>

                <div>
                  <p className="font-baloo font-black text-[var(--ds-text-primary)] text-2xl leading-tight">
                    {createdChild.name} is ready!
                  </p>
                  <p className="text-[var(--ds-text-secondary)] font-nunito text-sm mt-1">
                    Boarding pass ready ✈️
                  </p>
                </div>

                {/* Boarding progress bar */}
                <div className="w-full max-w-xs">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, var(--ds-brand-primary), var(--ds-brand-hover))" }}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                  </div>
                  <p className="text-[10px] font-nunito text-[var(--ds-text-tertiary)] mt-1.5 text-center">Boarding…</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
