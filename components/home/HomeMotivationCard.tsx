"use client";

import { motion } from "framer-motion";

interface Props {
  consecutiveStreak?: number;
  isComplete?:        boolean;
}

function resolveMessage(streak: number, isComplete: boolean) {
  if (isComplete) return { title: "Adventure complete! 🌟", sub: "You finished the story!" };
  if (streak >= 7) return { title: "Unstoppable! 🏆",       sub: "You're on an amazing streak!" };
  if (streak >= 3) return { title: "You're on fire! 🔥",    sub: "Keep the streak going!" };
  if (streak >= 1) return { title: "You're doing great! ⭐", sub: "Every step makes you a star!" };
  return             { title: "Ready for an adventure? 🚀", sub: "Pick a story and explore!" };
}

export default function HomeMotivationCard({ consecutiveStreak = 0, isComplete = false }: Props) {
  const { title, sub } = resolveMessage(consecutiveStreak, isComplete);

  const isOnFire    = consecutiveStreak >= 3 && !isComplete;
  const isUnstop    = consecutiveStreak >= 7 && !isComplete;

  /* Palette: fire = amber/orange, unstoppable = rose, complete = gold, default = sky */
  const bg = isUnstop
    ? "linear-gradient(145deg,#FEF3C7 0%,#FDE68A 60%,#FCA5A5 100%)"
    : isOnFire
    ? "linear-gradient(145deg,#FFF7ED 0%,#FFEDD5 60%,#FED7AA 100%)"
    : isComplete
    ? "linear-gradient(145deg,#FEFCE8 0%,#FEF9C3 60%,#FDE047 20%)"
    : "linear-gradient(145deg,#E0F2FE 0%,#BAE6FD 50%,#7DD3FC 100%)";

  const borderColor = isUnstop ? "border-amber-300/60"
    : isOnFire ? "border-orange-200/60"
    : isComplete ? "border-yellow-300/60"
    : "border-sky-200/60";

  const titleColor = isUnstop ? "text-amber-800"
    : isOnFire ? "text-orange-800"
    : isComplete ? "text-yellow-700"
    : "text-sky-800";

  const subColor = isUnstop ? "text-amber-600"
    : isOnFire ? "text-orange-600"
    : isComplete ? "text-yellow-600"
    : "text-sky-600";

  const emoji = isComplete ? "🌟" : isUnstop ? "🏆" : isOnFire ? "🔥" : "⭐";

  return (
    <div
      className={`relative overflow-hidden leaf-lg border shadow-card-md ${borderColor}`}
      style={{ background: bg }}
    >
      {/* Floating decorations — purely visual */}
      <motion.span aria-hidden="true" className="absolute top-3 left-4 text-xl pointer-events-none select-none leading-none"
        animate={{ y: [0,-6,0], rotate: [0,12,0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>⭐</motion.span>
      <motion.span aria-hidden="true" className="absolute top-2 right-6 text-base pointer-events-none select-none leading-none"
        animate={{ y: [0,-5,0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}>✨</motion.span>

      {/* Content */}
      <div className="relative z-10 px-4 pt-4 pb-4 flex flex-col items-center text-center gap-2">
        <div>
          <h3 className={`font-baloo font-black text-mbase leading-tight ${titleColor}`}>{title}</h3>
          <p className={`font-nunito text-2xs mt-0.5 leading-snug ${subColor}`}>{sub}</p>
        </div>

        {/* Central animated emoji */}
        <motion.span
          className="text-5xl leading-none drop-shadow-lg select-none"
          animate={{ y: [0,-10,0], scale: [1,1.08,1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >{emoji}</motion.span>
      </div>
    </div>
  );
}
