export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--ds-brand-subtle)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-20 h-20 bg-[var(--ds-brand-soft)] rounded-full" />
        <div className="h-5 w-40 bg-[var(--ds-brand-soft)] rounded-full" />
        <div className="h-3 w-24 bg-[var(--ds-brand-subtle)] rounded-full" />
      </div>
    </div>
  );
}
