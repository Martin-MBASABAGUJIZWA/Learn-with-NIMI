"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "@/lib/supabaseClient";
import confetti from "canvas-confetti";
import { Howl } from "howler";

import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import NimiAssistant from "@/components/NimiAssistant";
import { useUser } from "@/contexts/UserContext";

import {
  CheckCircle,
  Star,
  Play,
  Trophy,
  ChevronRight,
  Sparkles,
  Volume2,
} from "lucide-react";

// Sounds
const SUCCESS_SOUND = new Howl({ src: ["/sounds/success-ding.mp3"], volume: 0.7 });
const CLICK_SOUND = new Howl({ src: ["/sounds/click.mp3"], volume: 0.7 });

const VOICE_SOUNDS: Record<string, Howl> = {
  mission1: new Howl({ src: ["/sounds/voice-mission1.mp3"], volume: 0.8 }),
  mission2: new Howl({ src: ["/sounds/voice-mission2.mp3"], volume: 0.8 }),
  mission3: new Howl({ src: ["/sounds/voice-mission3.mp3"], volume: 0.8 }),
};

const CELEBRATION_VOICES = [
  new Howl({ src: ["/sounds/nimi-great-job1.mp3"], volume: 0.8 }),
  new Howl({ src: ["/sounds/nimi-great-job2.mp3"], volume: 0.8 }),
];

const DAY_COMPLETE_VOICES = [
  new Howl({ src: ["/sounds/nimi-day-complete1.mp3"], volume: 0.8 }),
  new Howl({ src: ["/sounds/nimi-day-complete2.mp3"], volume: 0.8 }),
];

interface Mission {
  id: string;
  day_number: number;
  title: string;
  description: string;
  duration: string;
  points: number;
  video_url: string;
  order: number;
  theme?: string;
  emoji?: string;
  archived: boolean;
}

interface DayData {
  day: number;
  title: string;
  theme: string;
  emoji: string;
  missions: Mission[];
}

interface CompletionData {
  mission_id: string;
  completed_at: string;
}

const MISSION_ICONS = ["🎵", "🎨", "📖", "🧩", "🎭", "🖍️"];

const LazyVideoPlayer = React.lazy(() => import("@/components/LazyVideoPlayer"));

const CelebrationModal = ({ onClose }: { onClose: () => void }) => {
  useEffect(() => {
    const voice = CELEBRATION_VOICES[Math.floor(Math.random() * CELEBRATION_VOICES.length)];
    voice.play();
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="alert"
      aria-live="polite"
    >
      <motion.div
        className="bg-white rounded-xl p-8 shadow-xl text-center max-w-xs w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-6xl mb-5 select-none"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [1, 0.8, 1]
          }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          aria-hidden="true"
        >
          🎉
        </motion.div>

        <h2 className="text-2xl font-bold mb-4">Great Job!</h2>
        <p className="mb-6 text-green-700 text-lg font-semibold">
          You earned {Math.floor(Math.random() * 3) + 1} stars!
        </p>
        <Button onClick={onClose} aria-label="Keep going button">
          Keep Going
        </Button>
      </motion.div>
    </motion.div>
  );
};

const DayCompleteModal = ({
  day,
  onClose,
  onNextDay,
  isLastDay,
}: {
  day: number;
  onClose: () => void;
  onNextDay: () => void;
  isLastDay: boolean;
}) => {
  useEffect(() => {
    const voice = DAY_COMPLETE_VOICES[Math.floor(Math.random() * DAY_COMPLETE_VOICES.length)];
    voice.play();
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="alert"
      aria-live="polite"
    >
      <motion.div
        className="bg-white rounded-xl p-8 shadow-xl text-center max-w-xs w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-6xl mb-5 select-none"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [1, 0.85, 1]
          }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          aria-hidden="true"
        >
          🏆
        </motion.div>

        <h2 className="text-2xl font-bold mb-4">Day Complete!</h2>
        <p className="mb-6">You finished all of Day {day}&apos;s activities!</p>

        <div className="flex justify-center gap-4">
          {!isLastDay && (
            <Button
              onClick={() => {
                onNextDay();
                onClose();
              }}
              className="gap-2"
              aria-label={`Go to Day ${day + 1}`}
            >
              Go to Day {day + 1} <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
          <Button onClick={onClose} aria-label="Close day complete modal">
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const KidFriendlyMissionsPage = () => {
  const [missionProgram, setMissionProgram] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [completions, setCompletions] = useState<CompletionData[]>([]);
  const [openVideo, setOpenVideo] = useState<Mission | null>(null);
  const [hostMood, setHostMood] = useState<"happy" | "excited" | "proud" | "default">("happy");
  const [showCelebration, setShowCelebration] = useState(false);
  const [showDayCompleteModal, setShowDayCompleteModal] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [loadingCompletions, setLoadingCompletions] = useState(true);
  const { user } = useUser();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoadingMissions(true);
      setLoadingCompletions(true);

      const { data: missions } = await supabase
        .from("daily_missions")
        .select("*")
        .order("day_number", { ascending: true })
        .order("order", { ascending: true });

      if (missions) {
        const grouped = groupMissionsByDay(missions);
        setMissionProgram(grouped);
      }
      setLoadingMissions(false);

      if (user?.id) {
        const { data: completions } = await supabase
          .from("mission_completions")
          .select("*")
          .eq("user_id", user.id);
        setCompletions(completions || []);
      }
      setLoadingCompletions(false);
    };

    fetchData();
  }, [user]);

  const groupMissionsByDay = (missions: Mission[]) => {
    const active = missions.filter((m) => !m.archived);
    const grouped: Record<number, DayData> = {};

    active.forEach((m) => {
      if (!grouped[m.day_number]) {
        grouped[m.day_number] = {
          day: m.day_number,
          title: `Day ${m.day_number}`,
          theme: m.theme || "Fun Learning",
          emoji: m.emoji || "🌟",
          missions: [],
        };
      }
      grouped[m.day_number].missions.push(m);
    });

    return Object.values(grouped).sort((a, b) => a.day - b.day);
  };

  const completedIds = useMemo(
    () => new Set(completions.map((c) => c.mission_id)),
    [completions]
  );

  const currentDayData = useMemo(
    () => missionProgram.find((d) => d.day === selectedDay),
    [missionProgram, selectedDay]
  );

  const playVoicePreview = (missionId: string) => {
    CLICK_SOUND.play();
    setPlayingVoice(missionId);

    // Randomly pick a voice sound for demo
    const voiceKey = `mission${Math.floor(Math.random() * 3) + 1}`;
    VOICE_SOUNDS[voiceKey].play();

    setTimeout(() => setPlayingVoice(null), 3000);
  };

  const completeMission = async (mission: Mission) => {
    CLICK_SOUND.play();
    setHostMood("excited");

    // Play celebration sound
    SUCCESS_SOUND.play();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });

    // Add to completions
    const newCompletion = {
      mission_id: mission.id,
      completed_at: new Date().toISOString(),
    };

    setCompletions((prev) => [...prev, newCompletion]);
    setShowCelebration(true);

    // Save to database if logged in
    if (user?.id) {
      await supabase
        .from("mission_completions")
        .insert([{ ...newCompletion, user_id: user.id }]);
    }

    // Delay to show celebration then check day complete
    setTimeout(() => {
      setShowCelebration(false);

      // Check if all missions completed for day
      const allCompleted = currentDayData?.missions.every(m => completedIds.has(m.id) || m.id === mission.id);
      if (allCompleted) {
        setShowDayCompleteModal(true);
      }
    }, 3000);
  };

  const handleOpenVideo = (mission: Mission) => {
    CLICK_SOUND.play();
    setOpenVideo(mission);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      <Header />

      <main className="max-w-6xl mx-auto flex-grow px-4 py-6">
        {/* Day Selection */}
        {loadingMissions ? (
          <div className="flex gap-3 overflow-x-auto px-4 py-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-purple-200 rounded-xl min-w-[80px] h-20 animate-pulse"
              />
            ))}
          </div>
        ) : missionProgram.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-lg">No missions available yet. Please check back soon!</div>
        ) : (
          <section className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 select-none" aria-live="polite">
              {currentDayData?.emoji} {currentDayData?.theme}
            </h2>

            <div className="flex overflow-x-auto pb-2 gap-3 px-4 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-purple-100">
              {missionProgram.slice(0, 7).map(day => (
                <motion.button
                  key={day.day}
                  onClick={() => {
                    CLICK_SOUND.play();
                    setSelectedDay(day.day);
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center p-4 rounded-xl min-w-[90px]
                    ${selectedDay === day.day
                      ? "bg-purple-600 text-white shadow-lg"
                      : "bg-white shadow-md"}
                    focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500`}
                  aria-label={`Select day ${day.day} missions, theme ${day.theme}`}
                >
                  <span className="text-4xl select-none" aria-hidden="true">{day.emoji}</span>
                  <span className="text-xl font-bold select-none">Day {day.day}</span>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Nimi Assistant */}
        <div className="max-w-md mx-auto mb-6">
          <NimiAssistant mood={hostMood} />
        </div>

        {/* Missions Grid */}
        {loadingMissions ? (
          <div className="grid grid-cols-1 gap-5 max-w-2xl mx-auto px-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-purple-100 animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : currentDayData && currentDayData.missions.length > 0 ? (
          <section className="max-w-2xl mx-auto px-2">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {currentDayData.missions.map((mission, index) => {
                const completed = completedIds.has(mission.id);
                const icon = MISSION_ICONS[index % MISSION_ICONS.length];

                return (
                  <motion.div
                    key={mission.id}
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    tabIndex={-1}
                  >
                    <Card
                      className={`relative overflow-hidden
                        ${completed ? "bg-green-50 border-green-200" : "bg-white"}
                        focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400`}
                    >
                      {completed && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white p-1 rounded-full" aria-hidden="true">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                      )}

                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-5xl select-none">{icon}</span>
                          <CardTitle className="text-2xl">{mission.title}</CardTitle>
                        </div>
                      </CardHeader>

                      <CardContent className="grid gap-3">
                        <Button
                          onClick={() => playVoicePreview(mission.id)}
                          variant="ghost"
                          className="w-full justify-center gap-3 py-4 text-xl min-h-[64px]"
                          disabled={!!playingVoice}
                          aria-label={`Hear Nimi say mission: ${mission.title}`}
                        >
                          <Volume2 className="h-6 w-6 text-purple-600" aria-hidden="true" />
                          Hear from Nimi
                          {playingVoice === mission.id && (
                            <motion.span
                              className="h-4 w-4 bg-purple-600 rounded-full"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              aria-hidden="true"
                            />
                          )}
                        </Button>

                        <Button
                          onClick={() => handleOpenVideo(mission)}
                          variant="gradient"
                          className="w-full gap-3 py-4 text-xl min-h-[64px]"
                          aria-label={`Watch video for mission: ${mission.title}`}
                        >
                          <Play className="h-7 w-7" aria-hidden="true" />
                          Watch
                        </Button>

                        {!completed && (
                          <Button
                            onClick={() => completeMission(mission)}
                            variant="outline"
                            className="w-full gap-3 py-4 text-xl min-h-[64px]"
                            aria-label={`Mark mission ${mission.title} as completed`}
                          >
                            <Sparkles className="h-7 w-7 text-yellow-500" aria-hidden="true" />
                            I Did It!
                          </Button>
                        )}

                        {completed && (
                          <div
                            className="flex items-center justify-center gap-3 text-green-600 text-xl font-semibold"
                            aria-live="polite"
                          >
                            <Trophy className="h-7 w-7" aria-hidden="true" />
                            <span>Great job!</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="text-center py-20 text-gray-600 text-lg select-none">
            No missions scheduled for this day.
          </div>
        )}

        {/* Celebration Modal */}
        <AnimatePresence>
          {showCelebration && (
            <CelebrationModal onClose={() => setShowCelebration(false)} />
          )}
        </AnimatePresence>

        {/* Day Complete Modal */}
        <AnimatePresence>
          {showDayCompleteModal && (
            <DayCompleteModal
              day={selectedDay}
              onClose={() => setShowDayCompleteModal(false)}
              onNextDay={() => setSelectedDay(prev => Math.min(prev + 1, missionProgram.length))}
              isLastDay={selectedDay >= missionProgram.length}
            />
          )}
        </AnimatePresence>

        {/* Video Player */}
        <AnimatePresence>
          {openVideo && (
            <Suspense fallback={
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
                <p className="text-white">Loading video...</p>
              </div>
            }>
              <LazyVideoPlayer
                videoUrl={openVideo.video_url}
                onClose={() => setOpenVideo(null)}
              />
            </Suspense>
          )}
        </AnimatePresence>
      </main>

      <BottomNavigation />
      <Footer />
    </div>
  );
};

export default KidFriendlyMissionsPage;
