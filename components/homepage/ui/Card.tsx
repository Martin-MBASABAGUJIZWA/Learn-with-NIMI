import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

// Base rounded/bordered surface reused by story cards, info panels, etc.
export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-[var(--ds-surface-card)] rounded-2xl border border-[var(--ds-border-primary)] shadow-sm ${className}`}>
      {children}
    </div>
  );
}
