"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Header from "@/components/Header"
import Link from "next/link"
import BottomNavigation from "@/components/BottomNavigation"
import Footer from "@/components/Footer"
import {
  Star,
  Trophy,
  Gift,
  Crown,
  Sparkles,
  Zap,
  Target,
  BookOpen,
  Palette,
  Music,
} from "lucide-react"
import confetti from "canvas-confetti"

export default function RewardsPage() {
  const [pikoPoints] = useState(245)
  const [selectedReward, setSelectedReward] = useState(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
      confetti({ 
        particleCount: isMobile ? 80 : 150, 
        spread: isMobile ? 80 : 120, 
        origin: { y: 0.6 } 
      })

      // Voice feedback toddler style:
      const speech = new SpeechSynthesisUtterance(
        `Yay! You unlocked ${reward.name}! Keep going!`
      )
      speech.lang = "en-US"
      speech.rate = 0.9 // Slower for toddlers
      speech.pitch = 1.2 // Higher pitch for engagement
      speechSynthesis.speak(speech)

      setTimeout(() => setShowCelebration(false), 2500)
    }
  }

  const unlockedStickers = stickerCollection.filter((s) => s.unlocked).length
  const unlockedRewards = rewards.filter((r) => r.unlocked).length

  // Responsive text sizes
  const responsiveText = {
    h1: isMobile ? "text-4xl" : "text-5xl",
    h2: isMobile ? "text-3xl" : "text-4xl",
    h3: isMobile ? "text-2xl" : "text-3xl",
    p: isMobile ? "text-lg" : "text-xl",
    points: isMobile ? "text-6xl" : "text-8xl",
    button: isMobile ? "text-xl" : "text-2xl",
    sticker: isMobile ? "text-4xl" : "text-5xl",
    rewardEmoji: isMobile ? "text-5xl" : "text-6xl"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 font-sans select-none overflow-x-hidden">
      <Header />

      {/* Celebration Overlay */}
      {showCelebration && selectedReward && (
        <div className="fixed inset-0 bg-purple-900/40 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center animate-pulse">
            <div className={`${responsiveText.rewardEmoji} mb-4 animate-bounce`}>{selectedReward.emoji}</div>
            <h2 className={`${responsiveText.h1} font-extrabold text-white drop-shadow-lg`}>
              Reward Unlocked!
            </h2>
            <p className={`${responsiveText.h3} text-pink-300 font-semibold drop-shadow-md`}>
              {selectedReward.name} ✨
            </p>
          </div>
        </div>
      )}

      {/* Floating Icons */}
      <div className="fixed inset-0 pointer-events-none overflow-visible">
        {["🏆", "🎁", "⭐", "👑"].map((icon, i) => (
          <div
            key={i}
            className={`absolute ${isMobile ? "text-3xl" : "text-4xl"} animate-bounce`}
            style={{
              top: `${20 + i * 15}vh`,
              left: `${10 + i * 20}vw`,
              animationDelay: `${i * 0.7}s`,
              color:
                i === 0
                  ? "#facc15"
                  : i === 1
                  ? "#ec4899"
                  : i === 2
                  ? "#60a5fa"
                  : "#a78bfa",
              filter: "drop-shadow(0 0 4px rgba(0,0,0,0.2))",
            }}
          >
            {icon}
          </div>
        ))}
      </div>

      <main className={`max-w-6xl mx-auto px-4 ${isMobile ? "py-4" : "py-8"}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`${isMobile ? "text-6xl" : "text-8xl"} mb-4 animate-pulse`}>🎁</div>
          <h1 className={`${responsiveText.h1} font-extrabold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-3`}>
            Piko Rewards
          </h1>
          <p className={`${responsiveText.p} text-gray-800 mx-auto max-w-md md:max-w-xl`}>
            Celebrate your amazing achievements and unlock magical rewards! ✨
          </p>
        </div>

        {/* Piko Points */}
        <Card className={`mb-8 bg-gradient-to-r from-yellow-100 to-orange-100 border-none shadow-2xl ${isMobile ? "rounded-2xl" : "rounded-3xl"}`}>
          <CardContent className={`${isMobile ? "p-6" : "p-10"} text-center`}>
            <div className="flex justify-center mb-4">
              <div className={`${isMobile ? "w-20 h-20" : "w-28 h-28"} bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-xl animate-spin-slow`}>
                <Star className={`${isMobile ? "w-10 h-10" : "w-14 h-14"} text-white`} />
              </div>
            </div>
            <h2 className={`${responsiveText.h2} font-bold text-yellow-800 mb-3`}>Your Piko Points</h2>
            <div className={`${responsiveText.points} font-extrabold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-3`}>
              {pikoPoints}
            </div>
            <p className={`${responsiveText.p} text-yellow-900 font-semibold`}>
              Keep learning to earn more points! 🌟
            </p>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-3 gap-8"} mb-8`}>
          <Card className="bg-gradient-to-r from-purple-200 to-pink-200 border-none shadow-xl hover:shadow-2xl transition-transform duration-300 hover:scale-105 rounded-2xl">
            <CardContent className={`${isMobile ? "p-4" : "p-8"} text-center`}>
              <Gift className={`${isMobile ? "w-12 h-12" : "w-20 h-20"} text-purple-700 mx-auto mb-3 animate-bounce`} />
              <div className={`${responsiveText.h2} font-extrabold text-purple-900 mb-2`}>{unlockedRewards}</div>
              <div className={`${responsiveText.p} text-purple-800 font-semibold`}>Rewards Unlocked 🎁</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-200 to-indigo-200 border-none shadow-xl hover:shadow-2xl transition-transform duration-300 hover:scale-105 rounded-2xl">
            <CardContent className={`${isMobile ? "p-4" : "p-8"} text-center`}>
              <Sparkles className={`${isMobile ? "w-12 h-12" : "w-20 h-20"} text-blue-700 mx-auto mb-3 animate-spin-slow`} />
              <div className={`${responsiveText.h2} font-extrabold text-blue-900 mb-2`}>{unlockedStickers}</div>
              <div className={`${responsiveText.p} text-blue-800 font-semibold`}>Stickers Collected ✨</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-200 to-emerald-200 border-none shadow-xl hover:shadow-2xl transition-transform duration-300 hover:scale-105 rounded-2xl">
            <CardContent className={`${isMobile ? "p-4" : "p-8"} text-center`}>
              <Trophy className={`${isMobile ? "w-12 h-12" : "w-20 h-20"} text-green-700 mx-auto mb-3 animate-pulse`} />
              <div className={`${responsiveText.h2} font-extrabold text-green-900 mb-2`}>3</div>
              <div className={`${responsiveText.p} text-green-800 font-semibold`}>Special Badges 🏆</div>
            </CardContent>
          </Card>
        </div>

        {/* Virtual Sticker Book */}
        <Card className={`mb-8 bg-gradient-to-r from-pink-200 to-purple-200 border-none shadow-xl ${isMobile ? "rounded-2xl" : "rounded-3xl"}`}>
          <CardHeader className={isMobile ? "px-4 pt-4 pb-2" : ""}>
            <CardTitle className={`flex items-center justify-center ${responsiveText.h2} font-bold text-pink-700`}>
              <Sparkles className={`${isMobile ? "w-6 h-6 mr-2" : "w-9 h-9 mr-3"}`} />📖 My Sticker Collection
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? "px-4 pb-4" : ""}>
            <div className={`grid ${isMobile ? "grid-cols-4 gap-2" : "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4"} mb-4`}>
              {stickerCollection.map((sticker) => (
                <div
                  key={sticker.id}
                  className={`aspect-square ${isMobile ? "rounded-xl" : "rounded-2xl"} flex items-center justify-center ${responsiveText.sticker} cursor-pointer select-none transition-transform duration-300 ${
                    sticker.unlocked
                      ? "bg-white shadow-lg hover:shadow-xl hover:scale-110 animate-pulse"
                      : "bg-gray-200 opacity-50 grayscale cursor-default"
                  }`}
                  onClick={() =>
                    sticker.unlocked && handleRewardClick({ ...sticker, emoji: sticker.emoji })
                  }
                  role={sticker.unlocked ? "button" : undefined}
                  aria-disabled={!sticker.unlocked}
                  tabIndex={sticker.unlocked ? 0 : -1}
                >
                  {sticker.unlocked ? sticker.emoji : "❓"}
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className={`${responsiveText.p} text-gray-700 mb-3`}>Collect stickers by completing missions! 🌟</p>
              <Progress
                value={(unlockedStickers / stickerCollection.length) * 100}
                className={`${isMobile ? "h-4" : "h-6"} max-w-md mx-auto rounded-full`}
                aria-label="Sticker collection progress"
              />
              <p className={`${isMobile ? "text-xs" : "text-sm"} text-gray-600 mt-1`}>
                {unlockedStickers}/{stickerCollection.length} stickers collected
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Unlockable Rewards */}
        <section className="mb-8">
          <h2 className={`${responsiveText.h1} font-extrabold text-gray-800 mb-6 text-center flex justify-center items-center gap-2`}>
            <Gift className={`${isMobile ? "w-7 h-7" : "w-9 h-9"} text-pink-600`} />🎁 Amazing Rewards to Unlock
            <Star className={`${isMobile ? "w-7 h-7" : "w-9 h-9"} text-yellow-500`} />
          </h2>

          <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}`}>
            {rewards.map((reward) => {
              const canUnlock = pikoPoints >= reward.cost && !reward.unlocked
              return (
                <Card
                  key={reward.id}
                  className={`cursor-pointer transition-transform duration-300 border-none overflow-hidden ${isMobile ? "rounded-2xl" : "rounded-3xl"} shadow-lg ${
                    reward.unlocked
                      ? "bg-gradient-to-br from-yellow-50 to-orange-50 shadow-xl hover:scale-105"
                      : canUnlock
                      ? "bg-gradient-to-br from-green-50 to-emerald-50 shadow-md hover:scale-105 ring-4 ring-green-300 animate-pulse"
                      : "bg-gray-100 opacity-70 cursor-not-allowed"
                  }`}
                  onClick={() => canUnlock && handleRewardClick(reward)}
                  role={canUnlock ? "button" : undefined}
                  aria-disabled={!canUnlock}
                  tabIndex={canUnlock ? 0 : -1}
                >
                  <CardContent className={`${isMobile ? "p-4" : "p-7"} text-center relative`}>
                    {/* Cost Badge */}
                    <div className={`absolute ${isMobile ? "top-2 right-2" : "top-4 right-4"}`}>
                      <Badge
                        className={`font-bold ${isMobile ? "text-xs px-2 py-1" : "text-sm px-4 py-2"} rounded-full ${
                          reward.unlocked
                            ? "bg-green-500 text-white"
                            : canUnlock
                            ? "bg-blue-500 text-white animate-pulse"
                            : "bg-gray-400 text-white"
                        }`}
                      >
                        {reward.unlocked ? "✅ Unlocked" : `${reward.cost} points`}
                      </Badge>
                    </div>

                    {/* Icon circle */}
                    <div
                      className={`${isMobile ? "w-16 h-16 mb-4" : "w-24 h-24 mb-6"} mx-auto rounded-full flex items-center justify-center relative shadow-xl ${
                        reward.unlocked
                          ? `bg-gradient-to-br ${reward.color} shadow-2xl`
                          : canUnlock
                          ? `bg-gradient-to-br ${reward.color} shadow-lg animate-pulse`
                          : "bg-gray-300 shadow-md"
                      }`}
                    >
                      <reward.icon
                        className={`${isMobile ? "w-8 h-8" : "w-12 h-12"} ${
                          reward.unlocked || canUnlock ? "text-white" : "text-gray-500"
                        }`}
                      />
                      {reward.unlocked && (
                        <div className={`absolute -top-3 -right-3 ${isMobile ? "w-8 h-8" : "w-10 h-10"} bg-green-500 rounded-full flex items-center justify-center animate-bounce shadow-lg`}>
                          <span className="text-white text-xl font-extrabold">✓</span>
                        </div>
                      )}
                    </div>

                    {/* Reward text */}
                    <div className={`${responsiveText.rewardEmoji} mb-3`}>{reward.emoji}</div>
                    <h3
                      className={`${responsiveText.h3} font-extrabold mb-2 ${
                        reward.unlocked || canUnlock ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {reward.name}
                    </h3>
                    <p
                      className={`${isMobile ? "text-sm" : "text-md"} mb-4 ${
                        reward.unlocked || canUnlock ? "text-gray-700" : "text-gray-400"
                      }`}
                    >
                      {reward.description}
                    </p>

                    {/* Action Button */}
                    {reward.unlocked ? (
                      <Badge className={`bg-gradient-to-r from-green-500 to-emerald-500 text-white ${isMobile ? "px-3 py-2 text-sm" : "px-6 py-3"} font-bold rounded-full shadow-lg select-none`}>
                        ✨ Enjoy Your Reward! ✨
                      </Badge>
                    ) : canUnlock ? (
                      <Button className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full ${isMobile ? "px-4 py-2 text-sm" : "px-8 py-3"} font-bold animate-pulse shadow-lg`}>
                        🎉 Unlock Now!
                      </Button>
                    ) : (
                      <Badge className={`bg-gray-400 text-white ${isMobile ? "px-3 py-2 text-sm" : "px-6 py-3"} rounded-full select-none`}>
                        🔒 Keep Learning!
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Motivational Section */}
        <Card className={`bg-gradient-to-r from-blue-200 to-indigo-200 border-none shadow-xl ${isMobile ? "rounded-2xl" : "rounded-3xl"}`}>
          <CardContent className={`${isMobile ? "p-6" : "p-10"} text-center`}>
            <div className={`${isMobile ? "text-5xl" : "text-7xl"} mb-4 animate-pulse`}>🌟</div>
            <h3 className={`${responsiveText.h1} font-extrabold text-gray-900 mb-4`}>You're Doing Amazing!</h3>
            <p className={`${responsiveText.p} text-gray-800 mb-6 mx-auto ${isMobile ? "max-w-xs" : "max-w-xl"}`}>
              Every mission you complete brings you closer to incredible rewards! Keep exploring, keep
              learning, and keep being the wonderful little explorer you are! 🚀
            </p>
            <div className="flex justify-center space-x-2">
              {[...Array(isMobile ? 5 : 8)].map((_, i) => (
                <span
                  key={i}
                  className={`${isMobile ? "text-2xl" : "text-3xl"} animate-bounce`}
                  style={{ animationDelay: `${i * 0.12}s` }}
                  aria-hidden="true"
                >
                  ⭐
                </span>
              ))}
            </div>
            <div className={`mt-6 ${isMobile ? "px-2" : ""}`}>
              <Link href="/missions">
                <Button className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white ${isMobile ? "px-6 py-3 text-lg" : "px-10 py-4 text-2xl"} rounded-full font-extrabold shadow-xl hover:shadow-2xl transition-transform duration-300 transform hover:scale-110 w-full max-w-md`}>
                  <Zap className={`${isMobile ? "w-5 h-5 mr-2" : "w-6 h-6 mr-3"} inline-block`} /> 🚀 Continue Learning Adventure!
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  )
}