import AppShell from "@/components/layout/AppShell";
import { Bone } from "@/components/ui/Bone";

export default function HomeLoading() {
  return (
    <AppShell>
      <div className="min-h-screen pb-24">
        {/* Hero skeleton */}
        <Bone className="w-full rounded-none" style={{ height: 380 }} />

        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 flex flex-col xl:flex-row gap-6">
          {/* Main column */}
          <div className="flex-1 space-y-8">
            {/* Activity board */}
            <div className="leaf-lg border border-[var(--ds-border-primary)] p-5 space-y-4">
              <Bone className="h-7 w-48" />
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Bone key={i} className="aspect-square leaf" />
                ))}
              </div>
            </div>

            {/* Stories row */}
            <div className="leaf-lg border border-[var(--ds-border-primary)] p-5 space-y-4">
              <Bone className="h-7 w-56" />
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Bone key={i} className="shrink-0 w-[160px] h-[220px] leaf" />
                ))}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-full xl:w-[284px] space-y-5">
            <Bone className="h-[280px] leaf-lg" />
            <Bone className="h-[180px] leaf-lg" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
