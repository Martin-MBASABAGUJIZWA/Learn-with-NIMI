import AppShell from "@/components/layout/AppShell";
import { Bone } from "@/components/ui/Bone";

export default function CreateLoading() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Header */}
        <div className="leaf-lg border border-[var(--ds-border-primary)] p-5 space-y-3">
          <Bone className="h-8 w-48" />
          <Bone className="h-4 w-64" />
        </div>

        {/* Tab bar */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-10 flex-1 rounded-full" />
          ))}
        </div>

        {/* Content cards */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bone key={i} className="h-28 leaf-lg w-full" />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
