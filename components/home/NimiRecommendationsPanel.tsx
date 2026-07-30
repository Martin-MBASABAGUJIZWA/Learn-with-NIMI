"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import type { UniversalRecommendation } from "@/lib/ai/types";

interface Props {
  childId: string;
  language?: string;
}

const REASON_LABEL: Record<string, string> = {
  in_progress:       "Continue where you left off",
  level_up:          "Level up!",
  interest_match:    "You'll love this",
  review_needed:     "Time to review",
  streak_builder:    "Keep your streak",
  achievement_unlock:"Unlock an achievement",
  new_adventure:     "New adventure",
};

export default function NimiRecommendationsPanel({ childId, language = "en" }: Props) {
  const [recs, setRecs]       = useState<UniversalRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) return;
    void fetchRecs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, language]);

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setLoading(false); return; }

      const res = await fetch(`/api/nimi/recommendations?childId=${childId}&lang=${language}&limit=5`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as { recommendations?: UniversalRecommendation[] };
      setRecs(data.recommendations ?? []);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="overflow-hidden leaf-lg border border-[var(--ds-border-primary)] bg-[var(--ds-surface-card)] shadow-card-md">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 animate-pulse shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-2 w-16 rounded-full bg-[var(--ds-surface-card-active)] animate-pulse" />
            <div className="h-3.5 w-28 rounded bg-[var(--ds-surface-card-active)] animate-pulse" />
          </div>
        </div>
        <div className="h-px bg-[var(--ds-surface-card-active)] mx-4" />
        <div className="px-3 py-3 space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-[var(--ds-surface-card-active)] animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (recs.length === 0) return null;

  return (
    <div className="overflow-hidden leaf-lg border border-[var(--ds-border-primary)] bg-[var(--ds-surface-card)] shadow-card-md">

      {/* Header — matches every other sidebar panel */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <p className="font-nunito text-violet-500 text-3xs uppercase tracking-widest leading-none mb-0.5">AI Picks</p>
            <h3 className="font-baloo font-black text-[var(--ds-text-primary)] text-mlg leading-tight">Nimi Recommends</h3>
          </div>
        </div>
      </div>
      <div className="h-px bg-[var(--ds-surface-card-active)] mx-4" />

      <div className="px-3 py-3 space-y-1">
        {recs.map((rec, i) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              href={rec.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-violet-50 border border-transparent hover:border-violet-100 transition-all group"
            >
              <span className="text-xl leading-none shrink-0">{rec.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-baloo font-black text-[var(--ds-text-primary)] text-sml truncate leading-snug group-hover:text-violet-700 transition-colors">
                  {rec.title}
                </p>
                <p className="font-nunito text-[var(--ds-text-tertiary)] text-2xs truncate">
                  {REASON_LABEL[rec.reason] ?? rec.reasonLabel}
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--ds-text-tertiary)] group-hover:text-violet-400 transition-colors shrink-0" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
