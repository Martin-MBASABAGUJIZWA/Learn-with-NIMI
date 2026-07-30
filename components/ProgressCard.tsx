// /components/ProgressCard.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProgressCardProps {
  completedCount: number;
  totalMissions: number;
}

export default function ProgressCard({ completedCount, totalMissions }: ProgressCardProps) {
  const progressValue = totalMissions > 0 ? (completedCount / totalMissions) * 100 : 0;

  return (
    <Card className="bg-gradient-to-r from-yellow-100 to-orange-100 border-none shadow-xl max-w-2xl mx-auto mb-8">
      <CardContent className="p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8 text-yellow-600 mr-3 animate-bounce" />
          <span className="text-xl font-bold text-[var(--ds-text-primary)]">Overall Progress</span>
          <Sparkles className="w-8 h-8 text-pink-500 ml-3 animate-spin" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold text-[var(--ds-text-primary)]">Missions Completed</span>
          <span className="text-lg font-bold text-orange-600">
            {completedCount}/{totalMissions} 🎉
          </span>
        </div>
        <Progress value={progressValue} className="h-4 bg-[var(--ds-surface-card)]/50" />
        <p className="mt-4 text-lg text-[var(--ds-text-primary)] font-medium">
          You're doing amazing! Keep going, little explorer! 🌟
        </p>
      </CardContent>
    </Card>
  );
}
