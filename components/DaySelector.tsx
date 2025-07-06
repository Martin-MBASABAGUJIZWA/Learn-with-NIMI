// /components/DaySelector.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface DaySelectorProps {
  days: any[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

export default function DaySelector({ days, selectedDay, onSelectDay }: DaySelectorProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        🗓️ Choose Your Adventure Day
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {days.map((day) => {
          const isUnlocked = true; // Customize this logic if needed
          return (
            <Button
              key={day.day}
              disabled={!isUnlocked}
              variant={selectedDay === day.day ? "default" : "outline"}
              className={`h-20 flex flex-col relative overflow-hidden ${
                selectedDay === day.day
                  ? "bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-xl scale-105"
                  : "border-2 border-gray-300 text-gray-700 hover:bg-gradient-to-br hover:from-orange-100 hover:to-pink-100 hover:border-orange-300"
              }`}
              onClick={() => onSelectDay(day.day)}
            >
              <div className="text-2xl">{day.emoji}</div>
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold">Day {day.day}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
