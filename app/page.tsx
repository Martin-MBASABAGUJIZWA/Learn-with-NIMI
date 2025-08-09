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

// Translation dictionary for all supported languages
const translations = {
  en: {
    goodMorning: "Good morning",
    hello: "Hello",
    goodEvening: "Good evening",
    friend: "friend",
    letsPlay: "Let's play!",
    funTogether: "Let's have fun together!",
    greatJob: "You're doing great!",
    daysInRow: "days in a row!",
    keepGoing: "Keep going!",
    youreAwesome: "You're awesome!",
    todaysActivity: "Today's Fun!",
    loading: "Loading...",
    startPlaying: "Start Playing!",
    yourStars: "Your Stars",
    youHave: "You have",
    stars: "stars",
    playToEarn: "Play to earn stars!",
    surprise: "Surprise!",
    unlockedReward: "You unlocked a reward!",
    seeReward: "See Reward",
    dayStreak: "day streak"
  },
  es: {
    goodMorning: "Buenos días",
    hello: "Hola",
    goodEvening: "Buenas noches",
    friend: "amigo",
    letsPlay: "¡Vamos a jugar!",
    funTogether: "¡Vamos a divertirnos juntos!",
    greatJob: "¡Lo estás haciendo genial!",
    daysInRow: "días seguidos!",
    keepGoing: "¡Continúa así!",
    youreAwesome: "¡Eres increíble!",
    todaysActivity: "¡Diversión de hoy!",
    loading: "Cargando...",
    startPlaying: "¡Empezar a jugar!",
    yourStars: "Tus estrellas",
    youHave: "Tienes",
    stars: "estrellas",
    playToEarn: "¡Juega para ganar estrellas!",
    surprise: "¡Sorpresa!",
    unlockedReward: "¡Desbloqueaste una recompensa!",
    seeReward: "Ver recompensa",
    dayStreak: "racha de días"
  },
  fr: {
    goodMorning: "Bonjour",
    hello: "Salut",
    goodEvening: "Bonsoir",
    friend: "ami",
    letsPlay: "Jouons!",
    funTogether: "Amusons-nous ensemble!",
    greatJob: "Tu fais du bon travail!",
    daysInRow: "jours d'affilée!",
    keepGoing: "Continue comme ça!",
    youreAwesome: "Tu es génial!",
    todaysActivity: "Activité du jour",
    loading: "Chargement...",
    startPlaying: "Commencer à jouer!",
    yourStars: "Tes étoiles",
    youHave: "Tu as",
    stars: "étoiles",
    playToEarn: "Joue pour gagner des étoiles!",
    surprise: "Surprise!",
    unlockedReward: "Vous avez débloqué une récompense!",
    seeReward: "Voir la récompense",
    dayStreak: "série de jours"
  },
  rw: {
    goodMorning: "Mwaramutse",
    hello: "Muraho",
    goodEvening: "Mwiriwe",
    friend: "inshuti",
    letsPlay: "Reka duseke!",
    funTogether: "Reka duhagarare!",
    greatJob: "Urakora neza!",
    daysInRow: "iminsi ikurikira!",
    keepGoing: "Komeza!",
    youreAwesome: "Uri umuntu mwiza!",
    todaysActivity: "Umusaruro wa none!",
    loading: "Kuringaniza...",
    startPlaying: "Tangira Guseka!",
    yourStars: "Inyenyeri zawe",
    youHave: "Ufite",
    stars: "inyenyeri",
    playToEarn: "Seka kugira ngo ubone inyenyeri!",
    surprise: "Gutangaza!",
    unlockedReward: "Wasohoye igihembo!",
    seeReward: "Reba igihembo",
    dayStreak: "iminsi ikurikira"
  },
  sw: {
    goodMorning: "Habari za asubuhi",
    hello: "Hujambo",
    goodEvening: "Habari za jioni",
    friend: "rafiki",
    letsPlay: "Tucheze!",
    funTogether: "Tufurahie pamoja!",
    greatJob: "Unafanya vizuri!",
    daysInRow: "siku mfululizo!",
    keepGoing: "Endelea!",
    youreAwesome: "Wewe ni mzuri!",
    todaysActivity: "Burudani ya leo!",
    loading: "Inapakia...",
    startPlaying: "Anza Kucheza!",
    yourStars: "Nyota zako",
    youHave: "Una",
    stars: "nyota",
    playToEarn: "Cheza kupata nyota!",
    surprise: "Mshangao!",
    unlockedReward: "Umefungua tuzo!",
    seeReward: "Ona tuzo",
    dayStreak: "mfululizo wa siku"
  }
};

export default function HomePage() {
  const { language } = useLanguage();
  const t = (key: string) => translations[language][key] || translations.en[key] || key;
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

  useEffect(() => {
    if (childName) {
      speak(getGreeting(childName), language);
    }
  }, [language, childName]);

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
    if (hour < 12) return `${t('goodMorning')}, ${name || t('friend')}!`;
    if (hour < 18) return `${t('hello')}, ${name || t('friend')}!`;
    return `${t('goodEvening')}, ${name || t('friend')}!`;
  };

  const handleMissionStart = async () => {
    setShowCelebration(true);
    speak(t('letsPlay'), language);

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
      t('funTogether'),
      t('greatJob'),
      streak > 3 ? `${streak} ${t('daysInRow')} 🌟` : t('keepGoing'),
      t('youreAwesome')
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
            👋 {childName || t('friend')}!
          </h1>
          {streak > 0 && (
            <p className="text-lg text-pink-500">
              {streak} {t('dayStreak')}! 🌟
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
              {t('todaysActivity')}
            </h2>
            <h3 className="text-xl font-bold text-purple-600 mb-6">
              {todaysMission?.title || t('loading')}
            </h3>
            <Button
              onClick={handleMissionStart}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-10 py-6 rounded-full text-2xl font-bold shadow-lg hover:shadow-xl"
              size="lg"
            >
              <Play className="w-8 h-8 mr-3" /> 
              {t('startPlaying')}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Stars */}
        <Card className="bg-white border-none shadow-md mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-center mb-4">
              {t('yourStars')} ⭐
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
                ? `${t('youHave')} ${starsEarned} ${t('stars')}!`
                : t('playToEarn')}
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
                {t('surprise')} 🎁
              </h3>
              <p className="text-gray-700 mb-4">
                {t('unlockedReward')}
              </p>
              <Link href="/rewards">
                <Button 
                  variant="outline" 
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  {t('seeReward')}
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