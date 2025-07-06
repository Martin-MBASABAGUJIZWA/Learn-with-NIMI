// components/UserProfilePage.tsx
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import Footer from "@/components/Footer";
import { Edit, Star, Trophy, Users, Book, Calendar, Award, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function UserProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [aboutText, setAboutText] = useState("");
  const { t } = useLanguage();

  // Mock user data
  const userData = {
    name: "Sophia",
    age: 5,
    level: 3,
    points: 1240,
    streak: 7,
    friends: 12,
    completedMissions: 24,
    badges: 5,
    avatar: "👧",
  };

  // Mock badges
  const badges = [
    { id: 1, name: t('beginner'), emoji: "🌟", description: t('badgeEarned') },
    { id: 2, name: t('explorer'), emoji: "🔍", description: t('badgeEarned') },
    { id: 3, name: t('adventurer'), emoji: "🏔️", description: t('badgeEarned') },
    { id: 4, name: t('master'), emoji: "🎓", description: t('badgeEarned') },
    { id: 5, name: t('superstar'), emoji: "⭐", description: t('badgeEarned') },
  ];

  // Mock activity
  const activities = [
    { id: 1, type: t('missionCompleted'), mission: t('natureArtist'), emoji: "🎨", time: "2 hours ago" },
    { id: 2, type: t('badgeEarned'), mission: t('master'), emoji: "🎓", time: "Yesterday" },
    { id: 3, type: t('friendAdded'), mission: "Emma", emoji: "👧", time: "2 days ago" },
    { id: 4, type: t('levelUp'), mission: t('adventurer'), emoji: "⬆️", time: "3 days ago" },
  ];

  const handleSave = () => {
    setIsEditing(false);
    // In a real app, you would save to backend here
    console.log("Profile saved");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <Header />

      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-10 text-blue-300 animate-bounce text-2xl" style={{ animationDelay: "0s" }}>
          🌟
        </div>
        <div className="absolute bottom-40 left-10 text-purple-300 animate-bounce text-2xl" style={{ animationDelay: "1s" }}>
          ✨
        </div>
        <div className="absolute top-1/3 left-20 text-yellow-300 animate-bounce text-2xl" style={{ animationDelay: "2s" }}>
          🏆
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="text-8xl mb-4">{userData.avatar}</div>
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute bottom-2 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-all"
            >
              <Edit className="w-5 h-5 text-purple-600" />
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{userData.name}, {userData.age}</h1>
          <div className="flex justify-center items-center gap-2">
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              {t('level')} {userData.level}
            </Badge>
            <div className="text-yellow-500 flex items-center">
              <Star className="w-5 h-5 fill-yellow-400" />
              <span className="ml-1 font-bold">{userData.points}</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <Card className="mb-8 bg-gradient-to-r from-blue-100 to-purple-100 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl">
              <Trophy className="w-6 h-6 mr-2 text-purple-600" /> 
              {t('achievements')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-purple-600">{userData.completedMissions}</div>
                <p className="text-sm text-gray-600">{t('completedMissions')}</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{userData.streak}</div>
                <p className="text-sm text-gray-600">{t('dailyStreak')}</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{userData.badges}</div>
                <p className="text-sm text-gray-600">{t('badges')}</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{userData.friends}</div>
                <p className="text-sm text-gray-600">{t('friends')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Me Section */}
        <Card className="mb-8 bg-white border-none shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center text-xl">
                <Book className="w-6 h-6 mr-2 text-blue-500" /> 
                {t('aboutMe')}
              </CardTitle>
              {!isEditing && (
                <Button variant="ghost" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-1" /> {t('editProfile')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div>
                <textarea
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  placeholder={t('aboutMe')}
                  className="w-full p-4 border border-gray-300 rounded-lg mb-4 min-h-[100px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    {t('saveChanges')}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700">
                {aboutText || t('aboutMePlaceholder', { name: userData.name })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card className="mb-8 bg-white border-none shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center text-xl">
                <Award className="w-6 h-6 mr-2 text-yellow-500" /> 
                {t('myBadges')}
              </CardTitle>
              <Button variant="ghost">
                {t('viewAll')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {badges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {badges.map((badge) => (
                  <div key={badge.id} className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-sm">
                    <div className="text-4xl mb-2">{badge.emoji}</div>
                    <h3 className="font-bold text-gray-800">{badge.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">{t('noBadges')}</p>
            )}
          </CardContent>
        </Card>

        {/* Activity Section */}
        <Card className="bg-white border-none shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center text-xl">
                <Calendar className="w-6 h-6 mr-2 text-green-500" /> 
                {t('recentActivity')}
              </CardTitle>
              <Button variant="ghost">
                {t('viewAll')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start p-3 hover:bg-gray-50 rounded-lg">
                    <div className="text-2xl mr-3">{activity.emoji}</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{activity.type}</h3>
                      <p className="text-sm text-gray-600">{activity.mission}</p>
                    </div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">{t('noActivity')}</p>
            )}
          </CardContent>
        </Card>

        {/* Progress Section */}
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl">
              <Book className="w-6 h-6 mr-2 text-green-600" /> 
              {t('learningJourney')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {t('currentLevel')}: {t('explorer')}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {t('nextLevel')}: {t('adventurer')}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full" 
                    style={{ width: '65%' }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-600">Level 3</span>
                  <span className="text-xs text-gray-600">Level 4</span>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">65%</div>
                  <p className="text-sm text-gray-600">{t('progressToNextLevel')}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">7/10</div>
                  <p className="text-sm text-gray-600">{t('missionsToLevelUp')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
}