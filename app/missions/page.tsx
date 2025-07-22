"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  Suspense,
  useRef,
  SyntheticEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "@/lib/supabaseClient";
import MotivationMessage from "@/components/MotivationMessage";
import confetti from "canvas-confetti";

import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import NimiAssistant from "@/components/NimiAssistant";
import { saveGuestProgress, loadGuestProgress } from "@/lib/guestProgress";
import { useUser } from "@/contexts/UserContext";

import {
  CheckCircle,
  Clock,
  Star,
  Play,
  Trophy,
  Lock,
  Calendar,
  Zap,
  ChevronRight,
  Flame,
  BookOpen,
  Sparkles,
  PartyPopper,
  Lightbulb,
  Bookmark,
  Undo2,
} from "lucide-react";

// Sound effect import or URL to ding sound
const SUCCESS_SOUND_URL = "/sounds/success-ding.mp3";

interface Mission {
  id: string;
  day_number: number;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  points: number;
  video_url: string;
  order: number;
  theme?: string;
  emoji?: string;
  archived: boolean;
  mission_date: string;
}
interface UserContextType {
  user: UserType | null;
  profile: ProfileType | null;
  loading: boolean;
  updateUser: (user: UserType | null) => void;
  updateProfile: (profile: ProfileType | null) => void;
  isGuest: boolean;
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
  stars_earned: number;
}

interface UserProgress {
  current_day: number;
  unlocked_days: number[];
  daily_streak?: number;
  last_completed_date?: string;
}

interface Storybook {
  id: string;
  day_number: number;
  title: string;
  content: string;
}

type HostMood =
  | "happy"
  | "excited"
  | "proud"
  | "default"
  | "celebrating"
  | "thoughtful";

const STICKER_REWARDS: Record<number, { alt: string; src: string }> = {
  1: { alt: "Star Sticker", src: "/stickers/star.png" },
  2: { alt: "Sun Sticker", src: "/stickers/sun.png" },
  3: { alt: "Rocket Sticker", src: "/stickers/rocket.png" },
  4: { alt: "Rainbow Sticker", src: "/stickers/rainbow.png" },
  5: { alt: "Cupcake Sticker", src: "/stickers/cupcake.png" },
};

const getRandomMessage = (type: string) => {
  const messages: Record<string, string[]> = {
    dayComplete: [
      "CONGRATULATIONS! You finished the whole day! 🎉",
      "Day complete! You're unstoppable!",
    ],
    streakBonus: [
      "🔥 HOT STREAK! Keep it going! 🔥",
      "Look at that streak! You're on a roll!",
    ],
  };
  return messages[type][Math.floor(Math.random() * messages[type].length)];
};

interface XPFeedbackOverlayProps {
  showCelebration: boolean;
  earnedXP: number | null;
  xpProgress: number;
  handleUndo: () => void;
  undoData: any;
  stickerDay?: number | null;
  onDownloadSticker: (day: number) => void;
  rewardMessage?: string;
}

const XPFeedbackOverlay = ({
  showCelebration,
  earnedXP,
  xpProgress,
  handleUndo,
  undoData,
  stickerDay = null,
  onDownloadSticker,
  rewardMessage = "Good Job! You completed today's mission! 🎉🎈",
}: XPFeedbackOverlayProps) => {
  useEffect(() => {
    if (showCelebration) {
      const audio = new Audio(SUCCESS_SOUND_URL);
      audio.play().catch(() => {});
      if ('vibrate' in navigator) navigator.vibrate(50); // Haptic feedback
    }
  }, [showCelebration]);

  return (
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-live="polite"
          role="alert"
        >
          <motion.div
            className="bg-white rounded-xl p-8 shadow-xl text-center max-w-xs w-full relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            tabIndex={-1}
            aria-label="Mission Completion Reward"
          >
            <div className="text-6xl mb-5 animate-pulse select-none" aria-hidden="true">
              🎉🎊🎈
            </div>
            <h2 className="text-2xl font-bold mb-4">{rewardMessage}</h2>
            <p className="mb-6 text-green-700 text-lg font-semibold">
              +{earnedXP} XP Earned!
            </p>

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Your Progress</span>
              <span className="text-sm font-medium">{xpProgress}%</span>
            </div>
            <Progress value={xpProgress} className="mb-6 h-4" />

            {stickerDay && STICKER_REWARDS[stickerDay] && (
              <div className="mb-6">
                <img
                  src={STICKER_REWARDS[stickerDay].src}
                  alt={STICKER_REWARDS[stickerDay].alt}
                  className="mx-auto mb-3 w-32 h-32 select-none"
                  draggable={false}
                  aria-hidden="true"
                  loading="lazy"
                />
                <Button
                  variant="outline"
                  onClick={() => onDownloadSticker(stickerDay)}
                  aria-label={`Download sticker for day ${stickerDay}`}
                >
                  Download Your Sticker
                </Button>
              </div>
            )}

            {undoData && (
              <Button
                variant="outline"
                onClick={handleUndo}
                className="inline-flex items-center gap-2"
                aria-label="Undo mission completion"
              >
                <Undo2 className="w-4 h-4" /> Undo Completion
              </Button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const LazyVideoPlayerWrapper = ({
  videoUrl,
  missionId,
  onClose,
  onVideoEnded,
  videoTimes,
  setVideoTimes,
  readyToComplete,
  setReadyToComplete,
}: {
  videoUrl: string;
  missionId: string;
  onClose: () => void;
  onVideoEnded: () => void;
  videoTimes: Record<string, number>;
  setVideoTimes: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  readyToComplete: Record<string, boolean>;
  setReadyToComplete: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTimeRef = useRef<number>(videoTimes[missionId] || 0);
  const [videoError, setVideoError] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' ? 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  // Lightweight video preload
  useEffect(() => {
    const audioPreload = new Audio();
    audioPreload.src = videoUrl;
    audioPreload.load();
    return () => {
      audioPreload.src = '';
    };
  }, [videoUrl]);

  useEffect(() => {
    if (videoRef.current && lastTimeRef.current) {
      videoRef.current.currentTime = lastTimeRef.current;
    }
  }, [missionId]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    let lastTime = lastTimeRef.current;

    if (currentTime < lastTime) {
      lastTime = currentTime;
      lastTimeRef.current = currentTime;
      setVideoTimes((prev) => ({ ...prev, [missionId]: currentTime }));
    } else if (currentTime > lastTime + 0.5) {
      videoRef.current.currentTime = lastTime;
    } else {
      lastTime = currentTime;
      lastTimeRef.current = currentTime;
      setVideoTimes((prev) => ({ ...prev, [missionId]: currentTime }));
    }
  };

  const handleSeeking = () => {
    if (!videoRef.current) return;
    if (videoRef.current.currentTime > lastTimeRef.current + 0.5) {
      videoRef.current.currentTime = lastTimeRef.current;
    }
  };

  const handleEnded = () => {
    setReadyToComplete((prev) => ({ ...prev, [missionId]: true }));
    onVideoEnded();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {videoError ? (
        <div className="bg-white p-6 rounded-xl text-center max-w-md">
          <p className="text-red-500 mb-4">Video unavailable. Try again later.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          className="max-w-full max-h-[80vh] rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          playsInline
          muted={false}
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onSeeking={handleSeeking}
          onError={() => setVideoError(true)}
        />
      )}
    </div>
  );
};

export default function MissionsPage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [xpProgress, setXPProgress] = useState(0);
  const [earnedXP, setEarnedXP] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [undoData, setUndoData] = useState<{
    mission: Mission;
    timeoutId: NodeJS.Timeout;
  } | null>(null);
  const [missionProgram, setMissionProgram] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [storybook, setStorybook] = useState<Storybook | null>(null);
  const [showStorybook, setShowStorybook] = useState(false);
  const [completions, setCompletions] = useState<CompletionData[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    current_day: 1,
    unlocked_days: [1],
    daily_streak: 0,
    last_completed_date: "",
  });
  const [showDayCompleteModal, setShowDayCompleteModal] = useState(false);
  const [newlyUnlockedDay, setNewlyUnlockedDay] = useState<number | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [completingMissionId, setCompletingMissionId] = useState<string | null>(null);
  const [openVideo, setOpenVideo] = useState<Mission | null>(null);
  const [hostMood, setHostMood] = useState<HostMood>("default");
  const [buttonStates, setButtonStates] = useState<
    Record<string, "idle" | "completing" | "completed">
  >({});
  const [recentlyCompleted, setRecentlyCompleted] = useState<string | null>(null);
  const [readyToComplete, setReadyToComplete] = useState<Record<string, boolean>>({});
  const [videoTimes, setVideoTimes] = useState<Record<string, number>>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [devMode, setDevMode] = useState(false);

  // Toggle dev mode with triple tap
  useEffect(() => {
    let tapCount = 0;
    let timer: NodeJS.Timeout;

    const handleTap = () => {
      tapCount++;
      if (tapCount === 3) {
        setDevMode(prev => !prev);
        tapCount = 0;
      }
      clearTimeout(timer);
      timer = setTimeout(() => { tapCount = 0; }, 1000);
    };

    window.addEventListener('click', handleTap);
    return () => window.removeEventListener('click', handleTap);
  }, []);

  const todayDate = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  // Batch fetch data
  useEffect(() => {
    const fetchSessionAndData = async () => {
      setLoadingUser(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ? { id: session.user.id } : null);

        if (session?.user) {
          await Promise.all([
            fetchMissions(),
            fetchUserProgress(),
            fetchCompletions()
          ]);
        } else {
          await fetchMissions();
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchSessionAndData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id });
        } else {
          setUser(null);
        }
      }
    );
    return () => authListener.subscription.unsubscribe();
  }, []);

  const filterAndGroupMissions = useCallback((missions: Mission[]) => {
    const active = missions.filter((m) => !m.archived);
    const grouped: Record<number, DayData> = {};
    active.forEach((m) => {
      if (!grouped[m.day_number]) {
        grouped[m.day_number] = {
          day: m.day_number,
          title: `Day ${m.day_number}`,
          theme: m.theme || "Learning & Fun",
          emoji: m.emoji || "🌟",
          missions: [],
        };
      }
      grouped[m.day_number].missions.push(m);
    });
    return Object.values(grouped).sort((a, b) => a.day - b.day);
  }, []);

  const isMissionLocked = useCallback(
    (mission: Mission) => {
      const md = new Date(mission.mission_date);
      md.setHours(0, 0, 0, 0);
      return md > todayDate;
    },
    [todayDate]
  );

  const isDayLocked = useCallback(
    (dayNumber: number) => {
      if (!userProgress.unlocked_days.includes(dayNumber)) return true;
      const day = missionProgram.find((d) => d.day === dayNumber);
      if (!day) return true;
      if (day.missions.every((m) => isMissionLocked(m))) return true;
      return false;
    },
    [missionProgram, isMissionLocked, userProgress.unlocked_days]
  );

  const fetchWithRetry = async (fn: Function, retries = 2) => {
    try {
      return await fn();
    } catch (err) {
      if (retries > 0) {
        await new Promise(res => setTimeout(res, 1000));
        return fetchWithRetry(fn, retries - 1);
      }
      throw err;
    }
  };

  const fetchMissions = useCallback(async () => {
    try {
      const { data, error } = await fetchWithRetry(() => 
        supabase
          .from("daily_missions")
          .select("*")
          .order("day_number", { ascending: true })
          .order("order", { ascending: true })
      );
      
      if (error) throw error;
      if (data) {
        const grouped = filterAndGroupMissions(data);
        setMissionProgram(grouped);
        setSelectedDay((prev) => {
          if (prev !== null) return prev;
          if (grouped.length === 0) return null;
          const unlockedDays =
            userProgress.unlocked_days && userProgress.unlocked_days.length > 0
              ? userProgress.unlocked_days
              : [1];
          const selectDay = unlockedDays.includes(userProgress.current_day)
            ? userProgress.current_day
            : unlockedDays[0];
          return selectDay;
        });
      }
    } catch (error) {
      console.error("Error fetching missions:", error);
    }
  }, [filterAndGroupMissions, userProgress]);

  const fetchUserProgress = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await fetchWithRetry(() => 
        supabase
          .from("student_progress")
          .select("*")
          .eq("user_id", user.id)
          .single()
      );
      if (error) throw error;
      if (data) setUserProgress(data);
    } catch (error) {
      console.error("Error fetching user progress:", error);
    }
  }, [user]);

  const fetchCompletions = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await fetchWithRetry(() => 
        supabase
          .from("mission_completions")
          .select("*")
          .eq("user_id", user.id)
      );
      if (error) throw error;
      setCompletions(data ?? []);
    } catch (error: any) {
      console.error("Error fetching completions:", error);
    }
  }, [user]);

  const fetchStorybookByDay = useCallback(async (day: number) => {
    try {
      const { data, error } = await fetchWithRetry(() => 
        supabase
          .from("storybook")
          .select("*")
          .eq("day_number", day)
          .single()
      );
      if (error && error.code !== "PGRST116") throw error;
      setStorybook(data ?? null);
    } catch (error) {
      console.error("Error fetching storybook:", error);
    }
  }, []);

  useEffect(() => {
    if (selectedDay !== null) fetchStorybookByDay(selectedDay);
    else setStorybook(null);
  }, [selectedDay, fetchStorybookByDay]);

  useEffect(() => {
    if (
      selectedDay === null &&
      userProgress.unlocked_days.length &&
      missionProgram.length
    ) {
      const highestUnlocked = Math.max(...userProgress.unlocked_days);
      if (missionProgram.some((d) => d.day === highestUnlocked))
        setSelectedDay(highestUnlocked);
      else setSelectedDay(missionProgram[0].day);
    }
  }, [userProgress.unlocked_days, missionProgram, selectedDay]);

  useEffect(() => {
    setReadyToComplete({});
    setVideoTimes({});
  }, [selectedDay]);

  const completedIds = useMemo(
    () => new Set(completions.map((c) => c.mission_id)),
    [completions]
  );
  const currentDayData = useMemo(
    () => missionProgram.find((d) => d.day === selectedDay),
    [missionProgram, selectedDay]
  );

  const streak = useMemo(() => {
    if (
      !userProgress.daily_streak ||
      !userProgress.last_completed_date ||
      completions.length === 0
    )
      return 0;
    const lastDate = new Date(userProgress.last_completed_date);
    lastDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff <= 1 ? userProgress.daily_streak : 0;
  }, [userProgress, completions]);

  const completeMission = async (mission: Mission) => {
    if (!user) {
      setCompletionError("Log in to save your progress and complete missions!");
      setHostMood("default");
      return;
    }
    if (completedIds.has(mission.id)) return;
    if (!readyToComplete[mission.id]) {
      setCompletionError("Please watch the entire video before completing.");
      setHostMood("default");
      return;
    }

    setCompletionError(null);
    setCompletingMissionId(mission.id);
    setButtonStates((prev) => ({ ...prev, [mission.id]: "completing" }));
    setHostMood("excited");

    try {
      const { data, error } = await fetchWithRetry(() => 
        supabase.rpc("complete_mission", {
          user_id: user.id,
          mission_id: mission.id,
          current_day: userProgress.current_day,
          unlocked_days: userProgress.unlocked_days,
        })
      );

      if (error) throw error;

      setCompletions((prev) => [
        ...prev,
        {
          mission_id: mission.id,
          completed_at: new Date().toISOString(),
          stars_earned: 1,
        },
      ]);

      setRecentlyCompleted(mission.id);
      confetti({particleCount: 50, spread: 90, origin: { y: 0.6 }});

      setButtonStates((prev) => ({ ...prev, [mission.id]: "completed" }));

      const newProgress = Math.min(xpProgress + mission.points, 100);
      setXPProgress(newProgress);
      setEarnedXP(mission.points);
      setShowCelebration(true);
      const timeoutId = setTimeout(() => {
        setShowCelebration(false);
        setEarnedXP(null);
      }, 4000);
      setUndoData({ mission, timeoutId });

      const dayMissions =
        missionProgram.find((d) => d.day === mission.day_number)?.missions || [];
      const updatedCompletedIds = new Set(completedIds);
      updatedCompletedIds.add(mission.id);
      const allCompleted =
        dayMissions.length > 0 &&
        dayMissions.every((m) => updatedCompletedIds.has(m.id));

      if (allCompleted && data?.user_progress) {
        setUserProgress(data.user_progress);

        if (data.user_progress.current_day > userProgress.current_day) {
          setNewlyUnlockedDay(data.user_progress.current_day);
          setShowDayCompleteModal(true);
          setHostMood("celebrating");
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        }
      }
    } catch (error) {
      setCompletionError("Oops! Let's try again.");
      setHostMood("default");
      setButtonStates((prev) => ({ ...prev, [mission.id]: "idle" }));
    } finally {
      setCompletingMissionId(null);
    }
  };

  const handleVideoEnded = () => {
    if (!openVideo) return;
    setReadyToComplete((prev) => ({ ...prev, [openVideo.id]: true }));
  };

  const handleOpenVideo = (mission: Mission) => {
    setOpenVideo(mission);
    setReadyToComplete((prev) => ({ ...prev, [mission.id]: false }));
    setHostMood("default");
  };

  const handleUndo = () => {
    if (undoData) {
      clearTimeout(undoData.timeoutId);
      setCompletions((prev) =>
        prev.filter((c) => c.mission_id !== undoData.mission.id)
      );
      setButtonStates((prev) => ({ ...prev, [undoData.mission.id]: "idle" }));
      setXPProgress((prev) => Math.max(0, prev - (undoData.mission.points || 0)));
      setShowCelebration(false);
      setEarnedXP(null);
      setUndoData(null);
      setHostMood("default");
    }
  };

  const downloadSticker = (day: number) => {
    const sticker = STICKER_REWARDS[day];
    if (!sticker) return;

    fetch(sticker.src)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sticker-day-${day}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        
        // Log download event if user is logged in
        if (user?.id) {
          supabase
            .from('sticker_downloads')
            .insert({ user_id: user.id, day_number: day })
            .then(({ error }) => {
              if (error) console.error('Error logging sticker download:', error);
            });
        }
      })
      .catch(() => {
        alert("Sorry, the sticker cannot be downloaded right now.");
      });
  };

  function saveGuestProgress(newProgress) {
    if (typeof window === "undefined") return;
    const current = localStorage.getItem("nimi_guest_progress");
    let progress = current ? JSON.parse(current) : { points: 0, completedMissions: [] };

    progress.points += newProgress.points || 0;
    progress.completedMissions = Array.from(new Set([
      ...progress.completedMissions,
      ...(newProgress.completedMissions || []),
    ]));

    localStorage.setItem("nimi_guest_progress", JSON.stringify(progress));
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading user session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 font-sans select-none">
      <Header />

      {devMode && (
        <div className="fixed bottom-4 left-4 bg-white p-2 shadow-lg z-50 rounded-lg">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCompletions([])}
            >
              Reset Progress
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowCelebration(true)}
            >
              Test Celebration
            </Button>
          </div>
        </div>
      )}

      <XPFeedbackOverlay
        showCelebration={showCelebration}
        earnedXP={earnedXP}
        xpProgress={xpProgress}
        handleUndo={handleUndo}
        undoData={undoData}
        stickerDay={newlyUnlockedDay}
        onDownloadSticker={downloadSticker}
      />

      <AnimatePresence>
        {showDayCompleteModal && newlyUnlockedDay !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="relative max-w-md w-full rounded-xl bg-white p-6 shadow-lg overflow-hidden text-center"
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              tabIndex={-1}
            >
              <div className="text-6xl mb-4 animate-pulse" aria-hidden="true">🏆</div>
              <h3 className="mb-2 text-2xl font-bold">Day Complete!</h3>
              <p className="mb-6 text-gray-700">{getRandomMessage("dayComplete")}</p>
              <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
                <p className="text-purple-800 font-semibold flex items-center justify-center gap-2">
                  <Flame className="text-orange-500" /> {streak}-day streak!
                </p>
                <p className="text-gray-600 mt-1 text-sm text-center">{getRandomMessage("streakBonus")}</p>
              </div>
              {STICKER_REWARDS[newlyUnlockedDay] && (
                <>
                  <img
                    src={STICKER_REWARDS[newlyUnlockedDay].src}
                    alt={STICKER_REWARDS[newlyUnlockedDay].alt}
                    className="w-32 h-32 object-contain mb-4 select-none mx-auto"
                    draggable={false}
                    loading="lazy"
                  />
                  <Button variant="outline" onClick={() => downloadSticker(newlyUnlockedDay)}>
                    Download Sticker
                  </Button>
                </>
              )}
              <Button
                onClick={() => {
                  setShowDayCompleteModal(false);
                  setSelectedDay(newlyUnlockedDay);
                  setNewlyUnlockedDay(null);
                }}
                className="flex w-full justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white mt-6"
              >
                Continue to Day {newlyUnlockedDay} <ChevronRight className="h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openVideo && (
          <Suspense fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
              <p className="text-white text-xl">Loading video...</p>
            </div>
          }>
            <LazyVideoPlayerWrapper
              videoUrl={openVideo.video_url}
              missionId={openVideo.id}
              onClose={() => setOpenVideo(null)}
              onVideoEnded={handleVideoEnded}
              readyToComplete={readyToComplete}
              setReadyToComplete={setReadyToComplete}
              videoTimes={videoTimes}
              setVideoTimes={setVideoTimes}
            />
          </Suspense>
        )}
      </AnimatePresence>
      
      <main className="max-w-6xl mx-auto flex-grow px-4 py-8">
        <section className="mb-8 text-center">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-4">
            Hello, {user ? "friend" : "little learner"}!
          </h1>
          <div
            className="inline-flex items-center bg-white rounded-full shadow px-6 py-2 mx-auto max-w-md gap-3"
            aria-live="polite"
            aria-atomic="true"
          >
            <Sparkles className="text-yellow-500" aria-hidden="true" />
            <MotivationMessage type="motivation" />
          </div>
        </section>

        <div className="max-w-4xl mx-auto mb-6" aria-label="Nimi assistant container">
          <NimiAssistant mood={hostMood} />
        </div>

        <section className="mb-6 max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-lg" aria-label="Your learning streak">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Your Learning Streak
            </h2>
            
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-4 bg-gradient-to-r from-orange-100 to-red-100 rounded-full px-8 py-4 shadow-inner border-2 border-orange-200" role="img" aria-label={`Current streak: ${streak} ${streak === 1 ? 'Day' : 'Days'}`}>
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Flame className="w-10 h-10 text-red-500" aria-hidden="true" />
                </motion.div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Current Streak</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {streak} {streak === 1 ? "Day" : "Days"}
                  </p>
                </div>
              </div>
              
              {streak >= 3 && (
                <motion.div 
                  className="absolute -top-3 -right-3"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  aria-hidden="true"
                >
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </motion.div>
              )}
            </motion.div>

            <p className="mt-4 text-sm text-gray-600 text-center max-w-md" aria-live="polite">
              {streak > 0 
                ? `Keep going! You're on a ${streak}-day learning streak!` 
                : "Start your learning streak today!"}
            </p>
          </div>
        </section>

        <section className="mb-8 max-w-4xl mx-auto" aria-label="Choose adventure day">
          <h3 className="mb-4 text-2xl font-semibold flex items-center gap-2">
            <Calendar className="text-purple-600" aria-hidden="true" /> Choose Adventure Day
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3" role="list">
            {missionProgram.map(day => {
              const dayLocked = isDayLocked(day.day);
              const allComplete = day.missions.length > 0 && day.missions.every(m => completedIds.has(m.id));
              const selected = selectedDay === day.day;

              return (
                <motion.button
                  key={day.day}
                  type="button"
                  role="listitem"
                  aria-pressed={selected}
                  aria-label={`Day ${day.day} ${dayLocked ? "locked" : allComplete ? "completed" : "available"}`}
                  disabled={dayLocked}
                  onClick={() => {
                    if (!dayLocked) {
                      setSelectedDay(day.day);
                    }
                  }}
                  className={`relative flex flex-col items-center py-4 rounded-xl transition ${
                    selected
                      ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg scale-105"
                      : dayLocked
                      ? "bg-gray-100 cursor-not-allowed text-gray-500"
                      : allComplete
                      ? "bg-green-50 border-2 border-green-400 shadow-inner text-green-800"
                      : "bg-white hover:bg-gray-50 shadow-sm text-gray-900"
                  }`}
                  whileHover={!dayLocked ? { scale: 1.05 } : {}}
                  whileTap={!dayLocked ? { scale: 0.95 } : {}}
                  tabIndex={dayLocked ? -1 : 0}
                >
                  <span className="text-3xl" aria-hidden="true">{dayLocked ? "🔒" : day.emoji}</span>
                  <span className="mt-1 font-semibold">Day {day.day}</span>
                  {allComplete && !dayLocked && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1"
                      aria-hidden="true"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {currentDayData ? (
          <section className="max-w-4xl mx-auto space-y-6" aria-label={`Missions for Day ${currentDayData.day}`}>
            <div className="text-center">
              <h2 className="mb-2 text-3xl font-bold flex items-center justify-center gap-2">
                <span aria-hidden="true">{currentDayData.emoji}</span> {currentDayData.title}
              </h2>
              <div className="inline-flex items-center gap-3 text-lg font-semibold text-gray-700 bg-white/80 rounded-full px-6 py-2 shadow-sm" aria-label={`Today's theme is ${currentDayData.theme}`}>
                <Lightbulb className="text-yellow-500" aria-hidden="true" /> Today's Theme: {currentDayData.theme}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentDayData.missions.map(mission => {
                const locked = isMissionLocked(mission);
                const completed = completedIds.has(mission.id);
                const buttonState = buttonStates[mission.id] || 'idle';
                const canComplete = readyToComplete[mission.id] === true && !completed && !locked;
                const canUserComplete = user ? canComplete : false;

                return (
                  <motion.div
                    key={mission.id}
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card
                      className={`relative transition-shadow rounded-xl shadow-md overflow-hidden ${
                        completed ? "bg-green-50 shadow-green-400" : "bg-white hover:shadow-lg"
                      } ${locked ? "opacity-70 cursor-not-allowed" : ""}`}
                      aria-disabled={locked}
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {completed && (
                        <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg" aria-label="Completed">
                          COMPLETED!
                        </div>
                      )}
                      {locked && (
                        <div className="absolute top-0 right-0 bg-gray-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg" aria-label="Locked">
                          COMING SOON!
                        </div>
                      )}
                      <CardHeader className="flex items-center gap-4 pb-4">
                        <div
                          className={`flex w-14 h-14 items-center justify-center rounded-full text-white ${
                            completed ? "bg-green-500" : locked ? "bg-gray-400" : "bg-pink-500"
                          }`}
                          aria-hidden="true"
                        >
                          {completed ? (
                            <CheckCircle className="w-8 h-8" />
                          ) : locked ? (
                            <Lock className="w-8 h-8" />
                          ) : (
                            <Star className="w-8 h-8" />
                          )}
                        </div>
                        <CardTitle tabIndex={0}>{mission.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 text-gray-800">
                        <p>{mission.description}</p>
                        <div className="flex justify-around text-gray-600 text-sm" aria-label="Mission details">
                          <Badge className="flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full text-blue-700">
                            <Clock className="w-4 h-4" aria-hidden="true" /> {mission.duration}
                          </Badge>
                          <Badge className="flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full text-purple-700">
                            <Star className="w-4 h-4" aria-hidden="true" /> {mission.difficulty}
                          </Badge>
                        </div>
                      </CardContent>
                      <div className="p-6 pt-0 space-y-3">
                        <Button
                          disabled={locked}
                          onClick={() => !locked && handleOpenVideo(mission)}
                          className="w-full"
                          variant="gradient"
                          aria-label={`Watch video for ${mission.title}`}
                        >
                          <Play className="mr-2 w-5 h-5" aria-hidden="true" /> Watch Video
                        </Button>
                        
                        {readyToComplete[mission.id] && (
                          <motion.div
                            whileHover={!locked && !completed && canUserComplete ? { scale: 1.03 } : {}}
                            whileTap={!locked && !completed && canUserComplete ? { scale: 0.97 } : {}}
                          >
                            <Button
                              disabled={!canUserComplete || buttonState === 'completing'}
                              onClick={() => !locked && !completed && canUserComplete && completeMission(mission)}
                              className={`w-full relative overflow-hidden ${
                                buttonState === 'completing' ? "animate-pulse" : ""
                              }`}
                              variant={
                                completed ? "success" : 
                                locked ? "disabled" : 
                                canUserComplete ? "default" : "outline"
                              }
                              aria-label={
                                completed 
                                  ? `${mission.title} completed` 
                                  : locked
                                    ? `${mission.title} is locked`
                                    : !canUserComplete
                                    ? `Login to enable completing ${mission.title}`
                                    : `Complete mission ${mission.title}`
                              }
                              title={!canUserComplete ? "Login to save progress and complete this mission" : undefined}
                            >
                              {buttonState === 'completing' ? (
                                <>
                                  <svg
                                    className="animate-spin mr-2 h-5 w-5"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8v8z"
                                    />
                                  </svg>
                                  Completing...
                                </>
                              ) : completed ? (
                                <>
                                  <CheckCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                                  <span>Completed!</span>
                                  {recentlyCompleted === mission.id && (
                                    <motion.span
                                      className="absolute -right-2 -top-2"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring" }}
                                    >
                                      <Sparkles className="w-5 h-5 text-yellow-400" aria-hidden="true" />
                                    </motion.span>
                                  )}
                                </>
                              ) : locked ? (
                                <>
                                  <Lock className="mr-2 h-5 w-5" aria-hidden="true" />
                                  Coming Soon!
                                </>
                              ) : !canUserComplete ? (
                                <>
                                  <Lock className="mr-2 h-5 w-5" aria-hidden="true" />
                                  Login to Complete
                                </>
                              ) : (
                                <>
                                  <Zap className="mr-2 h-5 w-5" aria-hidden="true" />
                                  <span>Complete Mission</span>
                                  <motion.span
                                    className="absolute right-4"
                                    animate={{
                                      scale: [1, 1.2, 1],
                                      opacity: [0.7, 1, 0.7]
                                    }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                    aria-hidden="true"
                                  >
                                    <Star className="w-4 h-4 text-yellow-300" />
                                  </motion.span>
                                </>
                              )}
                            </Button>
                          </motion.div>
                        )}

                        {!readyToComplete[mission.id] && (
                          <p className="text-center text-sm italic text-gray-500 select-none" aria-live="polite">
                            Complete button appears after watching video
                          </p>
                        )}

                        {completionError && completingMissionId === mission.id && (
                          <motion.p 
                            className="mt-2 text-center text-red-600 text-sm"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            role="alert"
                          >
                            {completionError}
                          </motion.p>
                        )}

                        {recentlyCompleted === mission.id && (
                          <motion.div
                            className="mt-3 text-center text-green-600 font-medium flex items-center justify-center gap-2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            aria-live="polite"
                          >
                            <Trophy className="w-5 h-5" aria-hidden="true" />
                            <span>+{mission.points} Points Earned!</span>
                          </motion.div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ) : (
          <p className="text-center text-gray-500 mt-12" role="alert" aria-live="assertive">
            No missions found for this day.
          </p>
        )}

        {storybook && (
          <section className="mt-12 max-w-4xl mx-auto" aria-label="Storybook section">
            <Button
              onClick={() => {
                setShowStorybook(!showStorybook);
                setHostMood(showStorybook ? "happy" : "thoughtful");
              }}
              variant="ghost"
              className="flex items-center gap-2 mb-4 mx-auto hover:bg-purple-50"
              aria-expanded={showStorybook}
              aria-controls="storybook-content"
              aria-label={showStorybook ? "Hide today's story" : "Show today's story"}
            >
              <BookOpen className="w-5 h-5 text-purple-600" aria-hidden="true" />
              <span className="text-lg font-semibold text-purple-700">
                {showStorybook ? "Hide Storybook" : "Show Today's Story"}
              </span>
              <ChevronRight
                className={`w-5 h-5 text-purple-600 transition-transform ${showStorybook ? "rotate-90" : ""}`}
                aria-hidden="true"
              />
            </Button>

            {showLoginPrompt && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm">
                  <h2 className="text-xl font-bold">🎁 Save Your Progress!</h2>
                  <p className="mt-2 mb-4">Login to save your progress and unlock more rewards!</p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={() => window.location.href = "/login"} 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    >
                      🔐 Login Now
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowLoginPrompt(false)}
                    >
                      Continue as Guest
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {showStorybook && (
                <motion.div
                  id="storybook-content"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white p-6 rounded-xl shadow-lg whitespace-pre-line border-2 border-purple-100" tabIndex={0}>
                    <h2 className="mb-4 text-3xl font-bold text-purple-700 flex items-center gap-2">
                      <Bookmark className="text-pink-500" aria-hidden="true" /> {storybook.title}
                    </h2>
                    <div className="prose max-w-none text-lg">
                      {storybook.content.split('\n').map((paragraph, i) => (
                        <p key={i} className="mb-4">{paragraph}</p>
                      ))}
                    </div>
                    <div className="mt-6 flex justify-center" aria-hidden="true">
                      <PartyPopper className="text-yellow-500 animate-bounce" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}
      </main>

      <BottomNavigation />
      <Footer />
    </div>
  )
}