import AppShell from "@/components/layout/AppShell";
import { Bone } from "@/components/ui/Bone";

export default function MissionsLoading() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6 animate-pulse">
        {/* Page header */}
        <div className="space-y-2">
          <Bone className="h-8 w-52" />
          <Bone className="h-4 w-72" />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="h-9 w-24 rounded-full shrink-0" />
          ))}
        </div>

        {/* Mission category cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bone key={i} className="aspect-square leaf-lg" />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
