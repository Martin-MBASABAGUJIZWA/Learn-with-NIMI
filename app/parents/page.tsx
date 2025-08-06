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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  Plus,
  Settings,
} from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";

type Language = "en" | "sw" | "fr";
type Activity = {
  name: string;
  completed: boolean;
};
type ChildProfile = {
  id: string;
  name: string;
  age: string;
  avatar: string;
  screenTimeLimit: number;
  bedtimeMode: boolean;
  contentLock: boolean;
  activities: Activity[];
};

export default function ParentPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [voiceOn, setVoiceOn] = useState(true);
  const [currentChildId, setCurrentChildId] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");

  // Initialize with sample data if empty
  useEffect(() => {
    if (children.length === 0) {
      const sampleChild: ChildProfile = {
        id: "1",
        name: "Nimi",
        age: "2-4 years",
        avatar: "/toddler-avatar.png",
        screenTimeLimit: 30,
        bedtimeMode: true,
        contentLock: true,
        activities: [
          { name: "ABCs", completed: true },
          { name: "Counting", completed: true },
          { name: "Shapes", completed: false },
        ],
      };
      setChildren([sampleChild]);
      setCurrentChildId("1");
    }
  }, []);

  const currentChild = children.find(child => child.id === currentChildId) || children[0];

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && voiceOn) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang =
        language === "sw" ? "sw-TZ" : language === "fr" ? "fr-FR" : "en-US";
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (currentChild) {
      const intro =
        language === "sw"
          ? `Karibu kwenye ukurasa wa mzazi wa ${currentChild.name}. Hapa unaweza kufuatilia maendeleo yake.`
          : language === "fr"
          ? `Bienvenue sur la page parentale de ${currentChild.name}. Vous pouvez suivre ses progrès ici.`
          : `Welcome to ${currentChild.name}'s Parent Zone. Here you can track their progress and adjust settings.`;
      speak(intro);
    }
  }, [voiceOn, language, currentChildId]);

  const updateChildSetting = (id: string, setting: Partial<ChildProfile>) => {
    setChildren(prev =>
      prev.map(child =>
        child.id === id ? { ...child, ...setting } : child
      )
    );
  };

  const addNewChild = () => {
    if (newChildName.trim()) {
      const newChild: ChildProfile = {
        id: Date.now().toString(),
        name: newChildName,
        age: "2-4 years",
        avatar: "",
        screenTimeLimit: 30,
        bedtimeMode: true,
        contentLock: true,
        activities: [
          { name: "ABCs", completed: false },
          { name: "Counting", completed: false },
          { name: "Shapes", completed: false },
        ],
      };
      setChildren([...children, newChild]);
      setCurrentChildId(newChild.id);
      setNewChildName("");
      setIsAddingChild(false);
    }
  };

  const completedCount = currentChild?.activities.filter(a => a.completed).length || 0;
  const totalActivities = currentChild?.activities.length || 1;
  const progressPercent = (completedCount / totalActivities) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-blue-50">
      <Header />

      <main className="flex-grow w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6 relative">
        {/* Settings and Voice Toggle */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(prev => (prev === "en" ? "sw" : prev === "sw" ? "fr" : "en"))}
            className="text-blue-500"
            aria-label="Change language"
          >
            <span className="text-sm font-medium">{language.toUpperCase()}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVoiceOn(prev => !prev)}
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

        {/* Header */}
        <div className="text-center pt-2 md:pt-4">
          <div className="flex justify-center items-center gap-3">
            <Baby className="text-pink-500 h-8 w-8" />
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600">
              {currentChild?.name || "Child"}'s Learning Platform
            </h1>
          </div>
          <p className="text-blue-400 mt-1 text-sm">
            For parents of curious 2-4 year olds
          </p>
        </div>

        {/* Child Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {children.map(child => (
            <Button
              key={child.id}
              variant={currentChildId === child.id ? "default" : "outline"}
              onClick={() => setCurrentChildId(child.id)}
              className="flex items-center gap-2 min-w-fit"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={child.avatar} />
                <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {child.name}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => setIsAddingChild(true)}
            className="flex items-center gap-2 min-w-fit"
          >
            <Plus className="h-4 w-4" />
            Add Child
          </Button>
        </div>

        {isAddingChild && (
          <Card className="bg-white border-2 border-blue-200">
            <CardHeader>
              <CardTitle>Add New Child</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="childName" className="block text-sm font-medium">
                  Child's Name
                </label>
                <input
                  id="childName"
                  type="text"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter child's name"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addNewChild}>Save</Button>
                <Button variant="outline" onClick={() => setIsAddingChild(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid Layout for Cards */}
        {!isAddingChild && currentChild && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {/* Child Profile */}
            <Card className="bg-white border-2 border-blue-200">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={currentChild.avatar} alt={`${currentChild.name}'s avatar`} />
                    <AvatarFallback>{currentChild.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{currentChild.name}</CardTitle>
                    <p className="text-blue-500 flex items-center gap-1 text-sm">
                      <CalendarCheck className="h-4 w-4" />
                      <span>{currentChild.age}</span>
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
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
                          ? `Leo, ${currentChild.name} amekamilisha kazi ${completedCount} kati ya ${totalActivities}.`
                          : language === "fr"
                          ? `Aujourd'hui, ${currentChild.name} a terminé ${completedCount} activités sur ${totalActivities}.`
                          : `Today, ${currentChild.name} completed ${completedCount} out of ${totalActivities} activities.`
                      )
                    }
                    aria-label="Read today's progress"
                  >
                    <Volume2 className="w-4 h-4 text-yellow-600" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentChild.activities.map((item, i) => (
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
                  {completedCount} of {totalActivities} activities completed!
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
                    <span className="font-bold text-pink-600">
                      {currentChild.screenTimeLimit} min
                    </span>
                  </div>
                  <Slider
                    value={[currentChild.screenTimeLimit]}
                    max={60}
                    step={5}
                    onValueChange={([val]) =>
                      updateChildSetting(currentChild.id, { screenTimeLimit: val })
                    }
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
                    checked={currentChild.bedtimeMode}
                    onCheckedChange={(val) =>
                      updateChildSetting(currentChild.id, { bedtimeMode: val })
                    }
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
                    checked={currentChild.contentLock}
                    onCheckedChange={(val) =>
                      updateChildSetting(currentChild.id, { contentLock: val })
                    }
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
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Designed with ❤️ for early learning journeys
        </p>
      </main>

      <BottomNavigation />
    </div>
  );
}