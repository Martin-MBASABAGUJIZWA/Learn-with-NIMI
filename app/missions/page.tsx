"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Header from "@/components/Header"
import BottomNavigation from "@/components/BottomNavigation"
import Footer from "@/components/Footer"
import {
  ArrowLeft, Calendar, Clock, Star, Play, CheckCircle, Trophy, Sparkles
} from "lucide-react"
import supabase from "@/lib/supabaseClient"
import { useLanguage } from '@/contexts/LanguageContext';

const studentId = "demo_student_123"

export default function MissionsPage() {
  const { t } = useLanguage();
  
  // States
  const [missionProgram, setMissionProgram] = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState(1)
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set())
  const [showCelebration, setShowCelebration] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openVideo, setOpenVideo] = useState<string | null>(null)
  const [studentName, setStudentName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [streak, setStreak] = useState<number>(0)

  // Calculate current day data at top level
  const currentDayData = missionProgram.find(d => d.day === selectedDay);
  const totalMissions = currentDayData?.missions?.length || 0;
  const completedCount = currentDayData
    ? currentDayData.missions.filter(m => completedMissions.has(m.id)).length
    : 0;

  // Time-based greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('morningGreeting') || "🌞 Good Morning"
    if (hour < 18) return t('afternoonGreeting') || "🌤️ Good Afternoon"
    return t('eveningGreeting') || "🌙 Good Evening"
  }

  // Motivational messages
  const motivationalMessages = [
    t('motivationalMessage1') || "💡 You’re a learning legend!",
    t('motivationalMessage2') || "🚀 Keep soaring, superstar!",
    t('motivationalMessage3') || "🌈 Shine bright, explorer!",
    t('motivationalMessage4') || "🏅 You're doing great, Nimi!"
  ]

  const getCurrentDayNumber = () => {
    const programStart = new Date("2025-07-01")
    const today = new Date()
    const diff = Math.floor((today.getTime() - programStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, Math.min(diff, 8))
  }

  // Fetch missions once
  useEffect(() => {
    const fetchMissions = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("daily_missions")
        .select("*")
        .order("day_number", { ascending: true })

      if (error) {
        console.error(error)
        setError("Failed to load missions.")
        setLoading(false)
        return
      }

      const grouped = data.reduce((acc, mission) => {
        const d = mission.day_number
        if (!acc[d]) {
          acc[d] = {
            day: d,
            date: `Day ${d}`,
            title: `NIMI's Day ${d} Missions`,
            theme: mission.theme || "Learning & Fun",
            emoji: mission.emoji || "🌟",
            missions: []
          }
        }
        acc[d].missions.push({
          ...mission,
          id: mission.id,
          videoUrl: mission.video_url || ""
        })
        return acc
      }, {} as Record<number, any>)

      setMissionProgram(Object.values(grouped).sort((a, b) => a.day - b.day))
      setLoading(false)
    }
    fetchMissions()
  }, [])

  // Persist selectedDay from localStorage
  useEffect(() => {
    const d = localStorage.getItem("selectedDay")
    if (d) setSelectedDay(Number(d))
  }, [])
  useEffect(() => {
    localStorage.setItem("selectedDay", String(selectedDay))
  }, [selectedDay])

  // Parallel fetch profile and completions
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [studentRes, completionsRes] = await Promise.all([
          supabase
            .from("students")
            .select("full_name, avatar_url")
            .eq("id", studentId)
            .single(),
          supabase
            .from("mission_completions")
            .select("mission_id, inserted_at")
            .eq("student_id", studentId)
        ])

        const student = studentRes.data
        if (student) {
          setStudentName(student.full_name)
          setAvatarUrl(student.avatar_url)
        }

        const completions = completionsRes.data
        if (completions) {
          setCompletedMissions(new Set(completions.map(c => c.mission_id)))
          const uniqueDays = new Set(completions.map(c => new Date(c.inserted_at).toDateString()))
          setStreak(uniqueDays.size)
        }
      } catch (err) {
        console.error("Error fetching student data and completions:", err)
      }
    }
    if (studentId) fetchAll()
  }, [studentId])

  const markVideoWatched = async (missionId: string) => {
    if (!studentId) return
    await supabase.from("video_views").insert({ student_id: studentId, mission_id: missionId })
  }

  const completeMission = async (missionId: string, pikoVictory: string) => {
    if (!studentId) {
      alert(t('loginPrompt') || "Please log in!")
      return
    }
    if (completedMissions.has(missionId)) return

    setCompletedMissions(prev => new Set([...prev, missionId]))
    setShowCelebration(true)
    if (typeof window !== "undefined") {
      const alertElement = document.createElement("div")
      alertElement.innerText = t('missionCompletedAlert') || "✅ Mission marked as completed!"
      alertElement.className = "fixed top-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse"
      document.body.appendChild(alertElement)
      setTimeout(() => alertElement.remove(), 3000)
    }
    setTimeout(() => setShowCelebration(false), 3000)

    await supabase.from("mission_completions").insert({
      student_id: studentId,
      mission_id: missionId,
      piko_victory: pikoVictory,
      stars: 1
    })
  }

  const isMissionLocked = (m: { day_number: number }) => {
    return m.day_number > getCurrentDayNumber()
  }

  // Loading skeleton UI
  if (loading) return (
    <div className="p-10 space-y-4">
      <div className="animate-pulse h-12 bg-gray-200 rounded-md w-1/2 mx-auto"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse h-40 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    </div>
  )
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Header />

      {/* 🎯 Enhanced Personalized Greeting */}
      <div className="text-center mt-8 space-y-2">
        <div className="flex justify-center items-center gap-4 mb-2">
          {avatarUrl && (
            <img src={avatarUrl} alt="Avatar"
              className="w-16 h-16 rounded-full border-4 border-purple-300 shadow-lg" />
          )}
          <h2 className="text-3xl font-bold">{getTimeGreeting()}, {studentName || t('explorer') || "Explorer"}!</h2>
        </div>
        <p className="text-lg text-purple-600 font-medium">
          {t('streakMessage', { streak }) || `🔥 You're on a ${streak}-day streak!`}
        </p>
        <p className="text-sm italic text-purple-500">
          {motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]}
        </p>
      </div>

      {/* ✅ Video Modal */}
      {openVideo && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 max-w-lg w-full relative">
            <button onClick={() => setOpenVideo(null)}
              className="text-gray-600 text-xl font-bold absolute top-4 right-4">✖</button>
            <iframe
              src={openVideo} width="100%" height="315" allowFullScreen
              onLoad={() => {
                const match = missionProgram.flatMap(d => d.missions).find(m => m.videoUrl === openVideo)
                if (match) markVideoWatched(match.id)
              }} />
          </div>
        </div>
      )}

      {/* 🎉 Celebration Popup */}
      {showCelebration && (
        <div className="fixed top-20 right-6 bg-white px-6 py-4 rounded-xl shadow-lg border-2 border-yellow-400 text-yellow-700 font-bold animate-bounce z-50">
          {t('celebrationMessage') || "🎉 Great job! Piko Victory unlocked!"}
        </div>
      )}

      {/* Floating Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 animate-bounce text-2xl text-yellow-400">🌟</div>
        <div className="absolute top-40 right-20 animate-bounce text-2xl text-pink-400" style={{ animationDelay: "1s" }}>🎈</div>
        <div className="absolute bottom-40 left-20 animate-bounce text-2xl text-blue-400" style={{ animationDelay: "2s" }}>✨</div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ✅ Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 bg-white/80 rounded-full px-6 py-3 font-semibold shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />← {t('backButton') || "Back"}
          </Button>
        </div>

        {/* ✅ Progress Overview */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            🎯 {t('liveMissions') || "NIMI's Live Missions"}
          </h1>
          <p className="text-xl text-gray-700 mb-6">{t('learningAdventure') || "Your amazing learning adventure! 🌈"}</p>

          <Card className="bg-gradient-to-r from-yellow-100 to-orange-100 border-none shadow-xl max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-yellow-600 mr-3 animate-bounce" />
                <span className="text-xl font-bold text-gray-800">{t('todaysProgress') || "Today's Progress"}</span>
                <Sparkles className="w-8 h-8 text-pink-500 ml-3 animate-spin" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold text-gray-700">{t('completed') || "Completed"}</span>
                <span className="text-lg font-bold text-orange-600">{completedCount}/{totalMissions} 🎉</span>
              </div>
              <Progress value={(completedCount / (totalMissions || 1)) * 100} className="h-4 bg-white/50" />
              <p className="text-center mt-4 text-lg text-gray-700 font-medium">
                {t('encouragementMessage') || "You're doing amazing! Keep going, little explorer! 🌟"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ✅ Day Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {t('chooseAdventureDay') || "🗓️ Choose Your Adventure Day"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {missionProgram.map((day) => (
              <Button
                key={day.day}
                variant={selectedDay === day.day ? "default" : "outline"}
                className={`h-20 flex flex-col ${selectedDay === day.day ? "bg-gradient-to-br from-orange-500 to-pink-500 text-white" : "border-2 border-gray-300 text-gray-700"}`}
                onClick={() => setSelectedDay(day.day)}
              >
                <div className="text-2xl mb-1">{day.emoji}</div>
                <Calendar className="w-4 h-4 mb-1" />
                <span className="text-xs font-bold">{t('dayNumber', { day: day.day }) || `Day ${day.day}`}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* ✅ Current Day Missions */}
        {currentDayData && (
          <div className="space-y-8">
            <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-none shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">{currentDayData.emoji}</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{currentDayData.title}</h2>
                <p className="text-xl text-gray-700 mb-2">{t('dayNumber', { day: currentDayData.day }) || `Day ${currentDayData.day}`}</p>
                <Badge variant="outline" className="border-2 border-purple-300 text-purple-700 bg-white/80 px-4 py-2 text-lg font-semibold">
                  🎨 {currentDayData.theme}
                </Badge>
              </CardContent>
            </Card>

            {/* ✅ Missions Cards */}
            {currentDayData.missions.map((mission) => (
              <Card key={mission.id} className={`transition-all duration-300 ${completedMissions.has(mission.id) ? "bg-gradient-to-r from-green-100 to-emerald-100" : "bg-white shadow-lg"}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-pink-500">
                      {completedMissions.has(mission.id)
                        ? <CheckCircle className="w-8 h-8 text-white" />
                        : <Star className="w-8 h-8 text-white" />}
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-800 mb-2">{mission.title}</CardTitle>
                      <div className="flex items-center space-x-4">
                        <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-3 py-1">
                          ⏰ {mission.time}
                        </Badge>
                        <Badge variant="outline" className="border-purple-300 text-purple-700 px-3 py-1">
                          🎯 {mission.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Video Guide */}
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-xl border-2 border-purple-200 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
                        <Play className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-purple-800 mb-2">
                      {t('nimisVideoGuide') || "🎬 NIMI's Video Guide"}
                    </h4>
                    <p className="text-purple-700 mb-4">
                      {t('videoGuideDescription') || "Watch NIMI explain this mission with fun animations!"}
                    </p>
                    <Button
                      onClick={() => mission.videoUrl
                        ? setOpenVideo(mission.videoUrl)
                        : alert(t('noVideoAvailable') || "No video available for this mission.")
                      }
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-bold"
                    >
                      {t('playNimisGuide') || "▶️ Play NIMI's Guide"}
                    </Button>
                  </div>

                  {/* Activity Description */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-3 text-lg">
                      {t('whatYoullDo') || "🎯 What You'll Do:"}
                    </h4>
                    <p className="text-blue-700 text-lg">{mission.activity}</p>
                  </div>

                  {/* Piko Victory Goal */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-200">
                    <h4 className="font-bold text-yellow-800 mb-3 text-lg">
                      {t('pikoVictoryGoal') || "🏆 Piko Victory Goal:"}
                    </h4>
                    <p className="text-yellow-700 text-lg">{mission.pikoVictory}</p>
                  </div>

                  {/* Fun Fact */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                    <h4 className="font-bold text-green-800 mb-3 text-lg">
                      {t('funFact') || "🤓 Fun Fact:"}
                    </h4>
                    <p className="text-green-700 text-lg">{mission.funFact}</p>
                  </div>

                  {/* Learning Objectives */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 text-lg">
                      {t('whatYoullLearn') || "📚 What You'll Learn:"}
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {mission.learningObjectives && mission.learningObjectives.map((obj: string, i: number) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Completion Button */}
                  <div className="text-center">
                    <Button
                      disabled={completedMissions.has(mission.id) || isMissionLocked(mission)}
                      onClick={() => completeMission(mission.id, mission.pikoVictory)}
                      className={`w-full py-4 text-lg font-bold rounded-full shadow-md
                        ${completedMissions.has(mission.id) ? "bg-green-500 text-white cursor-default" :
                          isMissionLocked(mission) ? "bg-gray-400 text-gray-700 cursor-not-allowed" :
                            "bg-pink-500 text-white hover:bg-pink-600"}`}
                      aria-label={completedMissions.has(mission.id) ? t('completed') : t('completeMission')}
                    >
                      {completedMissions.has(mission.id) 
                        ? `✅ ${t('missionCompleted') || "Completed!"}` 
                        : isMissionLocked(mission) 
                          ? t('locked') || "🔒 Locked" 
                          : t('completeMission') || "Complete Mission"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </main>

      <BottomNavigation />
      <Footer />
    </div>
  )
}