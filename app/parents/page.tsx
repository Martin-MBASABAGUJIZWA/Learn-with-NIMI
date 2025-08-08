"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
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
  Loader2,
} from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";

type Language = "en" | "sw" | "fr";
type Activity = {
  id: string;
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

// Custom hook for child management
const useChildManagement = () => {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage or API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Try to fetch from API first
        const response = await fetch('/api/children');
        if (response.ok) {
          const data = await response.json();
          setChildren(data);
          localStorage.setItem('childrenData', JSON.stringify(data));
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('childrenData');
          if (saved) setChildren(JSON.parse(saved));
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const updateChild = async (id: string, updates: Partial<ChildProfile>) => {
    try {
      const updatedChildren = children.map(child => 
        child.id === id ? { ...child, ...updates } : child
      );
      setChildren(updatedChildren);
      
      // Save to localStorage immediately
      localStorage.setItem('childrenData', JSON.stringify(updatedChildren));
      
      // Sync with backend
      await fetch('/api/children', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedChildren.find(c => c.id === id))
      });
    } catch (err) {
      console.error('Update failed', err);
      // TODO: Add to offline queue for retry
    }
  };

  const addChild = async (name: string) => {
    const newChild: ChildProfile = {
      id: Date.now().toString(),
      name,
      age: "2-4 years",
      avatar: "",
      screenTimeLimit: 30,
      bedtimeMode: true,
      contentLock: true,
      activities: [
        { id: '1', name: "ABCs", completed: false },
        { id: '2', name: "Counting", completed: false },
        { id: '3', name: "Shapes", completed: false },
      ],
    };

    try {
      setChildren(prev => [...prev, newChild]);
      localStorage.setItem('childrenData', JSON.stringify([...children, newChild]));
      
      await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChild)
      });
      
      return newChild.id;
    } catch (err) {
      console.error('Add failed', err);
      // TODO: Add to offline queue for retry
      return null;
    }
  };

  return { children, isLoading, error, updateChild, addChild };
};

// Speech synthesis queue
const useSpeech = () => {
  const speechQueue = useRef<SpeechSynthesisUtterance[]>([]);
  const isSpeaking = useRef(false);

  const processQueue = useCallback(() => {
    if (speechQueue.current.length === 0) {
      isSpeaking.current = false;
      return;
    }
    
    isSpeaking.current = true;
    const next = speechQueue.current.shift()!;
    next.onend = processQueue;
    window.speechSynthesis.speak(next);
  }, []);

  const speak = useCallback((text: string, lang: Language = 'en') => {
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "sw" ? "sw-TZ" : lang === "fr" ? "fr-FR" : "en-US";
    
    speechQueue.current.push(utterance);
    
    if (!isSpeaking.current) {
      processQueue();
    }
  }, [processQueue]);

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    speechQueue.current = [];
    isSpeaking.current = false;
  }, []);

  return { speak, cancelSpeech };
};

const ChildCard = React.memo(({ 
  child, 
  isActive,
  onClick,
  onSpeak
}: { 
  child: ChildProfile;
  isActive: boolean;
  onClick: () => void;
  onSpeak: () => void;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className={`flex items-center gap-2 min-w-fit rounded-md border ${
      isActive 
        ? 'bg-primary text-primary-foreground' 
        : 'bg-background hover:bg-accent hover:text-accent-foreground'
    }`}>
      <div 
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 flex-1 cursor-pointer"
      >
        <Avatar className="h-6 w-6">
          <AvatarImage src={child.avatar} />
          <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
        </Avatar>
        {child.name}
      </div>
      
      {/* Replace inner Button with a div + onClick */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onSpeak();
        }}
        className="p-2 hover:bg-accent rounded cursor-pointer"
        aria-label="Hear child info"
      >
        <Volume2 className="h-3 w-3" />
      </div>
    </div>
  </motion.div>
));

const ActivityItem = React.memo(({ activity }: { activity: Activity }) => (
  <div className="flex items-center gap-3">
    <div
      className={`h-3 w-3 rounded-full ${
        activity.completed ? "bg-green-500" : "bg-gray-300"
      }`}
    />
    <span className={activity.completed ? "font-medium" : "text-gray-500"}>
      {activity.name}
    </span>
  </div>
));

export default function ParentPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [voiceOn, setVoiceOn] = useState(true);
  const [currentChildId, setCurrentChildId] = useState<string | null>(null);
  const [isAddingChild, setIsAddingChild] = useState(false);
  
  const { children, isLoading, error, updateChild, addChild } = useChildManagement();
  const { speak, cancelSpeech } = useSpeech();

  const currentChild = children.find(child => child.id === currentChildId) || children[0];

  // Set first child as current when data loads
  useEffect(() => {
    if (!currentChildId && children.length > 0) {
      setCurrentChildId(children[0].id);
    }
  }, [children, currentChildId]);

  // Initialize speech for current child
  useEffect(() => {
    if (!currentChild || !voiceOn) return;
    
    cancelSpeech();
    
    const intro =
      language === "sw"
        ? `Karibu kwenye ukurasa wa mzazi wa ${currentChild.name}. Hapa unaweza kufuatilia maendeleo yake.`
        : language === "fr"
        ? `Bienvenue sur la page parentale de ${currentChild.name}. Vous pouvez suivre ses progrès ici.`
        : `Welcome to ${currentChild.name}'s Parent Zone. Here you can track their progress and adjust settings.`;
    
    speak(intro, language);
  }, [voiceOn, language, currentChild, speak, cancelSpeech]);
  const handleScreenTimeChange = useDebounce((value: number) => {
    if (currentChild) {
      updateChild(currentChild.id, { screenTimeLimit: value });
    }
  }, 300);
  
  const handleAddChild = async (name: string) => {
    const newChildId = await addChild(name);
    if (newChildId) {
      setCurrentChildId(newChildId);
      setIsAddingChild(false);
      
      if (voiceOn) {
        speak(
          language === "sw"
            ? `Mtoto mpya ${name} ameongezwa kikamilifu.`
            : language === "fr"
            ? `Nouvel enfant ${name} ajouté avec succès.`
            : `New child ${name} added successfully.`,
          language
        );
      }
    }
  };

  const progressPercent = useMemo(() => {
    if (!currentChild) return 0;
    const completed = currentChild.activities.filter(a => a.completed).length;
    const total = currentChild.activities.length || 1;
    return (completed / total) * 100;
  }, [currentChild]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-blue-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-blue-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Card className="text-red-500 p-6 text-center">
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </Card>
        </main>
      </div>
    );
  }

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
            onClick={() => {
              setVoiceOn(prev => !prev);
              if (voiceOn) cancelSpeech();
            }}
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
        <motion.div 
          className="text-center pt-2 md:pt-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-center items-center gap-3">
            <Baby className="text-pink-500 h-8 w-8" />
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600">
              {currentChild?.name || "Child"}'s Learning Platform
            </h1>
          </div>
          <p className="text-blue-400 mt-1 text-sm">
            For parents of curious 2-4 year olds
          </p>
        </motion.div>

        {/* Child Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <AnimatePresence initial={false}>
            {children.map(child => (
              <ChildCard
                key={child.id}
                child={child}
                isActive={currentChildId === child.id}
                onClick={() => setCurrentChildId(child.id)}
                onSpeak={() => {
                  if (voiceOn) {
                    speak(
                      language === "sw"
                        ? `Mtoto ${child.name}, umri ${child.age}`
                        : language === "fr"
                        ? `Enfant ${child.name}, âge ${child.age}`
                        : `Child ${child.name}, age ${child.age}`,
                      language
                    );
                  }
                }}
              />
            ))}
          </AnimatePresence>
          
          <motion.div whileHover={{ scale: 1.05 }}>
            <Button
              variant="outline"
              onClick={() => setIsAddingChild(true)}
              className="flex items-center gap-2 min-w-fit"
            >
              <Plus className="h-4 w-4" />
              Add Child
            </Button>
          </motion.div>
        </div>

        {isAddingChild && (
          <AddChildForm 
            onCancel={() => setIsAddingChild(false)}
            onSubmit={handleAddChild}
            language={language}
          />
        )}

        {/* Main Content */}
        {!isAddingChild && currentChild && (
          <motion.div 
            key={currentChildId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6"
          >
            {/* Child Profile Card */}
            <ChildProfileCard 
              child={currentChild}
              onSpeak={() => {
                if (voiceOn) {
                  speak(
                    language === "sw"
                      ? `Profa ya ${currentChild.name}. Muda wa skrini ni dakika ${currentChild.screenTimeLimit}.`
                      : language === "fr"
                      ? `Profil de ${currentChild.name}. Temps d'écran est ${currentChild.screenTimeLimit} minutes.`
                      : `${currentChild.name}'s profile. Screen time is ${currentChild.screenTimeLimit} minutes.`,
                    language
                  );
                }
              }}
            />

            {/* Today's Progress Card */}
            <ProgressCard 
              child={currentChild}
              progressPercent={progressPercent}
              onSpeak={() => {
                if (voiceOn) {
                  speak(
                    language === "sw"
                      ? `Leo, ${currentChild.name} amekamilisha shughuli ${Math.round(progressPercent)} asilimia.`
                      : language === "fr"
                      ? `Aujourd'hui, ${currentChild.name} a complété ${Math.round(progressPercent)} pourcent.`
                      : `Today, ${currentChild.name} completed ${Math.round(progressPercent)} percent of activities.`,
                    language
                  );
                }
              }}
            />

            {/* Parental Controls Card */}
            <ControlsCard 
              child={currentChild}
              onUpdate={(updates) => updateChild(currentChild.id, updates)}
              onScreenTimeChange={handleScreenTimeChange}
              onSpeak={() => {
                if (voiceOn) {
                  speak(
                    language === "sw"
                      ? "Mipangilio ya uzazi. Badilisha muda wa skrini, hali ya kulala, na ulinzi wa maudhui."
                      : language === "fr"
                      ? "Contrôles parentaux. Modifiez le temps d'écran, le mode nuit et le verrouillage du contenu."
                      : "Parental controls. Adjust screen time, bedtime mode and content lock.",
                    language
                  );
                }
              }}
            />

            {/* Premium Features Card */}
            <PremiumCard 
              onSpeak={() => {
                if (voiceOn) {
                  speak(
                    language === "sw"
                      ? "Vipengee vya premium. Pata michezo zaidi, ripoti za kina, na matumizi bila matangazo."
                      : language === "fr"
                      ? "Fonctionnalités premium. Obtenez plus de jeux, des rapports détaillés et une expérience sans publicité."
                      : "Premium features. Get more games, detailed reports and ad-free experience.",
                    language
                  );
                }
              }}
              language={language}
            />
          </motion.div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Designed with ❤️ for early learning journeys
        </p>
      </main>

      <BottomNavigation />
    </div>
  );
}

// Extracted Components

const AddChildForm = ({ 
  onCancel,
  onSubmit,
  language
}: { 
  onCancel: () => void;
  onSubmit: (name: string) => void;
  language: Language;
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm<{ name: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (data: { name: string }) => {
    setIsSubmitting(true);
    await onSubmit(data.name);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <Card className="bg-white border-2 border-blue-200">
        <CardHeader>
          <CardTitle>
            {language === "sw" ? "Ongeza Mtoto Mpya" : 
             language === "fr" ? "Ajouter un Nouvel Enfant" : "Add New Child"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="childName" className="block text-sm font-medium">
              {language === "sw" ? "Jina la Mtoto" : 
               language === "fr" ? "Nom de l'Enfant" : "Child's Name"}
            </label>
            <input
              id="childName"
              {...register("name", { 
                required: language === "sw" ? "Jina linahitajika" : 
                         language === "fr" ? "Nom requis" : "Name is required" 
              })}
              className="w-full p-2 border rounded"
              placeholder={
                language === "sw" ? "Weka jina la mtoto" : 
                language === "fr" ? "Entrez le nom de l'enfant" : "Enter child's name"
              }
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : language === "sw" ? "Hifadhi" : 
                 language === "fr" ? "Enregistrer" : "Save"}
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {language === "sw" ? "Ghairi" : 
               language === "fr" ? "Annuler" : "Cancel"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ChildProfileCard = ({ 
  child,
  onSpeak
}: { 
  child: ChildProfile;
  onSpeak: () => void;
}) => (
  <Card className="bg-white border-2 border-blue-200">
    <CardHeader className="pb-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={child.avatar} alt={`${child.name}'s avatar`} />
          <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-xl">{child.name}</CardTitle>
          <p className="text-blue-500 flex items-center gap-1 text-sm">
            <CalendarCheck className="h-4 w-4" />
            <span>{child.age}</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSpeak}
          className="ml-auto"
          aria-label="Read profile"
        >
          <Volume2 className="h-4 w-4 text-blue-600" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <Button variant="outline" className="w-full">
        <Settings className="h-4 w-4 mr-2" />
        Edit Profile
      </Button>
    </CardContent>
  </Card>
);

const ProgressCard = ({
  child,
  progressPercent,
  onSpeak
}: {
  child: ChildProfile;
  progressPercent: number;
  onSpeak: () => void;
}) => (
  <Card className="bg-yellow-50 border-2 border-yellow-200">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-yellow-700">
        <Trophy className="h-5 w-5" />
        Today's Adventures
        <Button
          variant="ghost"
          size="icon"
          onClick={onSpeak}
          aria-label="Read progress"
        >
          <Volume2 className="w-4 h-4 text-yellow-600" />
        </Button>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {child.activities.map((item) => (
        <ActivityItem key={item.id} activity={item} />
      ))}
      <Progress
        value={progressPercent}
        className="h-3 mt-4 bg-yellow-100"
      />
      <p className="text-sm text-yellow-600 text-center mt-1">
        {Math.round(progressPercent)}% of activities completed!
      </p>
    </CardContent>
  </Card>
);

const ControlsCard = ({
  child,
  onUpdate,
  onScreenTimeChange,
  onSpeak
}: {
  child: ChildProfile;
  onUpdate: (updates: Partial<ChildProfile>) => void;
  onScreenTimeChange: (value: number) => void;
  onSpeak: () => void;
}) => (
  <Card className="bg-pink-50 border-2 border-pink-200">
    <CardHeader>
      <CardTitle className="text-pink-700 flex items-center gap-2">
        Safety & Settings
        <Button
          variant="ghost"
          size="icon"
          onClick={onSpeak}
          aria-label="Read settings"
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
            {child.screenTimeLimit} min
          </span>
        </div>
        <Slider
          value={[child.screenTimeLimit]}
          max={60}
          step={5}
          onValueChange={([val]) => onScreenTimeChange(val)}
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
          checked={child.bedtimeMode}
          onCheckedChange={(val) => onUpdate({ bedtimeMode: val })}
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
          checked={child.contentLock}
          onCheckedChange={(val) => onUpdate({ contentLock: val })}
          className="data-[state=checked]:bg-blue-500"
        />
      </div>
    </CardContent>
  </Card>
);

const PremiumCard = ({
  onSpeak,
  language
}: {
  onSpeak: () => void;
  language: Language;
}) => {
  const features = {
    en: ["100+ educational games", "Daily progress reports", "Ad-free experience"],
    sw: ["Michezo 100+ ya kielimu", "Ripoti za kila siku", "Matumizi bila matangazo"],
    fr: ["100+ jeux éducatifs", "Rapports quotidiens", "Expérience sans publicité"]
  };

  return (
    <Card className="bg-purple-50 border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Gem className="h-5 w-5" />
          Premium Benefits
          <Button
            variant="ghost"
            size="icon"
            onClick={onSpeak}
            aria-label="Read premium benefits"
          >
            <Volume2 className="w-4 h-4 text-purple-600" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-purple-600 list-disc pl-5">
          {features[language].map((feature, i) => (
            <li key={i}>{feature}</li>
          ))}
        </ul>
        <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
          {language === "sw" ? "Dhibiti Usajili" : 
           language === "fr" ? "Gérer l'Abonnement" : "Manage Subscription"}
        </Button>
      </CardContent>
    </Card>
  );
};