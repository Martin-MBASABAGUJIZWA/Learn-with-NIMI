import { useEffect, useState } from "react";

export default function MotivationMessage({ type }: { type: string }) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const messages: Record<string, string[]> = {
      motivation: [
        "You're a learning star! 🌟",
        "Keep up the great work!",
        "You make learning fun!",
        "Keep your streak alive! 🔥",
      ],
      missionComplete: [
        "WOW! You did it! High five! ✋",
        "AMAZING job! You're so smart!",
        "Mission complete! You're a superstar! 🌟",
      ],
      dayComplete: [
        "CONGRATULATIONS! You finished the whole day! 🎉",
        "Day complete! You're unstoppable!",
      ],
      streakBonus: [
        "🔥 HOT STREAK! Keep it going! 🔥",
        "Look at that streak! You're on a roll!",
      ],
    };

    const randomMessage =
      messages[type]?.[Math.floor(Math.random() * messages[type].length)] || "";
    setMessage(randomMessage);
  }, [type]);

  return (
    <p className="text-lg font-medium text-gray-700" aria-live="polite">
      {message}
    </p>
  );
}
