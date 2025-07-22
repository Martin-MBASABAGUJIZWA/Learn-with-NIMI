"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import Footer from "@/components/Footer";
import Confetti from "react-confetti";
import { useLanguage } from "@/contexts/LanguageContext";
import { speak, loadVoices } from "@/lib/speak";
import {
  User,
  LogIn,
  Clock,
  Volume2,
  BookOpen,
  Target,
  Star,
  Zap,
  Play,
  TrendingUp,
  Users,
  Trophy,
  Gift,
  Heart,
} from "lucide-react";

export default function HomePage() {
  const { t, language } = useLanguage();
  const [childName, setChildName] = useState<string | null>(null);
  const [nimiMessage, setNimiMessage] = useState("");
  const [pikoPoints, setPikoPoints] = useState(0);
  const [completedMissions, setCompletedMissions] = useState(0);
  const [totalMissions, setTotalMissions] = useState(5);
  const [level, setLevel] = useState(1);
  const [badgeCount, setBadgeCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [availableMissions, setAvailableMissions] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showLevelUpConfetti, setShowLevelUpConfetti] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [isGuest, setIsGuest] = useState(false);
  const [todaysMission, setTodaysMission] = useState<any>(null);
  const [pastTrips, setPastTrips] = useState([]);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [sparkles, setSparkles] = useState<
    { left: string; top: string; delay: string; duration: string }[]
  >([]);

  // Utility: get time-of-day greeting for personalized welcome
  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12)
      return `Good morning, superstar ${childName || "Friend"}! Ready for a bright day of adventure? 🌞`;
    if (hour < 18)
      return `Good afternoon, superstar ${childName || "Friend"}! Let's continue your awesome journey! 🌤️`;
    return `Good evening, superstar ${childName || "Friend"}! Time to unwind and dream big! 🌙`;
  };

  // Mood emoji based on streak and level
  const getMoodEmoji = () => {
    if (streak >= 7) return "😄";
    if (level >= 10) return "🤩";
    if (completedMissions === 0) return "🙂";
    return "😊";
  };

  // Fetch trips
  useEffect(() => {
    const fetchTrips = async () => {
      const upcomingRes = await fetch("/api/trips/upcoming");
      const upcomingData = await upcomingRes.json();
      setUpcomingTrips(upcomingData);

      const pastRes = await fetch("/api/trips/past");
      const pastData = await pastRes.json();
      setPastTrips(pastData);
    };

    fetchTrips();
  }, []);

  // Load voices for speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      loadVoices();
    }
  }, []);

  // When nimiMessage changes, speak it with pitch & rate depending on streak
  useEffect(() => {
    if (!nimiMessage) return;
    const fallbackLang = language === "rw" || language === "sw" ? "en" : language;
    const pitch = streak >= 7 ? 1.3 : 1;
    const rate = streak >= 7 ? 1.2 : 1;
    speak(nimiMessage, fallbackLang, { pitch, rate });
  }, [nimiMessage, language, streak]);

  // Fetch today's mission with personalization, fetching user preferences for enhanced suggestions
  useEffect(() => {
    const fetchTodaysMission = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // fallback generic mission if guest
        const { data } = await supabase
          .from("missions")
          .select("*")
          .eq("is_today", true)
          .limit(1)
          .single();
        setTodaysMission(data);
        return;
      }

      // Fetch user preferences
      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("mission_types")
        .eq("user_id", user.id)
        .single();

      // Try to fetch mission matching preferences for today
      const { data, error } = await supabase
        .from("missions")
        .select("*")
        .contains("tags", preferences?.mission_types || [])
        .eq("is_today", true)
        .limit(1)
        .single();

      if (!error && data) {
        setTodaysMission(data);
      } else {
        // fallback if no matching preferences
        const { data: fallback } = await supabase
          .from("missions")
          .select("*")
          .eq("is_today", true)
          .limit(1)
          .single();
        setTodaysMission(fallback);
      }
    };

    fetchTodaysMission();
  }, []);

  // Calculate and animate progress
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressValue((completedMissions / totalMissions) * 100);
    }, 500);
    return () => clearTimeout(timer);
  }, [completedMissions, totalMissions]);

  // Personalized welcome message updates with time of day greeting
  useEffect(() => {
    setNimiMessage(getTimeOfDayGreeting());
  }, [language, childName, streak]);

  // Fetch user data and update states, including level-up confetti and personalized streak encouragement
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsGuest(true);
        setChildName(null);
        return;
      }

      setIsGuest(false);

      const { data, error } = await supabase
        .from("users")
        .select(
          "name, points, completed_missions, level, badges, streak, theme_color, preferred_locations"
        )
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setChildName(data.name || "Friend");
        setPikoPoints(data.points || 0);
        setCompletedMissions(data.completed_missions || 0);
        setLevel(data.level || 1);
        setBadgeCount(data.badges || 0);
        setStreak(data.streak || 0);

        // Level-up celebration
        if (data.level && data.level > level) {
          setShowLevelUpConfetti(true);
          setNimiMessage(`🎉 Level ${data.level} unlocked! You're unstoppable, ${data.name}!`);
          setTimeout(() => setShowLevelUpConfetti(false), 4000);
        }
      }

      // Get user's incomplete missions count
      const { data: missions } = await supabase
        .from("missions")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", false);
      setAvailableMissions(missions?.length || 0);
    };

    fetchUserData();
  }, []);

  // Sparkle animation styles
  useEffect(() => {
    setHasMounted(true);
    const sparkleStyles = [...Array(12)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 2}s`,
    }));
    setSparkles(sparkleStyles);
  }, []);

  // Enhanced celebration control with streak milestone messages
  useEffect(() => {
    if (completedMissions > 0) {
      const milestones = [5, 10, 25, 50, 100];
      if (milestones.includes(completedMissions)) {
        setNimiMessage(`🎉 Amazing! You've completed ${completedMissions} missions! Keep shining!`);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    }
  }, [completedMissions]);

  // Handle mission start with personalized feedback and guest prompt
  const handleMissionStart = () => {
    setShowCelebration(true);
    setNimiMessage(
      `${childName || "Friend"}, ${t("letsLearn")} ${todaysMission?.title || "something new"}! 🎉`
    );

    if (isGuest) {
      setTimeout(() => {
        setShowCelebration(false);
        setShowLoginPrompt(true);
        setNimiMessage(t("doingAmazing") + " 🌈");
      }, 3000);
    } else {
      setTimeout(() => {
        setShowCelebration(false);
        setNimiMessage(`Keep it up, ${childName}! You're doing great! 🌟`);
      }, 3000);
    }
  };

  // Click handler to show random encouraging messages from NIMI
  const handleNimiClick = () => {
    const messages = [
      t("favoriteBuddy") + " 💖",
      t("amazingAdventure") + " 🚀",
      t("believeInYou") + " ⭐",
      t("discoverWonderful") + " 🌟",
      t("learningFun") + " 🎈",
      `Your streak is ${streak} days! Keep growing! 🌿`,
      `You're at level ${level}, super learner! 🎓`,
    ];
    setNimiMessage(messages[Math.floor(Math.random() * messages.length)]);
  };

  // Persist theme and visible sections preferences locally for guests
  const [themeColor, setThemeColor] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("themeColor") || "from-orange-50 via-pink-50 to-blue-50" : "from-orange-50 via-pink-50 to-blue-50")
  );
  const [visibleSections, setVisibleSections] = useState<string[]>(() =>
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("visibleSections") || '["Missions","Progress","Community","Rewards"]')
      : ["Missions", "Progress", "Community", "Rewards"]
  );

  // Update localStorage when preferences change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("themeColor", themeColor);
      localStorage.setItem("visibleSections", JSON.stringify(visibleSections));
    }
  }, [themeColor, visibleSections]);

  // Update user theme and persist for logged in users
  const updateUserTheme = async (themeClass: string) => {
    setThemeColor(themeClass);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("users").update({ theme_color: themeClass }).eq("id", user.id);
    }
  };

  // Toggle dashboard sections and persist
  const toggleSection = (section: string) => {
    if (visibleSections.includes(section)) {
      setVisibleSections(visibleSections.filter((s) => s !== section));
    } else {
      setVisibleSections([...visibleSections, section]);
    }
  };

  // Return JSX UI
  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeColor}`}>
      <Header />
      {showLevelUpConfetti && <Confetti />}

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-fade-in">
            <h2 className="text-3xl font-bold text-purple-600 mb-4">
              {t("greatJob")}, {childName || "Friend"}!
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              {t("saveYourAdventure")} 🌟
              <br />
              {t("createAccountToSave")}
            </p>
            <div className="flex flex-col gap-4">
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-full w-full">
                  <User className="mr-2" /> {t("signupNow")}
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="border-purple-300 text-purple-600 rounded-full w-full">
                  <LogIn className="mr-2" /> {t("alreadyHaveAccount")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce">
            <div className="text-8xl mb-4">🎉</div>
            <div className="text-4xl font-bold text-purple-600 text-center">{nimiMessage || t("letsLearn")}</div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 to-pink-200/20 animate-pulse"></div>
        </div>
      )}

      {/* Floating Stars and Sparkles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {hasMounted &&
          sparkles.map((style, i) => (
            <div
              key={i}
              className="absolute animate-bounce text-yellow-300"
              style={{
                left: style.left,
                top: style.top,
                animationDelay: style.delay,
                animationDuration: style.duration,
              }}
            >
              ✨
            </div>
          ))}
      </div>

      {/* Settings Panel (optional enhancement) */}
      <div className="fixed bottom-20 right-6 rounded-full shadow-xl z-40">
        {/* Could add button here to toggle theme and sections, skipped due to prompt */}
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            {/* Avatar / NIMI */}
            <div
              className="relative w-32 h-32 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-2xl cursor-pointer transform hover:scale-110 transition-all duration-300 animate-pulse"
              onClick={handleNimiClick}
              title="Click for encouragement!"
            >
              <img
                src="/nimi-logo.png"
                alt="NIMI"
                className="w-28 h-28 rounded-full object-contain"
                draggable={false}
              />
              <div className="absolute bottom-4 right-4 text-3xl select-none">{getMoodEmoji()}</div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-spin select-none">
                ✨
              </div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center animate-bounce select-none">
                💖
              </div>
            </div>

            {/* Speech Bubble */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg border-2 border-pink-200 animate-bounce select-none max-w-xs whitespace-nowrap overflow-hidden text-ellipsis">
              <p className="text-sm font-semibold text-gray-700">{nimiMessage}</p>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4 animate-fade-in">
            👋 {t("hello")},{" "}
            {childName === null ? <span className="italic text-gray-400">Friend</span> : childName}!
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700 font-medium mb-2">{getTimeOfDayGreeting()}</p>
          <p className="text-lg text-gray-600">{t("dailyVictories")}</p>
        </div>

        {/* Today's Mission Card */}
        {visibleSections.includes("Missions") && (
          <div className="mb-12">
            <Card className="bg-gradient-to-r from-orange-200 via-pink-200 to-purple-200 border-none shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-300/30 to-pink-300/30 animate-pulse"></div>
              <div className="absolute top-4 right-4 text-yellow-400 animate-bounce text-2xl">⭐</div>
              <CardContent className="p-8 md:p-12 relative z-10">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center mr-6 shadow-xl animate-bounce">
                      <Target className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">🎯 {t("todaysMission")}</h2>
                      {todaysMission ? (
                        <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {todaysMission.title}
                        </h3>
                      ) : (
                        <p className="text-gray-500">✨ Get started with your first fun challenge!</p>
                      )}
                    </div>
                  </div>

                  {todaysMission?.description ? (
                    <p className="text-xl md:text-2xl text-gray-800 mb-8 font-medium leading-relaxed">
                      {todaysMission.description}
                    </p>
                  ) : (
                    <p className="text-xl text-gray-500 mb-8">🏅 Complete a fun activity to start your learning journey!</p>
                  )}

                  {/* Mission Details */}
                  {todaysMission && (
                    <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
                      <div className="flex items-center bg-white/90 px-6 py-3 rounded-full shadow-lg">
                        <Clock className="w-6 h-6 mr-3 text-blue-500" />
                        <span className="font-bold text-gray-700 text-lg">{todaysMission.duration}</span>
                      </div>
                      <div className="flex items-center bg-white/90 px-6 py-3 rounded-full shadow-lg">
                        <Star className="w-6 h-6 mr-3 text-yellow-500" />
                        <span className="font-bold text-gray-700 text-lg">{todaysMission.points}</span>
                      </div>
                      <div className="flex items-center bg-white/90 px-6 py-3 rounded-full shadow-lg">
                        <Zap className="w-6 h-6 mr-3 text-green-500" />
                        <span className="font-bold text-gray-700 text-lg">{todaysMission.difficulty}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-4">
                    <Button
                      onClick={handleMissionStart}
                      className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white px-12 py-6 rounded-full text-2xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 group-hover:animate-pulse"
                    >
                      <Play className="w-8 h-8 mr-4" />🚀 {t("startLearning")}
                    </Button>

                    <div className="flex flex-wrap justify-center gap-4">
                      <Button
                        variant="outline"
                        className="bg-white/90 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 px-6 py-3 rounded-full font-semibold text-lg shadow-lg"
                      >
                        <Volume2 className="w-5 h-5 mr-2" />🎵 {t("hearFromNimi")}
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-white/90 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-full font-semibold text-lg shadow-lg"
                      >
                        <BookOpen className="w-5 h-5 mr-2" />📖 {t("previewMission")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-12">
          {/* Daily Missions */}
          {visibleSections.includes("Missions") && (
            <Link href="/missions" className="group">
              <Card className="h-64 cursor-pointer transition-all duration-500 hover:shadow-2xl border-none bg-gradient-to-br from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300 group-hover:scale-110 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-300/20 to-pink-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-4 right-4 animate-bounce">
                  <Badge className="bg-red-500 text-white text-lg px-4 py-2 rounded-full shadow-lg">
                    {availableMissions} 🚀
                  </Badge>
                </div>
                <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-6 shadow-2xl group-hover:animate-spin transition-all duration-500">
                    <Target className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">🎯 {t("dailyMissions")}</h3>
                  <p className="text-gray-700 text-lg mb-3 font-semibold">
                    {availableMissions} {t("waitingAdventures")}
                  </p>
                  <p className="text-gray-600 text-sm">{t("tapToStart")}</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Progress Tree */}
          {visibleSections.includes("Progress") && (
            <Link href="/progress" className="group">
              <Card className="h-64 cursor-pointer transition-all duration-500 hover:shadow-2xl border-none bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 group-hover:scale-110 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-300/20 to-indigo-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-2xl group-hover:animate-bounce transition-all duration-500">
                    <TrendingUp className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">🌳 {t("learningTree")}</h3>
                  <p className="text-gray-700 text-lg mb-3 font-semibold">{t("watchGrow")}</p>
                  <p className="text-gray-600 text-sm">{t("seeProgress")}</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Community */}
          {visibleSections.includes("Community") && (
            <Link href="/community" className="group">
              <Card className="h-64 cursor-pointer transition-all duration-500 hover:shadow-2xl border-none bg-gradient-to-br from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 group-hover:scale-110 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-300/20 to-emerald-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-2xl group-hover:animate-pulse transition-all duration-500">
                    <Users className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">👥 {t("pikoCommunity")}</h3>
                  <p className="text-gray-700 text-lg mb-3 font-semibold">{t("shareCelebrate")}</p>
                  <p className="text-gray-600 text-sm">{t("connectFriends")}</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Piko Peaks */}
          {visibleSections.includes("Rewards") && (
            <Link href="/piko-peaks" className="group">
              <Card className="h-64 cursor-pointer transition-all duration-500 hover:shadow-2xl border-none bg-gradient-to-br from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 group-hover:scale-110 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-300/20 to-pink-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 shadow-2xl group-hover:animate-bounce transition-all duration-500">
                    <Trophy className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">🏔️ {t("pikoPeaks")}</h3>
                  <p className="text-gray-700 text-lg mb-3 font-semibold">{t("unlockRewards")}</p>
                  <p className="text-gray-600 text-sm">{t("celebrateVictories")}</p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Interactive Progress Section */}
       {visibleSections.includes("Progress") && (
  <Card className="mb-12 bg-gradient-to-r from-yellow-100 via-orange-100 to-pink-100 border-none shadow-2xl overflow-hidden relative">
    {hasMounted && (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {sparkles.map((style, i) => (
          <div
            key={i}
            className="absolute animate-bounce text-yellow-300 select-none"
            style={{
              left: style.left,
              top: style.top,
              animationDelay: style.delay,
              animationDuration: style.duration,
            }}
          >
            ✨
          </div>
        ))}
      </div>
    )}

    <CardContent className="p-8 md:p-12 relative z-10">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4 shadow-2xl animate-pulse cursor-pointer transform hover:scale-125 transition-all duration-300">
              <span className="text-3xl animate-bounce">🎓</span>
              <div className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-spin">⭐</div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 text-pink-400 animate-bounce">✨</div>
            </div>
          </div>
          <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
            🌟 Your Piko Progress Adventure! 🌟
          </h3>
        </div>

        {/* Piko Points */}
        <div className="mb-8">
          <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-12 py-8 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 cursor-pointer group">
            <div className="relative">
              <Star className="w-12 h-12 mr-4 animate-spin group-hover:animate-pulse" />
              <div className="absolute -top-2 -right-2 w-4 h-4 text-yellow-200 animate-bounce">⭐</div>
              <div className="absolute -bottom-2 -left-2 w-3 h-3 text-orange-200 animate-ping">✨</div>
            </div>
            <span className="text-5xl font-bold animate-pulse">{pikoPoints}</span>
            <span className="text-3xl ml-4 animate-bounce">Piko Points 🎉</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <span className="text-2xl font-bold text-gray-800 animate-bounce">🚀 Your Learning Journey</span>
            <span className="text-2xl font-bold text-orange-600 animate-pulse">
              {completedMissions}/{totalMissions} Adventures
            </span>
          </div>

          <div className="relative bg-gradient-to-r from-blue-100 to-purple-100 rounded-full h-16 shadow-inner border-4 border-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200/50 to-purple-200/50 animate-pulse"></div>
            <div
              className="h-full bg-gradient-to-r from-green-400 via-blue-400 via-purple-400 to-pink-400 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${progressValue}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>

              {/* Flickering Stars on progress bar */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute text-white animate-bounce text-lg select-none"
                    style={{
                      left: `${i * 20 + 10}%`,
                      top: "50%",
                      transform: "translateY(-50%)",
                      animationDelay: `${i * 0.3}s`,
                    }}
                  >
                    ⭐
                  </div>
                ))}
              </div>
            </div>

            {/* NIMI Avatar Moving With Progress */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-1000 ease-out cursor-pointer"
              style={{ left: `${Math.max(progressValue - 8, 0)}%` }}
              title={`You are here, ${childName || "Friend"}`}
              onClick={() => setNimiMessage(`Keep going, ${childName || "Friend"}! You're doing amazing! 🌟`)}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-xl animate-bounce border-4 border-white">
                <img src="/nimi-logo.png" alt="NIMI" className="w-8 h-8 rounded-full object-cover" />
              </div>
              <div className="absolute -top-2 -right-1 text-yellow-400 animate-spin text-sm">✨</div>
              <div className="absolute -bottom-2 -left-1 text-pink-400 animate-bounce text-sm">💖</div>
            </div>

            {/* Milestone Markers */}
            {[25, 50, 75, 100].map((milestone) => (
              <div
                key={milestone}
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 select-none cursor-pointer"
                style={{ left: `${milestone}%` }}
                title={
                  progressValue >= milestone
                    ? `Congrats! You've reached ${milestone}% milestone! 🎉`
                    : `Reach ${milestone}% milestone`
                }
                onClick={() => {
                  if (progressValue >= milestone) {
                    setNimiMessage(
                      `🎉 Amazing! You unlocked the ${milestone}% milestone! Keep up the great work!`
                    );
                    setShowCelebration(true);
                    setTimeout(() => setShowCelebration(false), 3000);
                  } else {
                    setNimiMessage(`Keep pushing! The ${milestone}% milestone is within reach! 🚀`);
                  }
                }}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-lg transition-all duration-300 ${
                    progressValue >= milestone
                      ? "bg-gradient-to-br from-yellow-400 to-orange-400 animate-pulse scale-125"
                      : "bg-gray-300 hover:scale-110"
                  }`}
                >
                  <span className="text-lg">{progressValue >= milestone ? "🏆" : "⭐"}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Milestone Labels */}
          <div className="flex justify-between mt-4 text-sm font-semibold text-gray-600 select-none">
            <span className="animate-bounce">🌱 Start</span>
            <span className={progressValue >= 25 ? "text-orange-600 animate-pulse" : ""}>🌿 Growing</span>
            <span className={progressValue >= 50 ? "text-green-600 animate-pulse" : ""}>🌳 Blooming</span>
            <span className={progressValue >= 75 ? "text-purple-600 animate-pulse" : ""}>🌟 Shining</span>
            <span className={progressValue >= 100 ? "text-pink-600 animate-bounce" : ""}>👑 Master</span>
          </div>
        </div>

        {/* Encouragement Section with Detailed Personalization */}
        <div className="space-y-6 select-none">
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-6 border-4 border-white shadow-xl">
            <p className="text-2xl text-gray-800 font-bold animate-bounce">
              🌟 Incredible progress completing{" "}
              <span className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                {completedMissions}
              </span>{" "}
              missions, {childName || "Friend"}! 🎉
            </p>
            <p className="text-xl text-gray-700 mt-4 animate-pulse">
              {totalMissions - completedMissions > 0
                ? `Only ${totalMissions - completedMissions} more to your next exciting reward! 🚀✨`
                : `🎊 You've conquered all missions! You're a true Piko Master! 👑🌟`}
            </p>
          </div>
                  {/* Next Reward Tease */}
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border-4 border-white shadow-xl select-none">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl animate-spin mr-4">
                        <Gift className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-2xl font-bold text-gray-800">🎁 {t("nextReward")}</h4>
                    </div>
                    <div className="flex items-center justify-center space-x-4">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center shadow-xl blur-sm select-none">
                          <span className="text-3xl">🏆</span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center select-none">
                          <span className="text-4xl animate-bounce">🔒</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-700">{t("mysteryBadge")}</p>
                        <p className="text-sm text-gray-600">{t("completeMore")} 🌟</p>
                      </div>
                    </div>
                  </div>

                  {/* Sound Cue */}
                  <div className="flex items-center justify-center space-x-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl p-4 border-4 border-white shadow-xl select-none">
                    <Volume2 className="w-8 h-8 text-blue-600 animate-pulse" />
                    <span className="text-lg font-bold text-blue-800">🎵 {t("celebrationSounds")}</span>
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-bounce cursor-pointer select-none">
                      <span className="text-white text-sm">▶️</span>
                    </div>
                  </div>
                </div>

                {/* Achievements Stars */}
                <div className="flex justify-center space-x-4 mt-8 select-none">
                  {[...Array(completedMissions)].map((_, i) => (
                    <div key={i} className="relative">
                      <div
                        className="w-16 h-16 text-yellow-400 animate-bounce text-4xl cursor-pointer transform hover:scale-125 transition-all duration-300"
                        style={{ animationDelay: `${i * 0.2}s` }}
                        title={`Completed mission ${i + 1}`}
                      >
                        ⭐
                      </div>
                      <div className="absolute top-0 right-0 w-4 h-4 text-pink-400 animate-spin text-sm">✨</div>
                      <div className="absolute bottom-0 left-0 w-3 h-3 text-blue-400 animate-ping text-xs">💫</div>
                    </div>
                  ))}
                  {[...Array(totalMissions - completedMissions)].map((_, i) => (
                    <div
                      key={i + completedMissions}
                      className="w-16 h-16 text-gray-300 text-4xl hover:text-gray-400 transition-all duration-300 cursor-pointer transform hover:scale-110"
                      title="Mission not completed yet"
                    >
                      ☆
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trips Sections */}
        <div className="space-y-8">
          {/* Upcoming Trips */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#5e548e]">Upcoming Trips</h2>
            {upcomingTrips.length === 0 ? (
              <p>{t("noUpcomingTrips") || "No upcoming trips."}</p>
            ) : (
              upcomingTrips.map((trip) => (
                <div key={trip.id} className="bg-white rounded-xl shadow p-4 space-y-2">
                  <h3 className="text-xl font-semibold">{trip.title}</h3>
                  <p>{trip.description}</p>
                  <p>
                    <strong>{t("date") || "Date"}:</strong> {new Date(trip.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>{t("location") || "Location"}:</strong> {trip.location}
                  </p>
                  <p>
                    <strong>{t("guide") || "Guide"}:</strong> {trip.guide_name}
                  </p>

                  {trip.image_url && (
                    <img src={trip.image_url} alt={trip.title} className="w-full max-w-md rounded mb-3" />
                  )}

                  {trip.video_url && (
                    <video src={trip.video_url} controls className="w-full max-w-md rounded mb-3" />
                  )}
                </div>
              ))
            )}
          </section>

          {/* Past Trips */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#5e548e]">Past Trips</h2>
            {pastTrips.length === 0 ? (
              <p>{t("noPastTrips") || "No past trips."}</p>
            ) : (
              pastTrips.map((trip) => (
                <div key={trip.id} className="bg-gray-50 rounded-xl shadow p-4 space-y-2">
                  <h3 className="text-xl font-semibold">{trip.title}</h3>
                  <p>{trip.description}</p>
                  <p>
                    <strong>{t("date") || "Date"}:</strong> {new Date(trip.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>{t("location") || "Location"}:</strong> {trip.location}
                  </p>
                  <p>
                    <strong>{t("guide") || "Guide"}:</strong> {trip.guide_name}
                  </p>

                  {trip.image_url && (
                    <img src={trip.image_url} alt={trip.title} className="w-full max-w-md rounded mb-3" />
                  )}

                  {trip.video_url && (
                    <video src={trip.video_url} controls className="w-full max-w-md rounded mb-3" />
                  )}
                </div>
              ))
            )}
          </section>
        </div>

        {/* Quick Actions & Rewards Tease */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-r from-pink-100 to-purple-100 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Volume2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">🎵 {t("nimisVoice")}</h3>
              <p className="text-gray-600 mb-4">{t("listenMessages")}</p>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full">
                {t("playMessage")}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-100 to-blue-100 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">🎁 {t("newReward")}</h3>
              <p className="text-gray-600 mb-4">{t("unlockedSticker")}</p>
              <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-full">
                {t("viewRewards")}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-100 to-orange-100 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">💖 {t("dailyLove")}</h3>
              <p className="text-gray-600 mb-4">{t("sendLove")}</p>
              <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-full">
                {t("spreadLove")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <BottomNavigation />

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
}