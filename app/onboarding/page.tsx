"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles, Star } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import { createChild } from "@/lib/queries";
import { PENDING_REF_KEY } from "@/lib/referralConstants";
import type { Child } from "@/lib/queries";
import { SPRING } from "@/lib/design-system/motion";
import AvatarBuilder from "@/components/avatar/AvatarBuilder";
import AvatarSvg from "@/components/avatar/AvatarSvg";
import { serializeAvatar, DEFAULT_AVATAR, type AvatarConfig } from "@/lib/avatarConfig";

const LANGUAGES: { code: Child["language"]; label: string; native: string; flag: string }[] = [
  { code: "en", label: "English",     native: "English",      flag: "🇬🇧" },
  { code: "fr", label: "Français",    native: "Français",     flag: "🇫🇷" },
  { code: "rw", label: "Kinyarwanda", native: "Ikinyarwanda", flag: "🇷🇼" },
];

const AGE_GROUPS = [
  { label: "2–4", emoji: "🍼", desc: "Little Explorer",  min: 2, max: 4  },
  { label: "5–6", emoji: "🌟", desc: "Story Starter",    min: 5, max: 6  },
  { label: "7–9", emoji: "🚀", desc: "Adventure Seeker", min: 7, max: 9  },
  { label: "10+", emoji: "🏆", desc: "Champion Reader",  min: 10, max: 12 },
];

// 2 steps: Design avatar → Set up profile + launch
const STEPS = ["Design", "Profile"];

const fadeSlide = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING.gentle } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.16 } },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]             = useState(0);
  const [parentName, setParentName] = useState("there");
  const [avatarCfg, setAvatarCfg]  = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [childName, setChildName]   = useState("");
  const [ageGroup, setAgeGroup]     = useState(1);
  const [language, setLanguage]     = useState<Child["language"]>("en");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [done, setDone]             = useState(false);
  const [createdChildId, setCreatedChildId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/loginpage"); return; }
      const { data: p } = await supabase.from("parents").select("name").eq("id", user.id).maybeSingle();
      if (p?.name) setParentName(p.name.split(" ")[0]);
      const { data: kids } = await supabase.from("children").select("id").eq("parent_id", user.id).limit(1);
      if (kids && kids.length > 0) { router.replace("/home"); return; }

      // Apply pending referral code from signup (handles email-verification flow)
      const pendingRef = sessionStorage.getItem(PENDING_REF_KEY);
      if (pendingRef) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          void fetch("/api/referral", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ code: pendingRef }),
          });
          sessionStorage.removeItem(PENDING_REF_KEY);
        }
      }
    })();
  }, [router]);

  const handleCreate = useCallback(async () => {
    if (!childName.trim()) { setError("Please enter your child's name!"); return; }
    setSaving(true);
    setError("");
    const age = AGE_GROUPS[ageGroup].min + 1;
    const { data: child, error: err } = await createChild({
      name: childName.trim(),
      age,
      language,
      avatar_url: serializeAvatar(avatarCfg),
    });
    if (err || !child) {
      setError(err ?? "Something went wrong. Please try again.");
      setSaving(false);
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("nimipiko_active_child", child.id);
    }

    setCreatedChildId(child.id);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      // Pre-generate referral code so ReferralCard loads instantly on first visit
      void fetch("/api/referral", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {});
    }

    setDone(true);
    setTimeout(() => router.replace("/home"), 3000);
  }, [childName, ageGroup, language, avatarCfg, router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg,#d1fae5 0%,#ecfdf5 40%,#f0fdf4 70%,#dcfce7 100%)" }}
    >
      {/* Ambient sparkles */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
        {[
          { top:"8%",  left:"5%",  emoji:"⭐", size:28, delay:0   },
          { top:"15%", left:"88%", emoji:"✨", size:22, delay:0.5 },
          { top:"75%", left:"4%",  emoji:"🌟", size:24, delay:1   },
          { top:"82%", left:"90%", emoji:"⭐", size:20, delay:0.7 },
          { top:"45%", left:"2%",  emoji:"💫", size:18, delay:1.4 },
          { top:"35%", left:"94%", emoji:"✨", size:16, delay:0.3 },
        ].map((d, i) => (
          <motion.span key={i} className="absolute"
            style={{ top: d.top, left: d.left, fontSize: d.size }}
            animate={{ opacity:[0.3,1,0.3], scale:[0.7,1.2,0.7], rotate:[0,15,-15,0] }}
            transition={{ duration:2.5+i*0.4, repeat:Infinity, delay:d.delay }}>
            {d.emoji}
          </motion.span>
        ))}
      </div>

      {/* Top bar */}
      <div className="relative z-10 w-full max-w-xl px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-1.5xl">📚</span>
            <span className="font-baloo font-black text-emerald-700 text-lg">NIMIPIKO</span>
          </div>
          {!done && (
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${
                  i < step ? "bg-emerald-500 w-5" : i === step ? "bg-emerald-400 w-10" : "bg-emerald-100 w-5"
                }`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card area */}
      <div className="relative z-10 w-full max-w-xl px-4 flex-1 flex items-start pb-8">
        <AnimatePresence mode="wait">

          {/* ── STEP 0: Avatar designer ─────────────────────────────────── */}
          {step === 0 && !done && (
            <motion.div key="s0" variants={fadeSlide} initial="hidden" animate="visible" exit="exit"
              className="w-full bg-[var(--ds-surface-card)]/90 backdrop-blur-sm border border-emerald-100 shadow-brand-glow-md overflow-hidden"
              style={{ borderRadius: "28px" }}>

              <div className="relative px-6 pt-6 pb-5 text-center overflow-hidden"
                style={{ background:"linear-gradient(135deg,#059669 0%,#10b981 60%,#34d399 100%)" }}>
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[var(--ds-surface-card)]/10" />
                <p className="text-white/70 text-2xs font-nunito font-bold uppercase tracking-[0.18em] mb-1">Step 1 of 2</p>
                <h2 className="font-baloo font-black text-white text-2xl leading-tight">
                  Hi {parentName}! Design your Explorer 🎨
                </h2>
                <p className="text-white/75 text-xs font-nunito mt-1">Make your child&apos;s character completely unique</p>
              </div>

              <div className="p-4">
                <AvatarBuilder initial={avatarCfg} onChange={setAvatarCfg} />
              </div>

              <div className="px-4 pb-4">
                <motion.button whileTap={{ scale:0.97 }} onClick={() => setStep(1)}
                  className="w-full text-white font-baloo font-black text-base py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition hover:opacity-90"
                  style={{ background:"linear-gradient(to right,#059669,#10b981)", borderRadius:"14px" }}>
                  Next: Name your Explorer
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: Name + age + language + create ──────────────────── */}
          {step === 1 && !done && (
            <motion.div key="s1" variants={fadeSlide} initial="hidden" animate="visible" exit="exit"
              className="w-full bg-[var(--ds-surface-card)]/90 backdrop-blur-sm border border-emerald-100 shadow-brand-glow-md overflow-hidden"
              style={{ borderRadius:"28px" }}>

              <div className="relative px-6 pt-6 pb-5 text-center overflow-hidden"
                style={{ background:"linear-gradient(135deg,#059669 0%,#10b981 60%,#34d399 100%)" }}>
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[var(--ds-surface-card)]/10" />
                {/* Avatar preview in header */}
                <div className="flex justify-center mb-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 shadow-lg">
                    <AvatarSvg config={avatarCfg} size={64} />
                  </div>
                </div>
                <p className="text-white/70 text-2xs font-nunito font-bold uppercase tracking-[0.18em] mb-1">Step 2 of 2</p>
                <h2 className="font-baloo font-black text-white text-2xl leading-tight">Who&apos;s the hero? 🌟</h2>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Name */}
                <div>
                  <label className="text-2xs font-black uppercase tracking-[0.18em] text-[var(--ds-text-secondary)] block mb-2">
                    Child&apos;s name
                  </label>
                  <input type="text" value={childName} onChange={e => { setChildName(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && childName.trim() && handleCreate()}
                    placeholder="Enter name…" maxLength={30} autoFocus
                    className="w-full border-2 border-[var(--ds-border-primary)] focus:border-emerald-400 bg-[var(--ds-surface-card-hover)] px-4 py-3 text-mbase font-semibold text-[var(--ds-text-primary)] focus:outline-none transition placeholder:text-[var(--ds-text-tertiary)]"
                    style={{ borderRadius:"12px" }} />
                </div>

                {/* Age group */}
                <div>
                  <p className="text-2xs font-black uppercase tracking-[0.18em] text-[var(--ds-text-secondary)] mb-2">Age group</p>
                  <div className="grid grid-cols-2 gap-2">
                    {AGE_GROUPS.map((g, i) => (
                      <motion.button key={g.label} whileTap={{ scale:0.95 }} onClick={() => setAgeGroup(i)}
                        className={`py-3 px-3 flex items-center gap-2.5 border-2 transition text-left ${
                          ageGroup === i ? "border-emerald-400 bg-emerald-50" : "border-[var(--ds-border-primary)] bg-[var(--ds-surface-card-hover)] hover:border-[var(--ds-border-strong)]"
                        }`} style={{ borderRadius:"12px" }}>
                        <span className="text-1.5xl">{g.emoji}</span>
                        <div>
                          <p className="font-baloo font-black text-[var(--ds-text-primary)] text-sml leading-none">{g.label} yrs</p>
                          <p className="font-nunito text-[var(--ds-text-secondary)] text-3xs">{g.desc}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <p className="text-2xs font-black uppercase tracking-[0.18em] text-[var(--ds-text-secondary)] mb-2">Learning language</p>
                  <div className="grid grid-cols-3 gap-2">
                    {LANGUAGES.map(l => (
                      <motion.button key={l.code} whileTap={{ scale:0.95 }} onClick={() => setLanguage(l.code)}
                        className={`py-3 flex flex-col items-center gap-1 border-2 transition ${
                          language === l.code ? "border-emerald-400 bg-emerald-50" : "border-[var(--ds-border-primary)] bg-[var(--ds-surface-card-hover)] hover:border-[var(--ds-border-strong)]"
                        }`} style={{ borderRadius:"12px" }}>
                        <span className="text-2xl">{l.flag}</span>
                        <span className="font-baloo font-black text-[var(--ds-text-primary)] text-2xs">{l.native}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 7-day trial reminder */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-ds-club bg-ds-club-subtle">
                  <span className="text-xl shrink-0">👑</span>
                  <p className="font-nunito font-bold text-ds-club-text text-xs">
                    7-day free trial — all of Club unlocked. No credit card needed.
                  </p>
                </div>

                {error && <p className="text-red-500 text-xs font-semibold text-center">{error}</p>}

                <div className="flex gap-3">
                  <button onClick={() => setStep(0)}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-[var(--ds-border-primary)] text-[var(--ds-text-secondary)] font-bold text-sm hover:bg-[var(--ds-surface-card-hover)] transition shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <motion.button whileTap={{ scale:0.97 }}
                    onClick={handleCreate}
                    disabled={saving || !childName.trim()}
                    className="flex-1 text-white font-baloo font-black text-base py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-40 transition hover:opacity-90"
                    style={{ background:"linear-gradient(to right,#059669,#10b981)", borderRadius:"14px" }}>
                    {saving ? (
                      <motion.span animate={{ rotate:[0,360] }} transition={{ duration:1, repeat:Infinity, ease:"linear" }}>⭐</motion.span>
                    ) : (
                      <><Sparkles className="w-5 h-5" /> Begin {childName || "the"} Adventure!</>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── DONE: Ready for Departure ──────────────────────────────── */}
          {done && (
            <motion.div key="done" variants={fadeSlide} initial="hidden" animate="visible"
              className="w-full overflow-hidden shadow-2xl"
              style={{ borderRadius:"28px" }}>

              {/* Airport header bar */}
              <div className="px-6 py-4 flex items-center justify-between"
                style={{ background:"linear-gradient(135deg,#06101F 0%,#1A3558 100%)" }}>
                <div>
                  <p className="text-[#C9A84C] font-black text-3xs tracking-widest uppercase">Nimipiko Airways</p>
                  <p className="text-white font-baloo font-black text-base leading-none">Boarding Gate Open ✈️</p>
                </div>
                <motion.span
                  animate={{ x:[0, 8, 0] }}
                  transition={{ duration:1.8, repeat:Infinity, ease:"easeInOut" }}
                  className="text-4xl select-none">✈️</motion.span>
              </div>

              {/* Boarding pass body */}
              <div className="bg-white px-6 pt-5 pb-6">

                {/* Flight info row */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-dashed border-gray-200">
                  <div>
                    <p className="text-3xs font-black text-gray-400 uppercase tracking-widest">Passenger</p>
                    <p className="font-baloo font-black text-gray-900 text-xl leading-tight">{childName.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xs font-black text-gray-400 uppercase tracking-widest">Flight</p>
                    <p className="font-baloo font-black text-[#1A3558] text-lg">NMP101</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="text-center">
                    <p className="font-baloo font-black text-2xl text-gray-900">NMP</p>
                    <p className="text-3xs text-gray-400 uppercase tracking-wider">Nimi Academy</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-center gap-1">
                      <div className="flex-1 h-px bg-gray-300" />
                      <span className="text-gray-400 text-xs">✈</span>
                      <div className="flex-1 h-px bg-gray-300" />
                    </div>
                    <p className="text-3xs text-[#1A7A3E] font-black uppercase tracking-widest">Direct</p>
                  </div>
                  <div className="text-center">
                    <p className="font-baloo font-black text-2xl text-gray-900">ADV</p>
                    <p className="text-3xs text-gray-400 uppercase tracking-wider">Adventure</p>
                  </div>
                </div>

                {/* Avatar + welcome */}
                <div className="flex items-center gap-4 mb-5">
                  <motion.div
                    initial={{ scale:0.7, opacity:0 }}
                    animate={{ scale:1, opacity:1 }}
                    transition={{ delay:0.3, type:"spring", stiffness:260, damping:18 }}
                    className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#C9A84C] shadow-lg shrink-0"
                    style={{ backgroundColor:`#${avatarCfg.bg}` }}>
                    <AvatarSvg config={avatarCfg} size={64} />
                  </motion.div>
                  <div>
                    <p className="font-baloo font-black text-gray-900 text-base leading-tight">
                      {childName}&apos;s passport is ready!
                    </p>
                    <p className="text-gray-500 text-xs font-nunito mt-0.5">
                      7-day free trial active · All Club doors open 🎉
                    </p>
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {[...Array(5)].map((_, i) => (
                        <motion.div key={i} initial={{ scale:0 }} animate={{ scale:1 }}
                          transition={{ delay:0.5 + i*0.07, ...SPRING.card }}>
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Boarding progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-3xs text-gray-400 font-black uppercase tracking-widest mb-1.5">
                    <span>Boarding…</span><span>Gate closing</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ background:"linear-gradient(90deg,#1A7A3E,#34D399)" }}
                      initial={{ width:"0%" }} animate={{ width:"100%" }}
                      transition={{ duration:2.8, ease:"easeInOut" }} />
                  </div>
                </div>

                {/* Airways tip */}
                <motion.div
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:0.9, duration:0.4 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background:"linear-gradient(135deg,#06101F,#1A3558)" }}>
                  <span className="text-xl shrink-0">📘</span>
                  <div>
                    <p className="font-baloo font-black text-[#C9A84C] text-xs leading-tight">
                      Passport &amp; boarding pass ready
                    </p>
                    <p className="text-white/60 text-3xs font-nunito">
                      Download them anytime from your parent profile → Airways ✈️
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Barcode strip */}
              <div className="px-6 py-3 flex items-center justify-between"
                style={{ background:"#F7F7F7", borderTop:"2px dashed #E5E7EB" }}>
                <div className="flex gap-0.5">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div key={i} className="bg-gray-800 rounded-sm"
                      style={{ width: i % 3 === 0 ? 3 : 1.5, height: 28 }} />
                  ))}
                </div>
                <p className="font-baloo font-black text-3xs text-gray-400 tracking-widest">
                  {createdChildId?.slice(0, 8).toUpperCase() ?? 'NMP-0001'}
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <div className="relative z-10 py-4 text-center">
        <p className="text-emerald-600/60 font-nunito text-2xs">
          © {new Date().getFullYear()} Nimipiko Studio LTD · Secure & Kid-Safe
        </p>
      </div>
    </div>
  );
}
