export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 bg-[var(--ds-surface-card-hover)] rounded-full" />
        <div className="h-7 w-40 bg-[var(--ds-surface-card-hover)] rounded-xl" />
      </div>
      {/* Mission cards */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-[var(--ds-surface-card-hover)] rounded-3xl w-full" />
        ))}
      </div>
    </div>
  );
}
