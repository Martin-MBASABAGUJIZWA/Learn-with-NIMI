import AppShell from "@/components/layout/AppShell";
import { Bone } from "@/components/ui/Bone";

export default function HelpLoading() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto w-full pb-24 space-y-5 mt-4">
        <Bone className="h-10 w-56" />
        <Bone className="h-12 w-full rounded-xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="leaf border border-[var(--ds-border-primary)] p-5 space-y-3">
            <Bone className="h-5 w-1/2" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-4/5" />
          </div>
        ))}
      </div>
    </AppShell>
  );
}
