"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Header from "@/components/Header"
import BottomNavigation from "@/components/BottomNavigation"
import Footer from "@/components/Footer"
import { Star, Trophy, Gift, Crown, Sparkles, Zap, Target, BookOpen, Palette, Music } from "lucide-react"

export default function RewardsPage() {
  const [pikoPoints] = useState(245)
  const [selectedReward, setSelectedReward] = useState(null)
  const [showCelebration, setShowCelebration] = useState(false)

  // Virtual Sticker Collection
  const stickerCollection = [
    { id: 1, name: "Happy Face", emoji: "😊", unlocked: true, category: "Emotions" },
    { id: 2, name: "Rainbow", emoji: "🌈", unlocked: true, category: "Nature" },
    { id: 3, name: "Star", emoji: "⭐", unlocked: true, category: "Achievement" },
    { id: 4, name: "Heart", emoji: "💖", unlocked: true, category: "Love" },
    { id: 5, name: "Rocket", emoji: "🚀", unlocked: false, category: "Adventure" },
    { id: 6, name: "Crown", emoji: "👑", unlocked: false, category: "Royal" },
    { id: 7, name: "Unicorn", emoji: "🦄", unlocked: false, category: "Magic" },
    { id: 8, name: "Dragon", emoji: "🐉", unlocked: false, category: "Fantasy" },
  ]

  // Unlockable Rewards
  const rewards = [
    {
      id: 1,
      name: "Art Supply Box",
      description: "Unlock amazing art supplies for your creative missions!",
      cost: 100,
      unlocked: true,
      icon: Palette,
      color: "from-pink-400 to-purple-400",
      emoji: "🎨",
    },
    {
      id: 2,
      name: "Story Book Collection",
      description: "Access to magical stories from around the world!",
      cost: 150,
      unlocked: true,
      icon: BookOpen,
      color: "from-blue-400 to-indigo-400",
      emoji: "📚",
    },
    {
      id: 3,
      name: "Music Box",
      description: "Create beautiful melodies and learn about rhythm!",
      cost: 200,
      unlocked: false,
      icon: Music,
      color: "from-green-400 to-emerald-400",
      emoji: "🎵",
    },
    {
      id: 4,
      name: "Explorer Badge",
      description: "Show everyone you're a brave little explorer!",
      cost: 300,
      unlocked: false,
      icon: Target,
      color: "from-yellow-400 to-orange-400",
      emoji: "🏅",
    },
    {
      id: 5,
      name: "NIMI's Special Crown",
      description: "The ultimate reward for completing all missions!",
      cost: 500,
      unlocked: false,
      icon: Crown,
      color: "from-purple-500 to-pink-500",
      emoji: "👑",
    },
  ]

  const handleRewardClick = (reward) => {
    if (reward.unlocked) {
      setSelectedReward(reward)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 2000)
    }
  }

  const unlockedStickers = stickerCollection.filter((s) => s.unlocked).length
  const unlockedRewards = rewards.filter((r) => r.unlocked).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Header />

      {/* Celebration Animation */}
      {showCelebration && selectedReward && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-center animate-bounce">
            <div className="text-8xl mb-4">{selectedReward.emoji}</div>
            <div className="text-4xl font-bold text-purple-600">Reward Unlocked!</div>
            <div className="text-2xl text-pink-600">{selectedReward.name} ✨</div>
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
          🎁
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
          👑
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Remove the entire Back Button section */}

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">🎁</div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Piko Rewards
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            Celebrate your amazing achievements and unlock magical rewards! ✨
          </p>
        </div>

        {/* Piko Points Counter */}
        <Card className="mb-8 bg-gradient-to-r from-yellow-100 to-orange-100 border-none shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-xl animate-spin">
                <Star className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Piko Points</h2>
            <div className="text-6xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-4">
              {pikoPoints}
            </div>
            <p className="text-lg text-gray-700">Keep learning to earn more points! 🌟</p>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Gift className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-bounce" />
              <div className="text-3xl font-bold text-purple-800 mb-2">{unlockedRewards}</div>
              <div className="text-sm text-purple-700 font-semibold">Rewards Unlocked 🎁</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-100 to-indigo-100 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <div className="text-3xl font-bold text-blue-800 mb-2">{unlockedStickers}</div>
              <div className="text-sm text-blue-700 font-semibold">Stickers Collected ✨</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Trophy className="w-16 h-16 text-green-600 mx-auto mb-4 animate-pulse" />
              <div className="text-3xl font-bold text-green-800 mb-2">3</div>
              <div className="text-sm text-green-700 font-semibold">Special Badges 🏆</div>
            </CardContent>
          </Card>
        </div>

        {/* Virtual Sticker Book */}
        <Card className="mb-8 bg-gradient-to-r from-pink-100 to-purple-100 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <Sparkles className="w-8 h-8 mr-3 text-pink-600" />📖 My Sticker Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-6">
              {stickerCollection.map((sticker) => (
                <div
                  key={sticker.id}
                  className={`aspect-square rounded-xl flex items-center justify-center text-4xl cursor-pointer transition-all duration-300 ${
                    sticker.unlocked
                      ? "bg-white shadow-lg hover:shadow-xl hover:scale-110 animate-pulse"
                      : "bg-gray-200 opacity-50 grayscale"
                  }`}
                  onClick={() => sticker.unlocked && handleRewardClick({ ...sticker, emoji: sticker.emoji })}
                >
                  {sticker.unlocked ? sticker.emoji : "❓"}
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-lg text-gray-700 mb-4">Collect stickers by completing missions! 🌟</p>
              <Progress value={(unlockedStickers / stickerCollection.length) * 100} className="h-4 max-w-md mx-auto" />
              <p className="text-sm text-gray-600 mt-2">
                {unlockedStickers}/{stickerCollection.length} stickers collected
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Unlockable Rewards */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
            <Gift className="w-8 h-8 mr-3 text-pink-500" />🎁 Amazing Rewards to Unlock
            <Star className="w-8 h-8 ml-3 text-yellow-500" />
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <Card
                key={reward.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-2xl border-none overflow-hidden ${
                  reward.unlocked
                    ? "bg-gradient-to-br from-yellow-50 to-orange-50 shadow-xl hover:scale-105"
                    : pikoPoints >= reward.cost
                      ? "bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg hover:scale-105 ring-2 ring-green-300"
                      : "bg-gray-100 opacity-70"
                }`}
                onClick={() => handleRewardClick(reward)}
              >
                <CardContent className="p-6 text-center relative">
                  {/* Cost Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge
                      className={`font-bold text-sm ${
                        reward.unlocked
                          ? "bg-green-500 text-white"
                          : pikoPoints >= reward.cost
                            ? "bg-blue-500 text-white animate-pulse"
                            : "bg-gray-400 text-white"
                      }`}
                    >
                      {reward.unlocked ? "✅ Unlocked" : `${reward.cost} points`}
                    </Badge>
                  </div>

                  {/* Reward Icon */}
                  <div
                    className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center relative ${
                      reward.unlocked
                        ? `bg-gradient-to-br ${reward.color} shadow-2xl`
                        : pikoPoints >= reward.cost
                          ? `bg-gradient-to-br ${reward.color} shadow-xl animate-pulse`
                          : "bg-gray-300 shadow-md"
                    }`}
                  >
                    <reward.icon
                      className={`w-10 h-10 ${reward.unlocked || pikoPoints >= reward.cost ? "text-white" : "text-gray-500"}`}
                    />
                    {reward.unlocked && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                        <span className="text-white text-lg">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Reward Details */}
                  <div className="text-4xl mb-3">{reward.emoji}</div>
                  <h3
                    className={`text-lg font-bold mb-2 ${reward.unlocked || pikoPoints >= reward.cost ? "text-gray-800" : "text-gray-500"}`}
                  >
                    {reward.name}
                  </h3>
                  <p
                    className={`text-sm mb-4 ${reward.unlocked || pikoPoints >= reward.cost ? "text-gray-600" : "text-gray-400"}`}
                  >
                    {reward.description}
                  </p>

                  {/* Action Button */}
                  {reward.unlocked ? (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 font-bold">
                      ✨ Enjoy Your Reward! ✨
                    </Badge>
                  ) : pikoPoints >= reward.cost ? (
                    <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full px-6 py-2 font-bold animate-pulse">
                      🎉 Unlock Now!
                    </Button>
                  ) : (
                    <Badge className="bg-gray-400 text-white px-4 py-2">🔒 Keep Learning!</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Motivational Section */}
        <Card className="bg-gradient-to-r from-blue-100 to-indigo-100 border-none shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🌟</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">You're Doing Amazing!</h3>
            <p className="text-lg text-gray-700 mb-6">
              Every mission you complete brings you closer to incredible rewards! Keep exploring, keep learning, and
              keep being the wonderful little explorer you are! 🚀
            </p>
            <div className="flex justify-center space-x-2">
              {[...Array(8)].map((_, i) => (
                <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                  ⭐
                </span>
              ))}
            </div>
            <div className="mt-6">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110">
                <Zap className="w-5 h-5 mr-2" />🚀 Continue Learning Adventure!
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  )
}
