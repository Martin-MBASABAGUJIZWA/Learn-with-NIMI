"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import Confetti from "react-confetti";
import { useLanguage } from "@/contexts/LanguageContext";
import { speak, loadVoices } from "@/lib/speak";
import { Play, Star, Gift } from "lucide-react";

export default function HomePage() {
  const { t, language } = useLanguage();
  const router = useRouter();

  const [childName, setChildName] = useState<string | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [todaysMission, setTodaysMission] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [showSurprise, setShowSurprise] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadVoices();
    fetchUserData();
    fetchTodaysMission();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("name, completed_missions, streak")
      .eq("id", user.id)
      .single();

    if (data) {
      setChildName(data.name);
      setStarsEarned(data.completed_missions || 0);
      setStreak(data.streak || 0);
      speak(getGreeting(data.name), language);
    }
  };

  const fetchTodaysMission = async () => {
    const { data } = await supabase
      .from("missions")
      .select("*")
      .eq("is_today", true)
      .limit(1)
      .single();
    setTodaysMission(data);
  };

  const getGreeting = (name: string | null) => {
    const hour = new Date().getHours();
    if (hour < 12) return `${t('goodMorning') || "Good morning"}, ${name || "friend"}!`;
    if (hour < 18) return `${t('hello') || "Hello"}, ${name || "friend"}!`;
    return `${t('goodEvening') || "Good evening"}, ${name || "friend"}!`;
  };

  const handleMissionStart = async () => {
    setShowCelebration(true);
    speak(t('letsPlay') || "Let's play!", language);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const newStars = starsEarned + 1;
      await supabase
        .from("users")
        .update({ completed_missions: newStars })
        .eq("id", user.id);
      setStarsEarned(newStars);

      if (newStars >= 3) setShowSurprise(true);
    }

    setTimeout(() => setShowCelebration(false), 3000);

    router.push("/missions");
  };

  const handleNimiClick = () => {
    const messages = [
      t('funTogether') || "Let's have fun together!",
      t('greatJob') || "You're doing great!",
      streak > 3 ? `${streak} ${t('daysInRow') || "days in a row!"} 🌟` : t('keepGoing') || "Keep going!",
      t('youreAwesome') || "You're awesome!"
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    speak(randomMessage, language);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col pb-24">
      <Header simple={true} />

      {showCelebration && (
        <Confetti 
          recycle={false}
          numberOfPieces={200}
          colors={['#FF9E9E', '#FFD6A5', '#CBFFA9', '#A0C4FF', '#BDB2FF']}
        />
      )}

      <main className="flex-grow max-w-md mx-auto px-4 py-8 w-full">
        {/* Welcome Area */}
        <div className="text-center mb-8">
          <div 
            className="relative w-40 h-40 mx-auto mb-6 cursor-pointer"
            onClick={handleNimiClick}
          >
            <img 
              src="/nimi-logo.jpg"
              alt="NIMI"
              className="w-full h-full rounded-full object-cover shadow-lg border-4 border-white animate-bounce"
            />
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md border-2 border-pink-200">
              <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                {getGreeting(childName)}
              </p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-purple-600 mb-2">
            👋 {childName || t('friend') || "Friend"}!
          </h1>
          {streak > 0 && (
            <p className="text-lg text-pink-500">
              {streak} {t('dayStreak') || "day streak"}! 🌟
            </p>
          )}
        </div>

        {/* Main Activity Button */}
        <Card className="bg-gradient-to-r from-pink-100 to-purple-100 border-none shadow-xl mb-8">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Star className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {t('todaysActivity') || "Today's Fun!"}
            </h2>
            <h3 className="text-xl font-bold text-purple-600 mb-6">
              {todaysMission?.title || t('loading') || "Loading..."}
            </h3>
            <Button
              onClick={handleMissionStart}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-10 py-6 rounded-full text-2xl font-bold shadow-lg hover:shadow-xl"
              size="lg"
            >
              <Play className="w-8 h-8 mr-3" /> 
              {t('startPlaying') || "Start Playing!"}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Stars */}
        <Card className="bg-white border-none shadow-md mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-center mb-4">
              {t('yourStars') || "Your Stars"} ⭐
            </h3>
            <div className="flex justify-center space-x-4 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-3xl ${
                    star <= starsEarned
                      ? "bg-yellow-400 text-white animate-bounce"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {star <= starsEarned ? "⭐" : "☆"}
                </div>
              ))}
            </div>
            <p className="text-lg text-center text-gray-600">
              {starsEarned > 0 
                ? `${t('youHave') || "You have"} ${starsEarned} ${t('stars') || "stars"}!`
                : t('playToEarn') || "Play to earn stars!"}
            </p>
          </CardContent>
        </Card>

        {/* Daily Surprise */}
        {showSurprise && (
          <Card className="bg-gradient-to-r from-yellow-100 to-orange-100 border-none shadow-xl mb-8 animate-wiggle">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-orange-600 mb-2">
                {t('surprise') || "Surprise!"} 🎁
              </h3>
              <p className="text-gray-700 mb-4">
                {t('unlockedReward') || "You unlocked a reward!"}
              </p>
              <Link href="/rewards">
                <Button 
                  variant="outline" 
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  {t('seeReward') || "See Reward"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      {mounted && <BottomNavigation />}
    </div>
  );
}
