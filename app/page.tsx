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
import { Play, Star, Gift, Fire } from "lucide-react";
import { motion } from "framer-motion";

/* 🌍 Translation dictionary (5 languages) */
const translations: Record<
  string,
  Record<
    | "goodMorning" | "hello" | "goodEvening" | "friend"
    | "letsLearn" | "funTogether" | "greatJob" | "daysInRow" | "keepGoing" | "youreAwesome"
    | "todaysActivity" | "loading" | "startLearning"
    | "yourStars" | "youHave" | "stars" | "learnToEarn"
    | "surprise" | "unlockedReward" | "seeReward" | "dayStreak",
    string
  >
> = {
  en: {
    goodMorning: "Good morning",
    hello: "Hello",
    goodEvening: "Good evening",
    friend: "friend",
    letsLearn: "Let's learn!",
    funTogether: "Let's have fun together!",
    greatJob: "You're doing great!",
    daysInRow: "days in a row!",
    keepGoing: "Keep going!",
    youreAwesome: "You're awesome!",
    todaysActivity: "Today's Learning!",
    loading: "Loading...",
    startLearning: "Start to Learn!",
    yourStars: "Your Stars",
    youHave: "You have",
    stars: "stars",
    learnToEarn: "Learn to earn stars!",
    surprise: "Surprise!",
    unlockedReward: "You unlocked a reward!",
    seeReward: "See Reward",
    dayStreak: "day streak",
  },
  es: {
    goodMorning: "Buenos días",
    hello: "Hola",
    goodEvening: "Buenas noches",
    friend: "amigo",
    letsLearn: "¡Aprendamos!",
    funTogether: "¡Divirtámonos juntos!",
    greatJob: "¡Lo estás haciendo genial!",
    daysInRow: "días seguidos",
    keepGoing: "¡Continúa!",
    youreAwesome: "¡Eres increíble!",
    todaysActivity: "¡Aprendizaje de hoy!",
    loading: "Cargando...",
    startLearning: "¡Empieza a aprender!",
    yourStars: "Tus estrellas",
    youHave: "Tienes",
    stars: "estrellas",
    learnToEarn: "¡Aprende para ganar estrellas!",
    surprise: "¡Sorpresa!",
    unlockedReward: "¡Has desbloqueado una recompensa!",
    seeReward: "Ver recompensa",
    dayStreak: "racha de días",
  },
  fr: {
    goodMorning: "Bonjour",
    hello: "Salut",
    goodEvening: "Bonsoir",
    friend: "ami",
    letsLearn: "Apprenons !",
    funTogether: "Amusons-nous ensemble !",
    greatJob: "Tu fais du bon travail !",
    daysInRow: "jours d'affilée",
    keepGoing: "Continue !",
    youreAwesome: "Tu es génial !",
    todaysActivity: "L'apprentissage du jour",
    loading: "Chargement...",
    startLearning: "Commencer à apprendre !",
    yourStars: "Tes étoiles",
    youHave: "Tu as",
    stars: "étoiles",
    learnToEarn: "Apprends pour gagner des étoiles !",
    surprise: "Surprise !",
    unlockedReward: "Tu as débloqué une récompense !",
    seeReward: "Voir la récompense",
    dayStreak: "série de jours",
  },
  rw: {
    goodMorning: "Mwaramutse",
    hello: "Muraho",
    goodEvening: "Mwiriwe",
    friend: "inshuti",
    letsLearn: "Reka twige!",
    funTogether: "Reka twishimane!",
    greatJob: "Ukoze neza!",
    daysInRow: "iminsi ikurikirana",
    keepGoing: "Komeza!",
    youreAwesome: "Uri intyoza!",
    todaysActivity: "Isomo ry’uyu munsi",
    loading: "Birimo gupakira...",
    startLearning: "Tangira kwiga!",
    yourStars: "Inyenyeri zawe",
    youHave: "Ufite",
    stars: "inyenyeri",
    learnToEarn: "Iga kugira ngo ubone inyenyeri!",
    surprise: "Impano!",
    unlockedReward: "Wafunguye igihembo!",
    seeReward: "Reba igihembo",
    dayStreak: "iminsi ikurikirana",
  },
  sw: {
    goodMorning: "Habari za asubuhi",
    hello: "Hujambo",
    goodEvening: "Habari za jioni",
    friend: "rafiki",
    letsLearn: "Tujifunze!",
    funTogether: "Tufurahie pamoja!",
    greatJob: "Umefanya vizuri!",
    daysInRow: "siku mfululizo",
    keepGoing: "Endelea!",
    youreAwesome: "Wewe ni hodari!",
    todaysActivity: "Mafunzo ya leo!",
    loading: "Inapakia...",
    startLearning: "Anza kujifunza!",
    yourStars: "Nyota zako",
    youHave: "Una",
    stars: "nyota",
    learnToEarn: "Jifunze kupata nyota!",
    surprise: "Mshangao!",
    unlockedReward: "Umefungua zawadi!",
    seeReward: "Ona zawadi",
    dayStreak: "mfululizo wa siku",
  },
};

/* 🐥 Friendly buddy phrases (spoken on tap) */
const buddyPhrases: Record<string, string[]> = {
  en: ["Yay, you found me!", "Let’s learn together!", "High five!", "You’re amazing!", "Hehe, that tickles!"],
  es: ["¡Bien! ¡Me encontraste!", "¡Aprendamos juntos!", "¡Chócala!", "¡Eres increíble!", "¡Jeje, me haces cosquillas!"],
  fr: ["Youpi, tu m’as trouvé !", "Apprenons ensemble !", "Tape m’en cinq !", "Tu es génial !", "Hi hi, ça chatouille !"],
  rw: ["Yego, wanyibonye!", "Twige hamwe!", "Tampa agatoki!", "Uri intyoza!", "Hihi, biransha umushyitsi!"],
  sw: ["Yaay, umenipata!", "Tujifunze pamoja!", "Nipe tano!", "Wewe ni hodari!", "Hihi, inanichekesha!"],
};

export default function HomePage() {
  const { language } = useLanguage();
  const t = (key: keyof typeof translations["en"]) =>
    translations[language]?.[key] ?? translations.en[key] ?? String(key);

  const router = useRouter();

  const [childName, setChildName] = useState<string | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [todaysMission, setTodaysMission] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [showSurprise, setShowSurprise] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [buddyAction, setBuddyAction] = useState<"idle" | "wave" | "dance">("idle");

  /* 🔄 Load data on mount */
  useEffect(() => {
    setMounted(true);
    loadVoices();
    void fetchUserData();
    void fetchTodaysMission();
  }, []);

  /* 🗣️ Greet child when data is ready / language changes */
  useEffect(() => {
    if (childName) speak(getGreeting(childName), language);
  }, [language, childName]);

  /* 📦 Fetch user info */
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

  /* 🎯 Fetch today's mission */
  const fetchTodaysMission = async () => {
    const { data } = await supabase
      .from("missions")
      .select("*")
      .eq("is_today", true)
      .limit(1)
      .single();
    setTodaysMission(data);
  };

  /* 👋 Greeting helper */
  const getGreeting = (name: string | null) => {
    const hour = new Date().getHours();
    if (hour < 12) return `${t("goodMorning")}, ${name || t("friend")}!`;
    if (hour < 18) return `${t("hello")}, ${name || t("friend")}!`;
    return `${t("goodEvening")}, ${name || t("friend")}!`;
  };

  /* ▶️ Start mission -> learning-focused */
  const handleMissionStart = async () => {
    setShowCelebration(true);
    setBuddyAction("dance");
    speak(t("letsLearn"), language);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const newStars = starsEarned + 1;
      await supabase.from("users").update({ completed_missions: newStars }).eq("id", user.id);
      setStarsEarned(newStars);
      if (newStars >= 3) setShowSurprise(true);
    }

    setTimeout(() => {
      setShowCelebration(false);
      setBuddyAction("idle");
    }, 3000);

    router.push("/missions");
  };

  /* 🐥 Buddy tap interaction */
  const handleBuddyClick = () => {
    const phrases = buddyPhrases[language] || buddyPhrases.en;
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    speak(randomPhrase, language);

    setBuddyAction("wave");
    setTimeout(() => setBuddyAction("idle"), 1600);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col pb-24">
      <Header simple />

      {showCelebration && (
        <Confetti
          recycle={false}
          numberOfPieces={250}
          colors={["#FF9E9E", "#FFD6A5", "#CBFFA9", "#A0C4FF", "#BDB2FF"]}
        />
      )}

      <main className="flex-grow max-w-md mx-auto px-4 py-8 w-full">
        {/* 🐥 Interactive Nimi Buddy */}
        <div className="text-center mb-8">
          <motion.div
            className="relative w-44 h-44 mx-auto mb-6 cursor-pointer select-none"
            onClick={handleBuddyClick}
            role="button"
            aria-label="Nimi buddy"
            animate={
              buddyAction === "wave"
                ? { rotate: [0, 12, -12, 0] }
                : buddyAction === "dance"
                ? { scale: [1, 1.18, 1, 1.18, 1] }
                : { scale: [1, 1.04, 1] }
            }
            transition={{
              duration: buddyAction === "idle" ? 3 : 0.6,
              repeat: buddyAction === "idle" ? Infinity : 2,
            }}
          >
            <motion.img
              src="/nimi-logo.jpg"
              alt="NIMI Buddy"
              className="w-full h-full rounded-full object-cover shadow-lg border-4 border-white"
              draggable={false}
            />
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-1.5 rounded-full shadow-md border-2 border-pink-200">
              <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                {getGreeting(childName)}
              </p>
            </div>
          </motion.div>

          <h1 className="text-3xl font-bold text-purple-600 mb-2">
            👋 {childName || t("friend")}!
          </h1>
          {streak > 0 && (
            <p className="text-lg text-pink-500 flex items-center justify-center gap-1">
              <Fire className="w-5 h-5 text-orange-500" /> {streak} {t("dayStreak")}!
            </p>
          )}
        </div>

        {/* 🎯 Today's Learning */}
        <Card className="bg-gradient-to-r from-pink-100 to-purple-100 border-none shadow-xl mb-8">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Star className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {t("todaysActivity")}
            </h2>
            <h3 className="text-xl font-bold text-purple-600 mb-6">
              {todaysMission?.title || t("loading")}
            </h3>
            <Button
              onClick={handleMissionStart}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-10 py-6 rounded-full text-2xl font-bold shadow-lg hover:shadow-xl"
              size="lg"
              aria-label={t("startLearning")}
            >
              <Play className="w-8 h-8 mr-3" />
              {t("startLearning")}
            </Button>
          </CardContent>
        </Card>

        {/* ⭐ Stars Progress */}
        <Card className="bg-white border-none shadow-md mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-center mb-4">{t("yourStars")} ⭐</h3>
            <div className="flex justify-center space-x-4 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.div
                  key={star}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-3xl ${
                    star <= starsEarned ? "bg-yellow-400 text-white" : "bg-gray-200 text-gray-400"
                  }`}
                  animate={star <= starsEarned ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.6 }}
                >
                  {star <= starsEarned ? "⭐" : "☆"}
                </motion.div>
              ))}
            </div>
            <p className="text-lg text-center text-gray-600">
              {starsEarned > 0
                ? `${t("youHave")} ${starsEarned} ${t("stars")}!`
                : t("learnToEarn")}
            </p>
          </CardContent>
        </Card>

        {/* 🎁 Surprise Reward */}
        {showSurprise && (
          <Card className="bg-gradient-to-r from-yellow-100 to-orange-100 border-none shadow-xl mb-8 animate-wiggle">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-orange-600 mb-2">
                {t("surprise")} 🎁
              </h3>
              <p className="text-gray-700 mb-4">{t("unlockedReward")}</p>
              <Link href="/rewards">
                <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                  {t("seeReward")}
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
