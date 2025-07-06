"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/Header"
import BottomNavigation from "@/components/BottomNavigation"
import Footer from "@/components/Footer"
import { MessageCircle, Heart, Star, Upload, Camera, Mic, Crown, Sparkles, Trophy,   Send } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

export default function CommunityPage() {
  const [selectedCreation, setSelectedCreation] = useState(null)
   const { t, language } = useLanguage()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [chatMessages, setChatMessages] = useState([
  { role: "assistant", content: t("nimiWelcome") } // starting message
])
const [input, setInput] = useState("")
const [isLoading, setIsLoading] = useState(false)

const childName = "Emma" // Make this dynamic later from context or props

const handleAskNimi = async () => {
  if (!input.trim()) return
  const newUserMessage = { role: "user", content: input }
  const updatedMessages = [...chatMessages, newUserMessage]

  setChatMessages(updatedMessages)
  setIsLoading(true)
  setInput("")

  try {
    const res = await fetch("/api/nimi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: input,
        childName: "Piko", // Or from user profile
        language: "en" // Or from your LanguageContext
      })
    })

    const data = await res.json()
    const newAssistantMessage = {
      role: "assistant",
      content: data.answer || t("nimiDefaultResponse"),
    }

    setChatMessages((prev) => [...prev, newAssistantMessage])
  } catch (err) {
    setChatMessages((prev) => [
      ...prev,
      { role: "assistant", content: t("nimiErrorResponse") },
    ])
  } finally {
    setIsLoading(false)
  }
}

  const handleAskEnter = (e) => {
    if (e.key === "Enter") handleAskNimi()
  }

  // Mock data for community creations
  const pikoCreations = [
    {
      id: 1,
      childName: "Emma",
      age: 4,
      creation: t('creation1'),
      type: t('art'),
      likes: 12,
      image: "/placeholder.svg?height=200&width=200",
      mission: t('natureArtist'),
      emoji: "🎨",
    },
    {
      id: 2,
      childName: "Liam",
      age: 5,
      creation: t('creation2'),
      type: t('movement'),
      likes: 8,
      image: "/placeholder.svg?height=200&width=200",
      mission: t('animalWakeUp'),
      emoji: "🦁",
    },
    {
      id: 3,
      childName: "Zara",
      age: 3,
      creation: t('creation3'),
      type: t('expression'),
      likes: 15,
      image: "/placeholder.svg?height=200&width=200",
      mission: t('welcomeSong'),
      emoji: "😊",
    },
    {
      id: 4,
      childName: "Noah",
      age: 4,
      creation: t('creation4'),
      type: t('music'),
      likes: 6,
      image: "/placeholder.svg?height=200&width=200",
      mission: t('soundGarden'),
      emoji: "🎵",
    },
  ]

  // Mock data for Piko Pals Hall of Fame
  const pikoPals = [
    {
      name: "Sofia",
      age: 5,
      achievements: 12,
      streak: 7,
      avatar: "👑",
      title: t('missionMaster'),
    },
    {
      name: "Alex",
      age: 4,
      achievements: 10,
      streak: 5,
      avatar: "⭐",
      title: t('creativeStar'),
    },
    {
      name: "Maya",
      age: 3,
      achievements: 8,
      streak: 4,
      avatar: "🌟",
      title: t('littleExplorer'),
    },
  ]

  const handleLoveCreation = (creationId) => {
    console.log(`Loved creation ${creationId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Header />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 text-pink-300 animate-bounce text-2xl" style={{ animationDelay: "0s" }}>
          💖
        </div>
        <div
          className="absolute top-40 right-20 text-blue-300 animate-bounce text-2xl"
          style={{ animationDelay: "1s" }}
        >
          🌟
        </div>
        <div
          className="absolute bottom-40 left-20 text-green-300 animate-bounce text-2xl"
          style={{ animationDelay: "2s" }}
        >
          🎈
        </div>
        <div
          className="absolute bottom-20 right-10 text-yellow-300 animate-bounce text-2xl"
          style={{ animationDelay: "0.5s" }}
        >
          ✨
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            {t('pikoCommunity')}
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            {t('shareCelebrate')}
          </p>
        </div>

        <Card className="mb-8 bg-gradient-to-r from-pink-100 to-purple-100 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <Upload className="w-8 h-8 mr-3 text-pink-600" />📸 {t('shareCreationTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-gray-700 mb-6">{t('shareCreationDescription')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
              >
                <Camera className="w-6 h-6 mr-3" />📷 {t('uploadPhoto')}
              </Button>
              <Button
                variant="outline"
                className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 px-8 py-4 rounded-full text-lg font-semibold bg-white/80"
              >
                <Mic className="w-6 h-6 mr-3" />🎤 {t('recordStory')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
            <Sparkles className="w-8 h-8 mr-3 text-pink-500" />🎨 {t('creationsGallery')}
            <Heart className="w-8 h-8 ml-3 text-red-500" />
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pikoCreations.map((creation) => (
              <Card
                key={creation.id}
                className="bg-white border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden cursor-pointer"
                onClick={() => setSelectedCreation(creation)}
              >
                <div className="relative">
                  <img
                    src={creation.image || "/placeholder.svg"}
                    alt={creation.creation}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 text-3xl">{creation.emoji}</div>
                  <div className="absolute bottom-2 left-2">
                    <Badge className="bg-white/90 text-gray-800 font-semibold">{creation.type}</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-gray-800 mb-2">{creation.creation}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {t('byChildAge', { childName: creation.childName, age: creation.age })}
                  </p>
                  <p className="text-xs text-purple-600 mb-3">{t('fromMission', { mission: creation.mission })}</p>
                  <div className="flex items-center justify-between">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLoveCreation(creation.id)
                      }}
                      className="bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white rounded-full px-4 py-2"
                    >
                      <Heart className="w-4 h-4 mr-1" />
                      {creation.likes}
                    </Button>
                    <span className="text-xs text-gray-500">{t('tapToView')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="mb-8 bg-gradient-to-r from-yellow-100 to-orange-100 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <Crown className="w-8 h-8 mr-3 text-yellow-600" />👑 {t('hallOfFame')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pikoPals.map((pal, index) => (
                <div
                  key={index}
                  className="text-center p-6 bg-white/80 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="text-6xl mb-4">{pal.avatar}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{pal.name}</h3>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-3">{pal.title}</Badge>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-center">
                      <Trophy className="w-4 h-4 mr-2 text-yellow-600" />
                      <span>{pal.achievements} {t('achievements')}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Star className="w-4 h-4 mr-2 text-orange-600" />
                      <span>{pal.streak} {t('dayStreak')}</span>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-1 mt-3">
                    {[...Array(3)].map((_, i) => (
                      <span
                        key={i}
                        className="text-yellow-400 animate-bounce text-lg"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      >
                        ✨
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      
    <Card className="mb-8 bg-gradient-to-r from-blue-100 to-indigo-100 border-none shadow-xl">
  <CardHeader>
    <CardTitle className="flex items-center justify-center text-2xl">
      <MessageCircle className="w-8 h-8 mr-3 text-blue-600" />🤖 {t("askNimiAnything")}
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4 max-w-md mx-auto">
      <div className="bg-white/90 rounded-xl p-4 shadow-lg h-72 overflow-y-auto">
        {chatMessages.map((msg, index) => (
          <div key={index} className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}>
            <div className={`inline-block px-4 py-2 rounded-lg ${msg.role === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-800"}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center bg-white/80 rounded-full p-3 shadow-md">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAskNimi()}
          placeholder={t("askPlaceholder")}
          className="flex-1 bg-transparent outline-none placeholder-gray-500 text-gray-800"
        />
        <Button
          onClick={handleAskNimi}
          disabled={isLoading}
          className="ml-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full px-4 py-2"
        >
          {isLoading ? "..." : <Send className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  </CardContent>
</Card>


        <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-none shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('comingSoon')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="text-center">
                <div className="text-4xl mb-2">🎮</div>
                <h4 className="font-bold text-gray-800">{t('learningGames')}</h4>
                <p className="text-sm text-gray-600">{t('playWithFriends')}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">📹</div>
                <h4 className="font-bold text-gray-800">{t('videoCalls')}</h4>
                <p className="text-sm text-gray-600">{t('learnWithNimi')}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🏆</div>
                <h4 className="font-bold text-gray-800">{t('groupChallenges')}</h4>
                <p className="text-sm text-gray-600">{t('teamAdventures')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-center">{t('shareCreation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t('uploadPrompt')}</p>
              </div>
              <input
                type="text"
                placeholder={t('creationDescription')}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              <div className="flex space-x-3">
                <Button onClick={() => setShowUploadModal(false)} variant="outline" className="flex-1">
                  {t('cancel')}
                </Button>
                <Button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                >
                  {t('shareButton')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Footer />
      <BottomNavigation />
    </div>
  )
}