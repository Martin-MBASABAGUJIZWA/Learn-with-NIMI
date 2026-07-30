import { Bone } from "@/components/ui/Bone";

export default function InviteLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="w-full px-5 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100" />
          <Bone className="h-5 w-24" />
        </div>
        <Bone className="h-4 w-36" />
      </header>

      <main className="max-w-2xl mx-auto px-5 pt-10 pb-20 space-y-8">
        {/* Hero */}
        <div className="flex flex-col items-center gap-4">
          <Bone className="w-24 h-24 rounded-full" />
          <Bone className="h-6 w-44 rounded-full" />
          <Bone className="h-10 w-72" />
          <Bone className="h-10 w-56" />
          <Bone className="h-4 w-80" />
          <Bone className="h-4 w-64" />
        </div>

        {/* Reward callout */}
        <div className="bg-emerald-100 leaf-lg p-6 space-y-3">
          <Bone className="h-7 w-44 mx-auto" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-3/4 mx-auto" />
          <div className="flex items-center justify-center gap-10 pt-2">
            <div className="flex flex-col items-center gap-2">
              <Bone className="w-9 h-9 rounded-full" />
              <Bone className="h-3 w-12" />
              <Bone className="h-4 w-20" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Bone className="w-9 h-9 rounded-full" />
              <Bone className="h-3 w-12" />
              <Bone className="h-4 w-20" />
            </div>
          </div>
        </div>

        {/* CTA button */}
        <Bone className="h-16 w-full rounded-2xl" />
        <Bone className="h-4 w-56 mx-auto" />

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[var(--ds-surface-card)] border border-[var(--ds-border-primary)] leaf p-5 flex items-start gap-4">
              <Bone className="w-11 h-11 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
