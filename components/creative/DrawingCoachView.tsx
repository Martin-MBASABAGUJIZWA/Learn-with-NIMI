"use client";

/**
 * DrawingCoachView — Phase 7.2
 *
 * Step-by-step drawing lessons with AI-generated instructions.
 * Child picks a subject, taps through 6 steps, then says "I finished!"
 * for encouraging feedback. Awards 10 stars on completion.
 *
 * Flow: choose → steps → done
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authedFetch } from "@/lib/authedFetch";
import { claimChallengeReward } from "@/lib/queries";
import { DRAWING_SUBJECTS } from "@/lib/drawingCoach";
import type { DrawingCoachResponse, DrawingFeedbackResponse } from "@/lib/drawingCoach";

const G = "var(--ds-brand-primary)";
const STARS_AWARD = 10;

interface Props {
  childId:       string;
  childName:     string;
  childAge:      number | null;
  childLanguage: "en" | "fr" | "rw";
  onStarsEarned?: (n: number) => void;
}

type Step = "choose" | "loading" | "steps" | "finished" | "done";

export default function DrawingCoachView({
  childId, childName, childAge, childLanguage, onStarsEarned,
}: Props) {
  const [step,      setStep]      = useState<Step>("choose");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [lesson,    setLesson]    = useState<DrawingCoachResponse | null>(null);
  const [curStep,   setCurStep]   = useState(0);
  const [feedback,  setFeedback]  = useState<DrawingFeedbackResponse | null>(null);
  const [childNote, setChildNote] = useState("I finished drawing it!");
  const [error,     setError]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);

  const ageRange: "5-7" | "8-10" | "11+" =
    childAge == null ? "8-10" :
    childAge <= 7    ? "5-7"  :
    childAge <= 10   ? "8-10" : "11+";

  const handleChoose = useCallback(async (id: string) => {
    setSubjectId(id);
    setStep("loading");
    setError(null);
    setLesson(null);
    setCurStep(0);

    try {
      const res = await authedFetch("/api/drawing-coach", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:    "steps",
          subjectId: id,
          language:  childLanguage,
          ageRange,
          childName,
        }),
      });
      if (!res.ok) throw new Error("Coach unavailable");
      const data = await res.json() as DrawingCoachResponse;
      setLesson(data);
      setStep("steps");
    } catch {
      setError("Couldn't load the lesson. Try again.");
      setStep("choose");
    }
  }, [childLanguage, ageRange, childName]);

  const handleFinish = useCallback(async () => {
    if (!lesson) return;
    setLoading(true);
    setError(null);

    try {
      const subject = DRAWING_SUBJECTS.find(s => s.id === subjectId);
      const res = await authedFetch("/api/drawing-coach", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:    "feedback",
          subject:   subject?.label ?? "a drawing",
          childNote: childNote.trim() || "I finished!",
          childName,
          language:  childLanguage,
        }),
      });
      if (!res.ok) throw new Error("Feedback unavailable");
      const fb = await res.json() as DrawingFeedbackResponse;
      setFeedback(fb);

      await claimChallengeReward(
        childId, childLanguage,
        `drawing-${subjectId}-${new Date().toISOString().slice(0, 10)}`,
        STARS_AWARD,
      );
      onStarsEarned?.(STARS_AWARD);
      setStep("done");
    } catch {
      setError("Couldn't get feedback. Try again.");
    } finally {
      setLoading(false);
    }
  }, [lesson, subjectId, childNote, childName, childLanguage, childId, onStarsEarned]);

  const handleReset = () => {
    setStep("choose");
    setSubjectId(null);
    setLesson(null);
    setCurStep(0);
    setFeedback(null);
    setChildNote("I finished drawing it!");
    setError(null);
  };

  const currentStepData = lesson?.steps[curStep];
  const isLastStep = lesson ? curStep === lesson.steps.length - 1 : false;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">

      {/* Header */}
      <div>
        <p className="font-black text-xl" style={{ color: "var(--ds-text-primary)" }}>
          ✏️ Drawing Coach
        </p>
        <p className="text-xs font-nunito" style={{ color: "var(--ds-text-secondary)" }}>
          Follow the steps and draw something amazing!
        </p>
      </div>

      <AnimatePresence mode="wait">

        {/* ── CHOOSE ── */}
        {(step === "choose" || step === "loading") && (
          <motion.div key="choose" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            <p className="font-bold text-sml mb-3" style={{ color: "var(--ds-text-primary)" }}>
              What would you like to draw today?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DRAWING_SUBJECTS.map(sub => (
                <motion.button key={sub.id}
                  whileTap={{ scale: 0.95 }}
                  disabled={step === "loading"}
                  onClick={() => void handleChoose(sub.id)}
                  className="flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 hover:border-[var(--ds-border-brand)] transition-colors bg-[var(--ds-surface-card)] shadow-sm disabled:opacity-50"
                  style={{
                    borderColor: subjectId === sub.id ? G : "var(--ds-border-primary)",
                    background:  subjectId === sub.id ? "var(--ds-brand-subtle)" : "var(--ds-surface-card)",
                  }}>
                  <span className="text-3xl">{sub.emoji}</span>
                  <p className="font-baloo font-black text-2xs text-center leading-tight" style={{ color: "var(--ds-text-primary)" }}>
                    {sub.label}
                  </p>
                </motion.button>
              ))}
            </div>
            {step === "loading" && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: `${G} transparent transparent transparent` }} />
                <p className="font-bold text-sml" style={{ color: G }}>Getting your drawing steps…</p>
              </div>
            )}
            {error && <p className="text-xs font-bold text-red-500 mt-3">{error}</p>}
          </motion.div>
        )}

        {/* ── STEPS ── */}
        {step === "steps" && lesson && currentStepData && (
          <motion.div key="steps" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="flex flex-col gap-4">

            {/* Back + title */}
            <div className="flex items-center gap-3">
              <button onClick={handleReset}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--ds-surface-card-hover)] transition text-base">
                ←
              </button>
              <div>
                <p className="font-black text-mbase" style={{ color: "var(--ds-text-primary)" }}>{lesson.title}</p>
                <p className="text-2xs font-nunito" style={{ color: "var(--ds-text-secondary)" }}>{lesson.intro}</p>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {lesson.steps.map((_, i) => (
                <div key={i}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width:      i === curStep ? 24 : 8,
                    background: i < curStep ? G : i === curStep ? G : "var(--ds-border-primary)",
                    opacity:    i > curStep ? 0.4 : 1,
                  }} />
              ))}
              <span className="ml-1 font-bold text-2xs" style={{ color: "var(--ds-text-secondary)" }}>
                {curStep + 1}/{lesson.steps.length}
              </span>
            </div>

            {/* Current step card */}
            <AnimatePresence mode="wait">
              <motion.div key={curStep}
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}
                className="p-6 leaf-lg text-center"
                style={{ background: G }}>
                <p className="text-6xl mb-3 leading-none select-none">{currentStepData.shape_hint}</p>
                <p className="font-black text-white text-2xs uppercase tracking-widest mb-2">
                  Step {currentStepData.step}
                </p>
                <p className="font-baloo font-black text-white text-xl sm:text-1.5xl leading-snug mb-3">
                  {currentStepData.instruction}
                </p>
                <p className="text-white/80 text-xs font-nunito italic">
                  💡 {currentStepData.tip}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Nav buttons */}
            <div className="flex gap-3">
              {curStep > 0 && (
                <button onClick={() => setCurStep(n => n - 1)}
                  className="px-5 py-2.5 rounded-2xl font-black text-sml border hover:bg-[var(--ds-surface-card)] transition"
                  style={{ borderColor: "var(--ds-border-primary)", color: "var(--ds-text-secondary)" }}>
                  ← Back
                </button>
              )}
              {!isLastStep ? (
                <button onClick={() => setCurStep(n => n + 1)}
                  className="flex-1 py-2.5 rounded-2xl font-black text-sm text-white hover:opacity-90 transition"
                  style={{ background: G }}>
                  Next Step →
                </button>
              ) : (
                <button onClick={() => setStep("finished")}
                  className="flex-1 py-2.5 rounded-2xl font-black text-sm text-white hover:opacity-90 transition"
                  style={{ background: "#7C3AED" }}>
                  🎉 I finished drawing!
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── FINISHED (describe) ── */}
        {step === "finished" && lesson && (
          <motion.div key="finished" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="flex flex-col gap-4">

            <div className="p-5 leaf-lg text-center" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
              <p className="text-5xl mb-2">🎨</p>
              <p className="font-black text-base" style={{ color: "#6D28D9" }}>
                {lesson.finish_msg}
              </p>
            </div>

            <p className="font-bold text-sml" style={{ color: "var(--ds-text-primary)" }}>
              Want to tell Nimi about your drawing?
            </p>
            <textarea
              value={childNote}
              onChange={e => setChildNote(e.target.value)}
              rows={2}
              className="w-full text-sm font-nunito p-3 rounded-2xl border focus:outline-none resize-none"
              style={{ borderColor: "var(--ds-border-strong)", color: "var(--ds-text-primary)", background: "var(--ds-surface-card)" }} />

            {error && <p className="text-xs font-bold text-red-500">{error}</p>}

            <button
              onClick={() => void handleFinish()}
              disabled={loading}
              className="w-full py-3 rounded-2xl font-black text-sm text-white hover:opacity-90 transition disabled:opacity-40"
              style={{ background: G }}>
              {loading ? "Getting feedback…" : "✓ Get Nimi's feedback & stars!"}
            </button>
          </motion.div>
        )}

        {/* ── DONE ── */}
        {step === "done" && feedback && (
          <motion.div key="done" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            className="flex flex-col gap-4">

            <div className="p-5 leaf-lg text-center" style={{ background: G }}>
              <p className="text-white/80 text-3xs font-black uppercase tracking-widest mb-2">Stars Earned</p>
              <p className="font-baloo font-black text-5.5xl text-white leading-none">+{STARS_AWARD}</p>
              <div className="flex justify-center gap-1 mt-2">
                {Array.from({ length: Math.min(STARS_AWARD, 10) }).map((_, i) => (
                  <motion.span key={i} className="text-lg"
                    initial={{ scale:0 }} animate={{ scale:1 }}
                    transition={{ delay: 0.2 + i * 0.06, type:"spring", stiffness:300 }}>
                    ⭐
                  </motion.span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl" style={{ background: "var(--ds-brand-soft)", border: "1px solid var(--ds-border-brand)" }}>
              <p className="text-sm font-nunito leading-relaxed" style={{ color: "var(--ds-text-brand)" }}>
                💬 {feedback.praise}
              </p>
              <p className="text-xs font-bold mt-2" style={{ color: "var(--ds-text-brand)" }}>
                {feedback.encourage}
              </p>
            </div>

            <button onClick={handleReset}
              className="w-full py-3 rounded-2xl font-black text-sm text-white hover:opacity-90 transition"
              style={{ background: G }}>
              ✏️ Draw Something Else
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
