"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";

const STAR_POSITIONS = [
  { top: "14%", left: "10%", size: "16px", delay: 0 },
  { top: "22%", left: "78%", size: "12px", delay: 0.4 },
  { top: "58%", left: "14%", size: "10px", delay: 0.8 },
  { top: "65%", left: "82%", size: "14px", delay: 0.2 },
];

export default function HomeMasterpiecePanel() {
  return (
    <div className="overflow-hidden leaf-lg border border-gray-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.07)]">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-nunito text-amber-500 text-[10px] uppercase tracking-widest leading-none mb-0.5">Story Forge</p>
            <h3 className="font-baloo font-black text-gray-900 text-[17px] leading-tight">My Masterpiece</h3>
          </div>
        </div>
        <Link href="/masterpiece" className="flex items-center gap-0.5 font-nunito font-bold text-gray-400 text-[11px] hover:text-amber-600 transition-colors">
          Create <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="h-px bg-gray-100 mx-4" />

      <div className="px-4 py-4">
        {/* Story book preview */}
        <div className="relative w-full rounded-2xl overflow-hidden mb-3"
          style={{ background: "linear-gradient(135deg,#fef9c3 0%,#fde68a 50%,#fbbf24 100%)", aspectRatio: "16/7" }}>
          {STAR_POSITIONS.map((p, i) => (
            <motion.span key={i}
              className="absolute leading-none pointer-events-none select-none"
              style={{ top: p.top, left: p.left, fontSize: p.size }}
              animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.2 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: p.delay }}>
              ⭐
            </motion.span>
          ))}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <motion.span
              className="text-[40px] leading-none drop-shadow-lg"
              animate={{ y: [0, -7, 0], rotate: [0, 6, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
              👑
            </motion.span>
            <p className="font-baloo font-black text-amber-900/60 text-[10px] tracking-widest uppercase">Your story here</p>
          </div>
        </div>

        <div className="text-center mb-3">
          <p className="font-baloo font-black text-gray-800 text-[14px] leading-tight">Become the Hero!</p>
          <p className="font-nunito text-gray-500 text-[11px] leading-relaxed mt-0.5">
            Create a personalised story book starring your child.
          </p>
        </div>

        <Link href="/masterpiece"
          className="flex items-center justify-center gap-2 w-full font-baloo font-black text-white text-[13px] py-3 leaf transition-all hover:-translate-y-0.5 active:scale-95"
          style={{ background: "linear-gradient(135deg,#d97706,#b45309)", boxShadow: "0 4px 14px rgba(217,119,6,0.35)" }}>
          Create Masterpiece ✨
        </Link>
      </div>
    </div>
  );
}
