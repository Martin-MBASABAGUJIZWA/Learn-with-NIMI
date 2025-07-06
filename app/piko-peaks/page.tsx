"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Header from "@/components/Header"
import BottomNavigation from "@/components/BottomNavigation"
import Footer from "@/components/Footer"
import { Mountain, Trophy, Star, Heart, Palette, Target, BookOpen, Sparkles, Gift, Crown, Zap } from "lucide-react"

export default function PikoPeaksPage() {
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [showCelebration, setShowCelebration] = useState(false)

  const achievements = [
    {
      title: "First Steps Hero",
      description: "Completed your very first mission with NIMI!",
      icon: Trophy,
      earned: true,
      color: "from-yellow-400 to-orange-400",
      points: 50,
      rarity: "Common",
      unlockDate: "July 1st, 2025",
    },
    {
      title: "Emotion Explorer",
      description: "Mastered recognizing and expressing 5 different emotions",
      icon: Heart,
      earned: true,
      color: "from-pink-400 to-rose-400",
      points: 75,
      rarity: "Rare",
      unlockDate: "July 1st, 2025",
    },
    {
      title: "Creative Artist",
      description: "Created your first natural art masterpiece with NIMI",
      icon: Palette,
      earned: true,
      color: "from-purple-400 to-pink-400",
      points: 100,
      rarity: "Epic",
      unlockDate: "July 1st, 2025",
    },
    {
      title: "Story Teller Master",
      description: "Acted out a complete traditional story with amazing expressions",
      icon: BookOpen,
      earned: false,
      color: "from-green-400 to-emerald-400",
      points: 125,
      rarity: "Rare",
      unlockDate: "Coming Soon!",
    },
    {
      title: "Mission Master",
      description: "Completed 10 missions in a row without missing a day",
      icon: Target,
      earned: false,
      color: "from-blue-400 to-indigo-400",
      points: 200,
      rarity: "Epic",
      unlockDate: "Coming Soon!",
    },
    {
      title: "Week Warrior",
      description: "Maintained a perfect 7-day learning streak",
      icon: Zap,
      earned: false,
      color: "from-orange-400 to-red-400",
      points: 300,
      rarity: "Legendary",
      unlockDate: "Coming Soon!",
    },
    {
      title: "NIMI's Best Friend",
      description: "Completed all 8 days of the Mini Preschool program",
      icon: Crown,
      earned: false,
      color: "from-purple-500 to-pink-500",
      points: 500,
      rarity: "Legendary",
      unlockDate: "Coming Soon!",
    },
  ]

  const totalPoints = achievements.filter((a) => a.earned).reduce((sum, a) => sum + a.points, 0)
  const earnedCount = achievements.filter((a) => a.earned).length

  const handleBadgeClick = (badge) => {
    if (badge.earned) {
      setSelectedBadge(badge)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 2000)
    }
  }

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "Common":
        return "text-gray-600 bg-gray-100"
      case "Rare":
        return "text-blue-600 bg-blue-100"
      case "Epic":
        return "text-purple-600 bg-purple-100"
      case "Legendary":
        return "text-yellow-600 bg-yellow-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Header />

      {/* Celebration Animation */}
      {showCelebration && selectedBadge && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-center animate-bounce">
            <div className="text-8xl mb-4">🏆</div>
            <div className="text-4xl font-bold text-purple-600">{selectedBadge.title}</div>
            <div className="text-2xl text-pink-600">+{selectedBadge.points} Piko Points! ⭐</div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/30 to-pink-200/30 animate-pulse"></div>
        </div>
      )}

      {/* Floating Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-20 left-10 text-yellow-400 animate-bounce text-3xl"
          style={{ animationDelay: "0s" }}
        >
          🏆
        </div>
        <div
          className="absolute top-40 right-20 text-pink-400 animate-bounce text-3xl"
          style={{ animationDelay: "1s" }}
        >
          👑
        </div>
        <div
          className="absolute bottom-40 left-20 text-blue-400 animate-bounce text-3xl"
          style={{ animationDelay: "2s" }}
        >
          ⭐
        </div>
        <div
          className="absolute bottom-20 right-10 text-green-400 animate-bounce text-3xl"
          style={{ animationDelay: "0.5s" }}
        >
          🎖️
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="text-8xl mb-4">🏔️</div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Piko Peaks
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            Celebrate your amazing achievements and unlock incredible rewards! 🎉
          </p>
        </div>

        {/* Achievement Stats - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Mountain className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-bounce" />
              <div className="text-4xl font-bold text-purple-800 mb-2">{earnedCount}</div>
              <div className="text-sm text-purple-700 font-semibold">Peaks Reached 🏔️</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-100 to-orange-100 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Trophy className="w-16 h-16 text-yellow-600 mx-auto mb-4 animate-pulse" />
              <div className="text-4xl font-bold text-yellow-800 mb-2">{achievements.length}</div>
              <div className="text-sm text-yellow-700 font-semibold">Total Badges 🏆</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Star className="w-16 h-16 text-green-600 mx-auto mb-4 animate-spin" />
              <div className="text-4xl font-bold text-green-800 mb-2">{totalPoints}</div>
              <div className="text-sm text-green-700 font-semibold">Badge Points ⭐</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-100 to-indigo-100 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Gift className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-bounce" />
              <div className="text-4xl font-bold text-blue-800 mb-2">3</div>
              <div className="text-sm text-blue-700 font-semibold">Rewards Unlocked 🎁</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress to Next Badge */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-100 to-purple-100 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <Target className="w-8 h-8 mr-3 text-indigo-600" />🎯 Next Peak to Conquer
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center space-x-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-xl">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-gray-800">Story Teller Master</h3>
                <p className="text-lg text-gray-600">Act out a complete traditional story</p>
                <Badge className={`mt-2 ${getRarityColor("Rare")}`}>Rare Badge</Badge>
              </div>
            </div>
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Progress</span>
                <span className="text-sm text-gray-600">1/3 story missions</span>
              </div>
              <Progress value={33} className="h-3 mb-4" />
              <p className="text-blue-600 font-semibold">Complete 2 more story missions to unlock! 📚</p>
            </div>
          </CardContent>
        </Card>

        {/* Virtual Trophy Case */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
            <Trophy className="w-8 h-8 mr-3 text-yellow-600" />🏆 Your Amazing Badge Collection
            <Sparkles className="w-8 h-8 ml-3 text-pink-500" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {achievements.map((achievement, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all duration-300 hover:shadow-2xl border-none overflow-hidden ${
                  achievement.earned
                    ? "bg-gradient-to-br from-yellow-50 to-orange-50 shadow-xl hover:scale-105"
                    : "bg-gray-100 opacity-60 hover:opacity-80"
                }`}
                onClick={() => handleBadgeClick(achievement)}
              >
                <CardContent className="p-8 text-center relative">
                  {/* Rarity Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge className={`${getRarityColor(achievement.rarity)} font-bold text-xs`}>
                      {achievement.rarity}
                    </Badge>
                  </div>

                  {/* Achievement Icon */}
                  <div
                    className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center relative ${
                      achievement.earned ? `bg-gradient-to-br ${achievement.color} shadow-2xl` : "bg-gray-300 shadow-md"
                    }`}
                  >
                    <achievement.icon className={`w-12 h-12 ${achievement.earned ? "text-white" : "text-gray-500"}`} />
                    {achievement.earned && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white text-lg">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Achievement Details */}
                  <h3 className={`text-xl font-bold mb-3 ${achievement.earned ? "text-gray-800" : "text-gray-500"}`}>
                    {achievement.title}
                  </h3>
                  <p
                    className={`text-sm mb-4 leading-relaxed ${achievement.earned ? "text-gray-600" : "text-gray-400"}`}
                  >
                    {achievement.description}
                  </p>

                  {/* Points and Date */}
                  <div className="space-y-2">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        achievement.earned ? "bg-yellow-100 text-yellow-800" : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <Star className="w-4 h-4 mr-1" />+{achievement.points} Points
                    </div>
                    <p className={`text-xs ${achievement.earned ? "text-gray-500" : "text-gray-400"}`}>
                      {achievement.earned ? `Unlocked: ${achievement.unlockDate}` : achievement.unlockDate}
                    </p>
                  </div>

                  {/* Earned Badge */}
                  {achievement.earned && (
                    <div className="mt-4">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 font-bold animate-pulse">
                        ✨ Earned! ✨
                      </Badge>
                    </div>
                  )}

                  {/* Locked Badge */}
                  {!achievement.earned && (
                    <div className="mt-4">
                      <Badge className="bg-gray-400 text-white px-4 py-2">🔒 Locked</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Rewards Section */}
        <Card className="mb-8 bg-gradient-to-r from-pink-100 to-purple-100 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <Gift className="w-8 h-8 mr-3 text-pink-600" />🎁 Your Reward Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white/80 rounded-xl shadow-md">
                <div className="text-4xl mb-3">🎨</div>
                <h3 className="font-bold text-gray-800 mb-2">Art Supplies</h3>
                <p className="text-sm text-gray-600">Unlocked with Creative Artist badge</p>
                <Badge className="mt-2 bg-green-500 text-white">Unlocked!</Badge>
              </div>
              <div className="text-center p-6 bg-white/80 rounded-xl shadow-md">
                <div className="text-4xl mb-3">📚</div>
                <h3 className="font-bold text-gray-800 mb-2">Story Book</h3>
                <p className="text-sm text-gray-600">Unlocked with First Steps Hero badge</p>
                <Badge className="mt-2 bg-green-500 text-white">Unlocked!</Badge>
              </div>
              <div className="text-center p-6 bg-white/80 rounded-xl shadow-md">
                <div className="text-4xl mb-3">🎵</div>
                <h3 className="font-bold text-gray-800 mb-2">Music Box</h3>
                <p className="text-sm text-gray-600">Unlocked with Emotion Explorer badge</p>
                <Badge className="mt-2 bg-green-500 text-white">Unlocked!</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Motivational Message */}
        <Card className="bg-gradient-to-r from-blue-100 to-indigo-100 border-none shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🌟</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">You're Doing Amazing!</h3>
            <p className="text-lg text-gray-700 mb-6">
              Every mission you complete makes you stronger, smarter, and more creative. NIMI is so proud of your
              progress! Keep exploring, keep learning, and keep being the amazing little explorer you are! 🚀
            </p>
            <div className="flex justify-center space-x-2">
              {[...Array(10)].map((_, i) => (
                <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                  ⭐
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  )
}
