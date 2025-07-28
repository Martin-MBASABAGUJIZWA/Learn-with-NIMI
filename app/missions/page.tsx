"use client";

import React, { useEffect, useState, useCallback, useMemo, Suspense, useRef } from "react";
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
  BookOpen,
  Sparkles,
  PartyPopper,
  Volume2,
} from "lucide-react";

// Sound effects
const SUCCESS_SOUND = new Howl({ src: ["/sounds/success-ding.mp3"] });
const CLICK_SOUND = new Howl({ src: ["/sounds/click.mp3"] });
const VOICE_SOUNDS: Record<string, Howl> = {
  mission1: new Howl({ src: ["/sounds/voice-mission1.mp3"] }),
  mission2: new Howl({ src: ["/sounds/voice-mission2.mp3"] }),
  mission3: new Howl({ src: ["/sounds/voice-mission3.mp3"] }),
};

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

const KidFriendlyMissionsPage = () => {
  const [missionProgram, setMissionProgram] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [completions, setCompletions] = useState<CompletionData[]>([]);
  const [openVideo, setOpenVideo] = useState<Mission | null>(null);
  const [hostMood, setHostMood] = useState<"happy" | "excited" | "proud" | "default">("happy");
  const [showCelebration, setShowCelebration] = useState(false);
  const [showDayCompleteModal, setShowDayCompleteModal] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [xpProgress, setXPProgress] = useState(0);
  const { user } = useUser();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      // Fetch missions
      const { data: missions } = await supabase
        .from("daily_missions")
        .select("*")
        .order("day_number", { ascending: true })
        .order("order", { ascending: true });

      if (missions) {
        const grouped = groupMissionsByDay(missions);
        setMissionProgram(grouped);
      }

      // Fetch completions if logged in
      if (user?.id) {
        const { data: completions } = await supabase
          .from("mission_completions")
          .select("*")
          .eq("user_id", user.id);
        setCompletions(completions || []);
      }
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
    
    // In a real app, we'd use actual voice recordings for each mission
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
    setXPProgress((prev) => Math.min(prev + mission.points, 100));
    setShowCelebration(true);
    
    // Save to database if logged in
    if (user?.id) {
      await supabase
        .from("mission_completions")
        .insert([{ ...newCompletion, user_id: user.id }]);
    }
    
    // Check if all missions completed - FIXED SYNTAX ERROR HERE
    if (
      currentDayData?.missions.every(m => completedIds.has(m.id)) || 
      currentDayData?.missions.filter(m => !completedIds.has(m.id)).length === 1
    ) {
      setTimeout(() => setShowDayCompleteModal(true), 1500);
    }
    
    setTimeout(() => setShowCelebration(false), 3000);
  };

  const handleOpenVideo = (mission: Mission) => {
    CLICK_SOUND.play();
    setOpenVideo(mission);
  };

  const LazyVideoPlayer = React.lazy(() => import("@/components/LazyVideoPlayer"));

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      <Header />
      
      <main className="max-w-6xl mx-auto flex-grow px-4 py-6">
        {/* Day Selection - Simplified for kids */}
        <section className="mb-6">
          <h2 className="text-3xl font-bold text-center mb-4">
            {currentDayData?.emoji} {currentDayData?.theme}
          </h2>
          
          <div className="flex overflow-x-auto pb-2 gap-2 px-2">
            {missionProgram.slice(0, 7).map(day => (
              <motion.button
                key={day.day}
                onClick={() => {
                  CLICK_SOUND.play();
                  setSelectedDay(day.day);
                }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center p-3 rounded-xl min-w-[80px] ${
                  selectedDay === day.day 
                    ? "bg-purple-600 text-white shadow-lg" 
                    : "bg-white shadow-md"
                }`}
              >
                <span className="text-2xl">{day.emoji}</span>
                <span className="text-lg font-bold">Day {day.day}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Nimi Assistant */}
        <div className="max-w-md mx-auto mb-6">
          <NimiAssistant mood={hostMood} />
        </div>

        {/* Missions Grid - Kid Friendly */}
        {currentDayData && (
          <section className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentDayData.missions.map((mission, index) => {
                const completed = completedIds.has(mission.id);
                const icon = MISSION_ICONS[index % MISSION_ICONS.length];
                
                return (
                  <motion.div
                    key={mission.id}
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className={`relative overflow-hidden ${
                      completed ? "bg-green-50 border-green-200" : "bg-white"
                    }`}>
                      {completed && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                      )}
                      
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{icon}</span>
                          <CardTitle className="text-xl">{mission.title}</CardTitle>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="grid gap-3">
                        <Button 
                          onClick={() => playVoicePreview(mission.id)}
                          variant="ghost" 
                          className="w-full justify-start gap-2"
                          disabled={!!playingVoice}
                        >
                          <Volume2 className="h-5 w-5 text-purple-600" />
                          <span>Hear from Nimi</span>
                          {playingVoice === mission.id && (
                            <motion.span 
                              className="h-2 w-2 bg-purple-600 rounded-full"
                              animate={{ opacity: [0.2, 1, 0.2] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                            />
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => handleOpenVideo(mission)}
                          className="w-full gap-2"
                          variant="gradient"
                        >
                          <Play className="h-5 w-5" /> Watch
                        </Button>
                        
                        {!completed && (
                          <Button
                            onClick={() => completeMission(mission)}
                            className="w-full gap-2"
                            variant="outline"
                          >
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            I Did It!
                          </Button>
                        )}
                        
                        {completed && (
                          <div className="flex items-center justify-center gap-2 text-green-600">
                            <Trophy className="h-5 w-5" />
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
        )}

        {/* Celebration Modals */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl p-8 shadow-xl text-center max-w-xs w-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <div className="text-6xl mb-5 animate-bounce">🎉</div>
                <h2 className="text-2xl font-bold mb-4">Great Job!</h2>
                <p className="mb-6 text-green-700 text-lg font-semibold">
                  You earned {Math.floor(Math.random() * 3) + 1} stars!
                </p>
                <Button onClick={() => setShowCelebration(false)}>
                  Keep Going
                </Button>
              </motion.div>
            </motion.div>
          )}
          
          {showDayCompleteModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl p-8 shadow-xl text-center max-w-xs w-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <div className="text-6xl mb-5 animate-pulse">🏆</div>
                <h2 className="text-2xl font-bold mb-4">Day Complete!</h2>
                <p className="mb-6">
                  You finished all of Day {selectedDay}'s activities!
                </p>
                <Button 
                  onClick={() => {
                    setShowDayCompleteModal(false);
                    setSelectedDay(prev => prev + 1);
                  }}
                  className="gap-2"
                >
                  Go to Day {selectedDay + 1} <ChevronRight className="h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
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