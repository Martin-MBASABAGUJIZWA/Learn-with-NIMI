export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 pb-24 w-full animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-[var(--ds-surface-card-hover)] rounded-xl" />
          <div className="h-4 w-64 bg-[var(--ds-surface-card-hover)] rounded-lg" />
        </div>
        <div className="h-9 w-36 bg-[var(--ds-surface-card-hover)] rounded-full" />
      </div>
      {/* 7 activity rows */}
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-16 bg-[var(--ds-surface-card-hover)] rounded-2xl w-full" />
        ))}
      </div>
    </div>
  );
}
