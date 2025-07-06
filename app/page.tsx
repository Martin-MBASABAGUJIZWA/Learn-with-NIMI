"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";                  
import BottomNavigation from "@/components/BottomNavigation";
import Footer from "@/components/Footer";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Target,
  TrendingUp,
  Users,
  Trophy,
  Play,
  Clock,
  Star,
  Volume2,
  BookOpen,
  Gift,
  Heart,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const [childName] = useState("Nika");
  const [availableMissions] = useState(8);
  const [completedMissions, setCompletedMissions] = useState(3);
  const [totalMissions] = useState(8);
  const [pikoPoints, setPikoPoints] = useState(245);
  const [showCelebration, setShowCelebration] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [nimiMessage, setNimiMessage] = useState(t('readyAdventure') + " 🌟");

  // Animate progress bar on load
  const [progressValue, setProgressValue] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressValue((completedMissions / totalMissions) * 100);
    }, 500);
    return () => clearTimeout(timer);
  }, [completedMissions, totalMissions]);

  // Update message when language changes
  useEffect(() => {
    setNimiMessage(t('readyAdventure') + " 🌟");
  }, [language, t]);

  // Today's featured mission - NOW DEFINED INSIDE COMPONENT
  const todaysMission = {
    title: t('morningEmotions'),
    description: t('learnTogether'),
    duration: `10 ${t('duration')}`,
    points: `10 ${t('points')}`,
    type: t('socioEmotional'),
    difficulty: t('difficulty'),
  };

  const handleMissionStart = () => {
    setShowCelebration(true);
    setNimiMessage(t('letsLearn') + " 🎉");
    setTimeout(() => {
      setShowCelebration(false);
      setNimiMessage(t('doingAmazing') + " 🌈");
    }, 3000);
  };

  const handleNimiClick = () => {
    const messages = [
      t('favoriteBuddy') + " 💖",
      t('amazingAdventure') + " 🚀",
      t('believeInYou') + " ⭐",
      t('discoverWonderful') + " 🌟",
      t('learningFun') + " 🎈",
    ];
    setNimiMessage(messages[Math.floor(Math.random() * messages.length)]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 via-purple-50 to-blue-50">
      <Header />

      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce">
            <div className="text-8xl mb-4">🎉</div>
            <div className="text-4xl font-bold text-purple-600 text-center">{t('letsLearn')}</div>
            <div className="text-2xl text-pink-600 text-center">{t('letsLearn')} ⭐</div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 to-pink-200/20 animate-pulse"></div>
        </div>
      )}

      {/* Floating Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-20 left-10 text-yellow-300 animate-bounce text-2xl"
          style={{ animationDelay: "0s" }}
        >
          ⭐
        </div>
        <div
          className="absolute top-40 right-20 text-pink-300 animate-bounce text-2xl"
          style={{ animationDelay: "1s" }}
        >
          🌟
        </div>
        <div
          className="absolute bottom-40 left-20 text-blue-300 animate-bounce text-2xl"
          style={{ animationDelay: "2s" }}
        >
          ✨
        </div>
        <div
          className="absolute bottom-20 right-10 text-green-300 animate-bounce text-2xl"
          style={{ animationDelay: "0.5s" }}
        >
          🎈
        </div>
        <div
          className="absolute top-60 left-1/4 text-purple-300 animate-bounce text-xl"
          style={{ animationDelay: "1.5s" }}
        >
          💫
        </div>
        <div
          className="absolute bottom-60 right-1/4 text-orange-300 animate-bounce text-xl"
          style={{ animationDelay: "2.5s" }}
        >
          🌈
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Welcome Section with NIMI Character */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            {/* NIMI Logo */}
            <div
              className="relative w-32 h-32 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-2xl cursor-pointer transform hover:scale-110 transition-all duration-300 animate-pulse"
              onClick={handleNimiClick}
            >
              <img src="/nimi-logo.png" alt="NIMI" className="w-28 h-28 rounded-full object-contain" />
              {/* Sparkle effects */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-spin">
                ✨
              </div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center animate-bounce">
                💖
              </div>
            </div>

            {/* NIMI Speech Bubble */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg border-2 border-pink-200 animate-bounce">
              <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">{nimiMessage}</p>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4 animate-fade-in">
            👋 {t('hello')}, {childName}!
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700 font-medium mb-2">{t('readyAdventure')}</p>
          <p className="text-lg text-gray-600">{t('dailyVictories')}</p>
        </div>

        {/* Today's Mission Card - Enhanced */}
        <div className="mb-12">
          <Card className="bg-gradient-to-r from-orange-200 via-pink-200 to-purple-200 border-none shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 overflow-hidden relative group">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-300/30 to-pink-300/30 animate-pulse"></div>

            {/* Floating elements inside card */}
            <div className="absolute top-4 right-4 text-yellow-400 animate-bounce text-2xl">⭐</div>
            <div
              className="absolute bottom-4 left-4 text-pink-400 animate-bounce text-xl"
              style={{ animationDelay: "0.5s" }}
            >
              💖
            </div>

            <CardContent className="p-8 md:p-12 relative z-10">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center mr-6 shadow-xl animate-bounce">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">🎯 {t('todaysMission')}</h2>
                    <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {todaysMission.title}
                    </h3>
                  </div>
                </div>

                <p className="text-xl md:text-2xl text-gray-800 mb-8 font-medium leading-relaxed">
                  {todaysMission.description}
                </p>

                {/* Mission Details */}
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

                {/* Action Buttons */}
                <div className="space-y-4">
                  <Button
                    onClick={handleMissionStart}
                    className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white px-12 py-6 rounded-full text-2xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 group-hover:animate-pulse"
                  >
                    <Play className="w-8 h-8 mr-4" />🚀 {t('startLearning')}
                  </Button>

                  <div className="flex flex-wrap justify-center gap-4">
                    <Button
                      variant="outline"
                      className="bg-white/90 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 px-6 py-3 rounded-full font-semibold text-lg shadow-lg"
                    >
                      <Volume2 className="w-5 h-5 mr-2" />🎵 {t('hearFromNimi')}
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white/90 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-full font-semibold text-lg shadow-lg"
                    >
                      <BookOpen className="w-5 h-5 mr-2" />📖 {t('previewMission')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards Grid - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-12">
          {/* Daily Missions */}
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
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">🎯 {t('dailyMissions')}</h3>
                <p className="text-gray-700 text-lg mb-3 font-semibold">
                  {availableMissions} {t('waitingAdventures')}
                </p>
                <p className="text-gray-600 text-sm">{t('tapToStart')}</p>
              </CardContent>
            </Card>
          </Link>

          {/* Progress Tree */}
          <Link href="/progress" className="group">
            <Card className="h-64 cursor-pointer transition-all duration-500 hover:shadow-2xl border-none bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 group-hover:scale-110 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-300/20 to-indigo-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-2xl group-hover:animate-bounce transition-all duration-500">
                  <TrendingUp className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">🌳 {t('learningTree')}</h3>
                <p className="text-gray-700 text-lg mb-3 font-semibold">{t('watchGrow')}</p>
                <p className="text-gray-600 text-sm">{t('seeProgress')}</p>
              </CardContent>
            </Card>
          </Link>

          {/* Community */}
          <Link href="/community" className="group">
            <Card className="h-64 cursor-pointer transition-all duration-500 hover:shadow-2xl border-none bg-gradient-to-br from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 group-hover:scale-110 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-300/20 to-emerald-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-2xl group-hover:animate-pulse transition-all duration-500">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">👥 {t('pikoCommunity')}</h3>
                <p className="text-gray-700 text-lg mb-3 font-semibold">{t('shareCelebrate')}</p>
                <p className="text-gray-600 text-sm">{t('connectFriends')}</p>
              </CardContent>
            </Card>
          </Link>

          {/* Piko Peaks */}
          <Link href="/piko-peaks" className="group">
            <Card className="h-64 cursor-pointer transition-all duration-500 hover:shadow-2xl border-none bg-gradient-to-br from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 group-hover:scale-110 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-300/20 to-pink-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 shadow-2xl group-hover:animate-bounce transition-all duration-500">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">🏔️ {t('pikoPeaks')}</h3>
                <p className="text-gray-700 text-lg mb-3 font-semibold">{t('unlockRewards')}</p>
                <p className="text-gray-600 text-sm">{t('celebrateVictories')}</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Enhanced Interactive Piko Progress Section */}
        <Card className="mb-12 bg-gradient-to-r from-yellow-100 via-orange-100 to-pink-100 border-none shadow-2xl overflow-hidden relative">
          {/* Animated background sparkles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce text-yellow-300"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                ✨
              </div>
            ))}
          </div>

          <CardContent className="p-8 md:p-12 relative z-10">
            <div className="text-center mb-8">
              {/* Interactive Title with Sparkling Graduation Cap */}
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4 shadow-2xl animate-pulse cursor-pointer transform hover:scale-125 transition-all duration-300">
                    <span className="text-3xl animate-bounce">🎓</span>
                    {/* Sparkling effects around the cap */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-spin">⭐</div>
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 text-pink-400 animate-bounce">✨</div>
                    <div className="absolute top-0 left-0 w-4 h-4 text-blue-400 animate-ping">💫</div>
                  </div>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                  🌟 {t('progressAdventure')} 🌟
                </h3>
              </div>

              {/* Piko Points Display with Enhanced Animation */}
              <div className="mb-8">
                <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-12 py-8 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 cursor-pointer group">
                  <div className="relative">
                    <Star className="w-12 h-12 mr-4 animate-spin group-hover:animate-pulse" />
                    {/* Orbiting mini stars */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 text-yellow-200 animate-bounce">⭐</div>
                    <div className="absolute -bottom-2 -left-2 w-3 h-3 text-orange-200 animate-ping">✨</div>
                  </div>
                  <span className="text-5xl font-bold animate-pulse">{pikoPoints}</span>
                  <span className="text-3xl ml-4 animate-bounce">{t('points')} 🎉</span>
                </div>
              </div>

              {/* Highly Interactive Progress Bar with Story Elements */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-bold text-gray-800 animate-bounce">🚀 {t('learningJourney')}</span>
                  <span className="text-2xl font-bold text-orange-600 animate-pulse">
                    {completedMissions}/{totalMissions} {t('adventuresComplete')}
                  </span>
                </div>

                {/* Story-telling Progress Bar Container */}
                <div className="relative bg-gradient-to-r from-blue-100 to-purple-100 rounded-full h-16 shadow-inner border-4 border-white overflow-hidden">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-200/50 to-purple-200/50 animate-pulse"></div>

                  {/* Progress Fill with Gradient Animation */}
                  <div
                    className="h-full bg-gradient-to-r from-green-400 via-blue-400 via-purple-400 to-pink-400 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${progressValue}%` }}
                  >
                    {/* Animated shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                    {/* Moving sparkles inside progress */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute text-white animate-bounce text-lg"
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

                  {/* NIMI Character Moving Along Progress */}
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-1000 ease-out"
                    style={{ left: `${Math.max(progressValue - 8, 0)}%` }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-xl animate-bounce border-4 border-white">
                      <img src="/nimi-logo.png" alt="NIMI" className="w-8 h-8 rounded-full object-contain" />
                    </div>
                    {/* NIMI's celebration trail */}
                    <div className="absolute -top-2 -right-1 text-yellow-400 animate-spin text-sm">✨</div>
                    <div className="absolute -bottom-2 -left-1 text-pink-400 animate-bounce text-sm">💖</div>
                  </div>

                  {/* Milestone Markers */}
                  {[25, 50, 75, 100].map((milestone, index) => (
                    <div
                      key={milestone}
                      className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                      style={{ left: `${milestone}%` }}
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
                      {/* Milestone celebration */}
                      {progressValue >= milestone && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                          <div className="text-yellow-400 animate-bounce text-2xl">🎉</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Progress Bar Labels */}
                <div className="flex justify-between mt-4 text-sm font-semibold text-gray-600">
                  <span className="animate-bounce">🌱 {t('start')}</span>
                  <span className={progressValue >= 25 ? "text-orange-600 animate-pulse" : ""}>🌿 {t('growing')}</span>
                  <span className={progressValue >= 50 ? "text-green-600 animate-pulse" : ""}>🌳 {t('blooming')}</span>
                  <span className={progressValue >= 75 ? "text-purple-600 animate-pulse" : ""}>🌟 {t('shining')}</span>
                  <span className={progressValue >= 100 ? "text-pink-600 animate-bounce" : ""}>👑 {t('master')}</span>
                </div>
              </div>

              {/* Dynamic Encouraging Message with Animations */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-6 border-4 border-white shadow-xl">
                  <p className="text-2xl text-gray-800 font-bold animate-bounce">
                    🌟 {t('amazingWork')}{" "}
                    <span className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                      {completedMissions}
                    </span>{" "}
                    {t('incredibleMissions')} 🎉
                  </p>
                  <p className="text-xl text-gray-700 mt-4 animate-pulse">
                    {totalMissions - completedMissions > 0
                      ? `${t('moreAdventures').replace("1", (totalMissions - completedMissions).toString())} 🚀✨`
                      : `🎊 ${t('completedAll')} 👑🌟`}
                  </p>
                </div>

                {/* Next Reward Tease */}
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border-4 border-white shadow-xl">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl animate-spin mr-4">
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-800">🎁 {t('nextReward')}</h4>
                  </div>
                  <div className="flex items-center justify-center space-x-4">
                    {/* Blurred reward preview */}
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center shadow-xl blur-sm">
                        <span className="text-3xl">🏆</span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl animate-bounce">🔒</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-700">{t('mysteryBadge')}</p>
                      <p className="text-sm text-gray-600">{t('completeMore')} 🌟</p>
                    </div>
                  </div>
                </div>

                {/* Sound Integration Cue */}
                <div className="flex items-center justify-center space-x-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl p-4 border-4 border-white shadow-xl">
                  <Volume2 className="w-8 h-8 text-blue-600 animate-pulse" />
                  <span className="text-lg font-bold text-blue-800">🎵 {t('celebrationSounds')}</span>
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-bounce cursor-pointer">
                    <span className="text-white text-sm">▶️</span>
                  </div>
                </div>
              </div>

              {/* Achievement Sparkles with Enhanced Animation */}
              <div className="flex justify-center space-x-4 mt-8">
                {[...Array(completedMissions)].map((_, i) => (
                  <div key={i} className="relative">
                    <div
                      className="w-16 h-16 text-yellow-400 animate-bounce text-4xl cursor-pointer transform hover:scale-125 transition-all duration-300"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    >
                      ⭐
                    </div>
                    {/* Orbiting mini sparkles */}
                    <div className="absolute top-0 right-0 w-4 h-4 text-pink-400 animate-spin text-sm">✨</div>
                    <div className="absolute bottom-0 left-0 w-3 h-3 text-blue-400 animate-ping text-xs">💫</div>
                  </div>
                ))}
                {[...Array(totalMissions - completedMissions)].map((_, i) => (
                  <div
                    key={i + completedMissions}
                    className="w-16 h-16 text-gray-300 text-4xl hover:text-gray-400 transition-all duration-300 cursor-pointer transform hover:scale-110"
                  >
                    ☆
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Rewards Tease */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-r from-pink-100 to-purple-100 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Volume2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">🎵 {t('nimisVoice')}</h3>
              <p className="text-gray-600 mb-4">{t('listenMessages')}</p>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full">
                {t('playMessage')}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-100 to-blue-100 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">🎁 {t('newReward')}</h3>
              <p className="text-gray-600 mb-4">{t('unlockedSticker')}</p>
              <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-full">
                {t('viewRewards')}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-100 to-orange-100 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">💖 {t('dailyLove')}</h3>
              <p className="text-gray-600 mb-4">{t('sendLove')}</p>
              <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-full">
                {t('spreadLove')}
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