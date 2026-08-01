"use client";

export function RefreshingBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] overflow-hidden pointer-events-none">
      <div
        className="h-full animate-progress-bar"
        style={{ background: "var(--nimi-green)" }}
      />
      <style>{`
        @keyframes progress-bar {
          0%   { transform: translateX(-100%); }
          60%  { transform: translateX(-10%); }
          100% { transform: translateX(0%); }
        }
        .animate-progress-bar {
          animation: progress-bar 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
}
