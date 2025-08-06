"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Baby,
  Clock,
  Moon,
  Lock,
  Trophy,
  CalendarCheck,
  Gem,
  Volume2,
  VolumeX,
} from "lucide-react";

// Import Header, Footer, BottomNavigation
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNavigation from "@/components/BottomNavigation";

const language = "en"; // Change to "sw" or "fr" for Swahili or French

export default function ParentPage() {
  const [screenTime, setScreenTime] = useState(30);
  const [bedtimeMode, setBedtimeMode] = useState(true);
  const [contentLock, setContentLock] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);

  const todaysProgress = [
    { name: "ABCs", completed: true },
    { name: "Counting", completed: true },
    { name: "Shapes", completed: false },
  ];

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && voiceOn) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang =
        language === "sw" ? "sw-TZ" : language === "fr" ? "fr-FR" : "en-US";
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    const intro =
      language === "sw"
        ? "Karibu kwenye ukurasa wa mzazi wa Nimi. Hapa unaweza kufuatilia maendeleo ya mtoto wako."
        : language === "fr"
        ? "Bienvenue sur la page parentale de Nimi. Vous pouvez suivre les progrès de votre enfant ici."
        : "Welcome to Nimi's Parent Zone. Here you can track your child's progress and adjust settings.";
    speak(intro);
  }, [voiceOn]);

  const completedCount = todaysProgress.filter((a) => a.completed).length;
  const progressPercent = (completedCount / todaysProgress.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-blue-50">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-grow w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6 relative">
        {/* Global voice toggle */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVoiceOn((prev) => !prev)}
            className="text-blue-500"
            aria-label={voiceOn ? "Mute voice" : "Unmute voice"}
          >
            {voiceOn ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Header Text */}
        <div className="text-center pt-2 md:pt-4">
          <div className="flex justify-center items-center gap-3">
            <Baby className="text-pink-500 h-8 w-8" />
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600">
              Nimi's Learning Platform for your Toddlers
            </h1>
          </div>
          <p className="text-blue-400 mt-1 text-sm">
            For parents of curious 2-4 yearolds
          </p>
        </div>

        {/* Grid Layout for Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {/* Child Profile */}
          <Card className="bg-white border-2 border-blue-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src="/toddler-avatar.png" alt="Nimi's avatar" />
                </Avatar>
                <div>
                  <CardTitle className="text-xl">Nimi</CardTitle>
                  <p className="text-blue-500 flex items-center gap-1 text-sm">
                    <CalendarCheck className="h-4 w-4" />
                    <span>2-4 years old</span>
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Today's Progress */}
          <Card className="bg-yellow-50 border-2 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Trophy className="h-5 w-5" />
                Today's Adventures
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    speak(
                      language === "sw"
                        ? `Leo, Nimi amekamilisha kazi ${completedCount} kati ya ${todaysProgress.length}.`
                        : language === "fr"
                        ? `Aujourd'hui, Nimi a terminé ${completedCount} activités sur ${todaysProgress.length}.`
                        : `Today, Nimi completed ${completedCount} out of ${todaysProgress.length} activities.`
                    )
                  }
                  aria-label="Read today's progress"
                >
                  <Volume2 className="w-4 h-4 text-yellow-600" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaysProgress.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      item.completed ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  <span
                    className={item.completed ? "font-medium" : "text-gray-500"}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
              <Progress
                value={progressPercent}
                className="h-3 mt-4 bg-yellow-100"
              />
              <p className="text-sm text-yellow-600 text-center mt-1">
                {completedCount} of {todaysProgress.length} activities completed!
              </p>
            </CardContent>
          </Card>

          {/* Parental Controls */}
          <Card className="bg-pink-50 border-2 border-pink-200">
            <CardHeader>
              <CardTitle className="text-pink-700 flex items-center gap-2">
                Safety & Settings
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    speak(
                      language === "sw"
                        ? "Hapa unaweza kudhibiti muda wa skrini, hali ya kulala, na usalama wa maudhui."
                        : language === "fr"
                        ? "Ici, vous pouvez contrôler le temps d'écran, le mode nuit et le contenu adapté."
                        : "Here you can control screen time, bedtime mode, and kid-safe content."
                    )
                  }
                  aria-label="Read safety settings"
                >
                  <Volume2 className="w-4 h-4 text-pink-600" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Screen Time */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-pink-500" />
                    <span className="font-medium">Screen Time</span>
                  </div>
                  <span className="font-bold text-pink-600">{screenTime} min</span>
                </div>
                <Slider
                  value={[screenTime]}
                  max={60}
                  step={5}
                  onValueChange={([val]) => setScreenTime(val)}
                  className="[&_[role=slider]]:bg-pink-500"
                />
              </div>

              {/* Bedtime Mode */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Bedtime Mode</span>
                </div>
                <Switch
                  checked={bedtimeMode}
                  onCheckedChange={setBedtimeMode}
                  className="data-[state=checked]:bg-purple-500"
                />
              </div>

              {/* Content Lock */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Kid-Safe Only</span>
                </div>
                <Switch
                  checked={contentLock}
                  onCheckedChange={setContentLock}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Premium Features */}
          <Card className="bg-purple-50 border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Gem className="h-5 w-5" />
                Premium Benefits
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    speak(
                      language === "sw"
                        ? "Furahia michezo zaidi ya mia moja, ripoti za kila siku, na matumizi bila matangazo."
                        : language === "fr"
                        ? "Profitez de plus de 100 jeux éducatifs, rapports quotidiens et sans publicité."
                        : "Enjoy 100+ educational games, daily reports, and an ad-free experience."
                    )
                  }
                  aria-label="Read premium benefits"
                >
                  <Volume2 className="w-4 h-4 text-purple-600" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-purple-600 list-disc pl-5">
                <li>100+ educational games</li>
                <li>Daily progress reports</li>
                <li>Ad-free experience</li>
              </ul>
              <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Designed with ❤️ for Nimi's early learning journey
        </p>
      </main>

      {/* Footer + BottomNavigation */}
      <Footer />
      <BottomNavigation />
    </div>
  );
}