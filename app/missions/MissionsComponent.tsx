'use client';

import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "@/lib/supabaseClient";
import { Howl } from "howler";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import NimiAssistant from "@/components/NimiAssistant";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle, Play, Trophy, Sparkles, Volume2, BookOpen, Palette, User, LogIn, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Translation dictionary for all supported languages
const translations = {
  en: {
    magicalLearning: "Magical Learning",
    watchMagic: "Watch Magic",
    completeMission: "Complete Mission",
    completed: "Completed!",
    dayComplete: "Day Complete!",
    masteredDay: "You mastered Day {day}'s magic!",
    awesome: "Awesome!",
    readNow: "Read Now",
    colorNow: "Color Now",
    preparingMagic: "✨ Preparing tomorrow's magic... ✨",
    previousPage: "Previous Page",
    nextPage: "Next Page",
    spreadCount: "Spread {current} of {total}",
    loadingMissions: "Loading missions...",
    selectChild: "Select Child",
    noChildren: "No children found. Please add a child first.",
    childSelectionTitle: "Who is completing this mission?",
    childSelectionDescription: "Please select which child is completing this mission",
    loginRequired: "Login Required",
    loginDescription: "Please log in to save mission progress",
    morningSong: "Morning Song",
    playVideo: "Play Video",
    enterChildName: "Enter your child's name",
    childName: "Child's Name",
    submit: "Submit",
    cancel: "Cancel",
    childNotFound: "Child not found. Please check the name and try again.",
    storyTime: "Story Time",
    coloringBook: "Coloring Book",
    pages: "pages",
    pauseMusic: "Pause music",
    playMusic: "Play music"
  },
  es: {
    magicalLearning: "Aprendizaje Mágico",
    watchMagic: "Ver Magia",
    completeMission: "Completar Misión",
    completed: "¡Completado!",
    dayComplete: "¡Día Completado!",
    masteredDay: "¡Dominaste la magia del Día {day}!",
    awesome: "¡Increíble!",
    readNow: "Leer Ahora",
    colorNow: "Colorear Ahora",
    preparingMagic: "✨ Preparando la magia de mañana... ✨",
    previousPage: "Página Anterior",
    nextPage: "Página Siguiente",
    spreadCount: "Doble página {current} de {total}",
    loadingMissions: "Cargando misiones...",
    selectChild: "Seleccionar Niño",
    noChildren: "No se encontraron niños. Por favor agregue un niño primero.",
    childSelectionTitle: "¿Quién está completando esta misión?",
    childSelectionDescription: "Por favor seleccione qué niño está completando esta misión",
    loginRequired: "Inicio de sesión requerido",
    loginDescription: "Por favor inicie sesión para guardar el progreso de la misión",
    morningSong: "Canción de la Mañana",
    playVideo: "Reproducir Video",
    enterChildName: "Ingrese el nombre de su hijo",
    childName: "Nombre del Niño",
    submit: "Enviar",
    cancel: "Cancelar",
    childNotFound: "Niño no encontrado. Por favor verifique el nombre e intente nuevamente.",
    storyTime: "Hora del Cuento",
    coloringBook: "Libro para Colorear",
    pages: "páginas",
    pauseMusic: "Pausar música",
    playMusic: "Reproducir música"
  },
  fr: {
    magicalLearning: "Apprentissage Magique",
    watchMagic: "Regarder la Magie",
    completeMission: "Terminer la Mission",
    completed: "Terminé!",
    dayComplete: "Jour Terminé!",
    masteredDay: "Vous avez maîtrisé la magie du Jour {day}!",
    awesome: "Génial!",
    readNow: "Lire Maintenant",
    colorNow: "Colorier Maintenant",
    preparingMagic: "✨ Préparation de la magie de demain... ✨",
    previousPage: "Page Précédente",
    nextPage: "Page Suivante",
    spreadCount: "Double page {current} sur {total}",
    loadingMissions: "Chargement des missions...",
    selectChild: "Sélectionner l'Enfant",
    noChildren: "Aucun enfant trouvé. Veuillez d'abord ajouter un enfant.",
    childSelectionTitle: "Qui termine cette mission?",
    childSelectionDescription: "Veuillez sélectionner quel enfant termine cette mission",
    loginRequired: "Connexion Requise",
    loginDescription: "Veuillez vous connecter pour enregistrer la progression de la mission",
    morningSong: "Chanson du Matin",
    playVideo: "Lire la Vidéo",
    enterChildName: "Entrez le nom de votre enfant",
    childName: "Nom de l'Enfant",
    submit: "Soumettre",
    cancel: "Annuler",
    childNotFound: "Enfant non trouvé. Veuillez vérifier le nom et réessayer.",
    storyTime: "Heure du Conte",
    coloringBook: "Livre de Coloriage",
    pages: "pages",
    pauseMusic: "Pause musique",
    playMusic: "Lecture musique"
  },
  rw: {
    magicalLearning: "Kwiga Ubumenyi",
    watchMagic: "Reba Ubumenyi",
    completeMission: "Komeza Umurimo",
    completed: "Byarakozwe!",
    dayComplete: "Umunsi Warakomeje!",
    masteredDay: "Warakoze ubumenyi bwa {day}!",
    awesome: "Nibyiza!",
    readNow: "Soma None",
    colorNow: "Paka None",
    preparingMagic: "✨ Gutegura ubumenyi bwa ejo... ✨",
    previousPage: "Ipaji y'Ibanjirije",
    nextPage: "Ipaji Ikurikira",
    spreadCount: "Ipaji {current} muri {total}",
    loadingMissions: "Kuringaniza imirimo...",
    selectChild: "Hitamo Umwana",
    noChildren: "Nta mwana wabonetse. Ongera umwana mbere.",
    childSelectionTitle: "Ni nde ugiye kurangiza iri murimo?",
    childSelectionDescription: "Nyamuneka hitamo umwana ugiye kurangiza iri murimo",
    loginRequired: "Login Ifunika",
    loginDescription: "Nyamuneka winjire kugirango ubike iterambere ry'umurimo",
    morningSong: "Indirimbo yo mu Gitondo",
    playVideo: "Videra Video",
    enterChildName: "Andika izina ry'umwana wawe",
    childName: "Izina ry'Umwana",
    submit: "Ohereza",
    cancel: "Hagarika",
    childNotFound: "Umwana ntabwo yabonetse. Ngaho cegeranya izina unongere ugerageze.",
    storyTime: "Igiro cy'Inkuru",
    coloringBook: "Igito cyo Gupaka",
    pages: "ipaji",
    pauseMusic: "Pause umuziki",
    playMusic: "Kina umuziki"
  },
  sw: {
    magicalLearning: "Kujifunza Kichawi",
    watchMagic: "Tazama Uchawi",
    completeMission: "Kamilisha Kazi",
    completed: "Imekamilika!",
    dayComplete: "Siku Imekamilika!",
    masteredDay: "Umeshinda uchawi wa Siku {day}!",
    awesome: "Nzuri!",
    readNow: "Soma Sasa",
    colorNow: "Rangi Sasa",
    preparingMagic: "✨ Kuandaa uchawi wa kesho... ✨",
    previousPage: "Ukurasa Uliotangulia",
    nextPage: "Ukurasa Unaofuata",
    spreadCount: "Ukurasa {current} kati ya {total}",
    loadingMissions: "Inapakia misheni...",
    selectChild: "Chagua Mtoto",
    noChildren: "Hakuna watoto waliopatikana. Tafadhali ongeza mtoto kwanza.",
    childSelectionTitle: "Nani anakamilisha hii kazi?",
    childSelectionDescription: "Tafadhali chagua mtoto anayekamilisha hii kazi",
    loginRequired: "Login Inahitajika",
    loginDescription: "Tafadhali ingia ili kuokoa maendeleo ya kazi",
    morningSong: "Wimbo wa Asubuhi",
    playVideo: "Cheza Video",
    enterChildName: "Weka jina la mtoto wako",
    childName: "Jina la Mtoto",
    submit: "Wasilisha",
    cancel: "Ghairi",
    childNotFound: "Mtoto hajapatikana. Tafadhali angalia jina na ujaribu tena.",
    storyTime: "Wakati wa Hadithi",
    coloringBook: "Kitabu cha Rangi",
    pages: "kurasa",
    pauseMusic: "Pausa muziki",
    playMusic: "Cheza muziki"
  }
};

// Types
interface BookCover {
  id: string;
  day: number;
  cover_type: 'story' | 'coloring';
  cover_url: string;
  spine_color: string;
  title: string;
}

interface Mission {
  id: string;
  day: number;
  title: string;
  description: string;
  duration_minutes: number;
  points: number;
  video_url: string;
  difficulty: number;
  mission_type: string;
}

interface CompletionData {
  mission_id: string;
  completed_at: string;
  child_id?: string;
}

interface DayData {
  day: number;
  title: string;
  theme: string;
  emoji: string;
  missions: Mission[];
}

interface AudioTrack {
  id: string;
  title: string;
  audio_url: string;
  is_default?: boolean;
}

interface StoryPage {
  id: string;
  day: number;
  page_number: number;
  image_url: string;
  text: string;
}

interface ColoringPage {
  id: string;
  day: number;
  page_number: number;
  image_url: string;
}

interface Child {
  id: string;
  name: string;
  parent_id: string;
}

// Video Player Modal with disabled fast-forward
const VideoPlayerModal = ({ videoUrl, onClose }: { videoUrl: string; onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === ' ') {
        e.preventDefault();
      }
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      // Prevent seeking by resetting if user tries to jump ahead
      if (videoRef.current.currentTime > currentTime + 1) {
        videoRef.current.currentTime = currentTime;
      } else {
        setCurrentTime(videoRef.current.currentTime);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative bg-black rounded-lg overflow-hidden w-full h-auto max-h-[80vh] aspect-video max-w-6xl"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
      >
        <button
          onClick={onClose}
          className="absolute top-1 right-1 md:top-2 md:right-2 z-10 text-white text-2xl md:text-3xl bg-black/50 rounded-full p-1 md:p-2"
          aria-label="Close video"
        >
          ✕
        </button>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onSeeked={handleTimeUpdate}
        />
      </motion.div>
    </motion.div>
  );
};

// Morning Video Card Component
const MorningVideoCard = ({ video, t }: { video: AudioTrack | null; t: (key: string) => string }) => {
  const [openVideo, setOpenVideo] = useState(false);

  if (!video) return null;

  return (
    <>
      <motion.div 
        className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-xl mb-6 border-2 border-yellow-300 w-full max-w-[400px] mx-auto cursor-pointer"
        whileHover={{ scale: 1.02 }}
        onClick={() => setOpenVideo(true)}
      >
        <div className="flex items-center justify-center gap-4">
          <div className="p-3 bg-white rounded-full shadow-md flex-shrink-0">
            <Play className="h-8 w-8 text-purple-600" />
          </div>
          <span className="text-xl font-bold truncate">{t('morningSong')}</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {openVideo && (
          <VideoPlayerModal 
            videoUrl={video.audio_url}
            onClose={() => setOpenVideo(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Child Name Input Modal
const ChildNameModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  t 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (name: string) => void;
  t: (key: string) => string;
}) => {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm(name.trim());
      setName('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('enterChildName')}</DialogTitle>
          <DialogDescription>
            {t('childSelectionDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="child-name">{t('childName')}</Label>
            <Input
              id="child-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('enterChildName')}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>{t('submit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Login Prompt Modal
const LoginPromptModal = ({ isOpen, onClose, t }: { isOpen: boolean; onClose: () => void; t: (key: string) => string }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('loginRequired')}</DialogTitle>
          <DialogDescription>
            {t('loginDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <Button onClick={() => {/* Add your login redirect logic here */}}>
            <LogIn className="h-4 w-4 mr-2" />
            Log In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ENHANCED RESPONSIVE REAL BOOK VIEWER
const RealBookViewer = ({ 
  pages, 
  onClose, 
  type,
  t
}: {
  pages: { image_url: string; page_number: number; text?: string }[];
  onClose: () => void;
  type: 'story' | 'coloring';
  t: (key: string) => string;
}) => {
  const [processedPages, setProcessedPages] = useState<typeof pages>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSpread, setCurrentSpread] = useState(0);
  const [isTurning, setIsTurning] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });
  const bookRef = useRef<HTMLDivElement>(null);
  
  // Calculate total spreads (each spread = 2 pages)
  const totalSpreads = Math.ceil(pages.length / 2);

  // Track window size for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Process images from Supabase storage
  useEffect(() => {
    const processImages = async () => {
      const processed = await Promise.all(
        pages.map(async (page) => {
          if (page.image_url.startsWith('supabase://')) {
            const path = page.image_url.replace('supabase://', '');
            const [bucket, ...filePath] = path.split('/');
            const { data: { publicUrl } } = await supabase.storage
              .from(bucket)
              .getPublicUrl(filePath.join('/'));
            return { ...page, image_url: publicUrl };
          }
          return page;
        })
      );
      setProcessedPages(processed);
      setIsLoading(false);
    };
    processImages();
  }, [pages]);

  // Calculate aspect ratio when pages are processed
  useEffect(() => {
    if (processedPages.length > 0 && processedPages[0].image_url) {
      const img = new Image();
      img.src = processedPages[0].image_url;
      img.onload = () => {
        setAspectRatio(img.width / img.height);
      };
    }
  }, [processedPages]);

  // Get pages for current spread
  const getSpreadPages = () => {
    const startIndex = currentSpread * 2;
    return [
      processedPages[startIndex],
      processedPages[startIndex + 1]
    ].filter(Boolean);
  };

  const goToNextSpread = () => {
    if (currentSpread < totalSpreads - 1 && !isTurning) {
      setFlipDirection('right');
      setIsTurning(true);
      setTimeout(() => {
        setCurrentSpread(prev => prev + 1);
        setIsTurning(false);
      }, 600);
      playPageTurnSound();
    }
  };

  const goToPrevSpread = () => {
    if (currentSpread > 0 && !isTurning) {
      setFlipDirection('left');
      setIsTurning(true);
      setTimeout(() => {
        setCurrentSpread(prev => prev - 1);
        setIsTurning(false);
      }, 600);
      playPageTurnSound();
    }
  };

  // Play page turn sound
  const playPageTurnSound = () => {
    const audio = document.getElementById('pageTurnSound') as HTMLAudioElement;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log("Audio play failed:", e));
    }
  };

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const touchCurrent = e.touches[0].clientX;
    const diff = touchStart - touchCurrent;
    
    // Only consider significant swipes
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNextSpread();
      } else {
        goToPrevSpread();
      }
      setTouchStart(null);
    }
  };

  // Edge page handling
  const getCursorStyle = () => {
    if (currentSpread === 0 && currentSpread === totalSpreads - 1) {
      return 'cursor-default';
    }
    if (currentSpread === 0) {
      return 'cursor-e-resize';
    }
    if (currentSpread === totalSpreads - 1) {
      return 'cursor-w-resize';
    }
    return 'cursor-grab';
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="text-4xl animate-pulse">📖</div>
      </div>
    );
  }

  const currentPages = getSpreadPages();

  // Calculate book dimensions based on aspect ratio and window size
  const maxBookWidth = Math.min(800, windowSize.width * 0.95);
  const maxBookHeight = Math.min(600, windowSize.height * 0.8);
  
  // Determine book height based on aspect ratio
  let bookHeight = maxBookHeight;
  let bookWidth = bookHeight * aspectRatio * 2;
  
  // If book is too wide for screen, adjust dimensions
  if (bookWidth > maxBookWidth) {
    bookWidth = maxBookWidth;
    bookHeight = bookWidth / (aspectRatio * 2);
  }
  
  // Mobile optimization
  const isMobile = windowSize.width < 640;
  const bookPadding = isMobile ? 'p-1' : 'p-4';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 text-white text-2xl bg-black/50 rounded-full p-1 sm:p-2"
      >
        ✕
      </button>

      <div 
        ref={bookRef} 
        className={`relative flex justify-center perspective-1000 ${getCursorStyle()} ${bookPadding}`}
        style={{
          width: `${bookWidth}px`,
          height: `${bookHeight}px`
        }}
      >
        <div className="relative w-full h-full flex justify-center">
          {/* Left Page */}
          {currentPages[0] && (
            <motion.div
              className="absolute left-0 w-1/2 h-full bg-gray-100 shadow-lg rounded-l-lg overflow-hidden"
              animate={isTurning && flipDirection === 'right' ? "flipLeft" : {}}
              variants={{
                flipLeft: {
                  rotateY: -180,
                  transition: { 
                    duration: 0.6,
                    ease: "easeInOut"
                  }
                }
              }}
              style={{ 
                transformStyle: 'preserve-3d',
                transformOrigin: 'right center'
              }}
            >
              <div className="w-full h-full relative">
                {/* Page Content */}
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-white">
                  <img 
                    src={currentPages[0].image_url} 
                    alt={`Page ${currentPages[0].page_number}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Text Overlay */}
                {type === 'story' && currentPages[0].text && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-white/80 text-center text-xs sm:text-sm">
                    {currentPages[0].text}
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {/* Right Page */}
          {currentPages[1] && (
            <motion.div
              className={`absolute right-0 w-1/2 h-full bg-white shadow-lg rounded-r-lg overflow-hidden z-10 ${
                isTurning ? 'pointer-events-none' : ''
              }`}
              animate={isTurning && flipDirection === 'right' ? "flipRight" : {}}
              variants={{
                flipRight: {
                  rotateY: -180,
                  transition: { 
                    duration: 0.6,
                    ease: "easeInOut"
                  }
                }
              }}
              style={{ 
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center',
                backfaceVisibility: 'hidden'
              }}
            >
              <div className="w-full h-full relative">
                {/* Page Content */}
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-white">
                  <img 
                    src={currentPages[1].image_url} 
                    alt={`Page ${currentPages[1].page_number}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Text Overlay */}
                {type === 'story' && currentPages[1].text && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-white/80 text-center text-xs sm:text-sm">
                    {currentPages[1].text}
                  </div>
                )}
                
                {/* Page Shadow (during turn) */}
                <AnimatePresence>
                  {isTurning && flipDirection === 'right' && (
                    <motion.div
                      className="absolute inset-0 bg-black/30"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.3 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
          
          {/* Previous Spread Preview (peeking) */}
          {currentSpread > 0 && (
            <motion.div 
              className="absolute left-0 w-[5%] h-full bg-gray-800 rounded-l-lg z-0"
              animate={{ width: isTurning ? '5%' : '8%' }}
              transition={{ duration: 0.3 }}
            />
          )}
          
          {/* Next Spread Preview (peeking) */}
          {currentSpread < totalSpreads - 1 && (
            <motion.div 
              className="absolute right-0 w-[5%] h-full bg-gray-800 rounded-r-lg z-0"
              animate={{ width: isTurning ? '5%' : '8%' }}
              transition={{ duration: 0.3 }}
            />
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute top-1/2 left-1 sm:left-2 transform -translate-y-1/2 z-40">
        <button
          onClick={goToPrevSpread}
          disabled={currentSpread === 0 || isTurning}
          className={`p-1 sm:p-2 rounded-full bg-black/50 ${currentSpread === 0 ? 'opacity-30' : 'hover:bg-black/70'}`}
          aria-label={t('previousPage')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      <div className="absolute top-1/2 right-1 sm:right-2 transform -translate-y-1/2 z-40">
        <button
          onClick={goToNextSpread}
          disabled={currentSpread === totalSpreads - 1 || isTurning}
          className={`p-1 sm:p-2 rounded-full bg-black/50 ${currentSpread === totalSpreads - 1 ? 'opacity-30' : 'hover:bg-black/70'}`}
          aria-label={t('nextPage')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Spread Counter */}
      <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 flex justify-center z-40">
        <div className="flex items-center justify-center text-xs sm:text-sm font-medium bg-white/90 px-3 py-1 sm:px-4 sm:py-2 rounded-full">
          {t('spreadCount', {
            current: currentSpread + 1,
            total: totalSpreads
          })}
        </div>
      </div>

      {/* Page turning sound effect */}
      <audio 
        id="pageTurnSound" 
        src="/sounds/page-turn.mp3" 
        preload="auto"
      />
    </div>
  )
};

// ENHANCED BOOK CARD COMPONENT
const BookCard = ({ 
  day, 
  onOpen, 
  pageCount,
  coverData,
  type,
  t
}: { 
  day: number; 
  onOpen: () => void; 
  pageCount: number;
  coverData?: BookCover;
  type: 'story' | 'coloring';
  t: (key: string) => string;
}) => {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const fetchCoverImage = async () => {
      if (coverData?.cover_url) {
        if (coverData.cover_url.startsWith('supabase://')) {
          const path = coverData.cover_url.replace('supabase://', '');
          const [bucket, ...filePath] = path.split('/');
          const { data: { publicUrl } } = await supabase.storage
            .from('book-covers')
            .getPublicUrl(filePath.join('/'));
          setCoverUrl(publicUrl);
        } else {
          setCoverUrl(coverData.cover_url);
        }
      }
    };
    fetchCoverImage();
    
    // Add periodic animation
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }, 15000);
    
    return () => clearInterval(interval);
  }, [coverData]);

  const defaultSpineColor = type === 'story' 
    ? 'linear-gradient(to bottom, #6b46c1, #553c9a)' 
    : 'linear-gradient(to bottom, #3182ce, #2c5282)';

  const defaultBorderColor = type === 'story' 
    ? 'border-purple-300' 
    : 'border-yellow-300';

  const defaultButtonGradient = type === 'story'
    ? 'from-purple-500 to-pink-500'
    : 'from-blue-500 to-green-500';

  const defaultIcon = type === 'story' ? '📖' : '✏️';

  return (
    <motion.div
      className="relative w-full max-w-[280px] mx-auto h-[320px] perspective-1000 mb-8"
      initial={{ rotateY: type === 'story' ? -5 : 5 }}
      whileHover={{ 
        y: -10,
        rotateY: type === 'story' ? 5 : -5,
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Book Spine */}
      <motion.div 
        className={`absolute ${type === 'story' ? 'left-0 rounded-l-lg' : 'right-0 rounded-r-lg'} w-8 h-full shadow-lg z-10`}
        style={{ 
          background: coverData?.spine_color || defaultSpineColor
        }}
        animate={isAnimating ? { 
          rotateY: [0, type === 'story' ? -5 : 5, 0],
          transition: { duration: 0.8 }
        } : {}}
      />
      
      {/* Book Cover */}
      <motion.div
        className={`absolute inset-0 rounded-lg shadow-xl border-4 ${defaultBorderColor} p-6 flex flex-col items-center text-center overflow-hidden`}
        style={{ transformStyle: 'preserve-3d' }}
        animate={isAnimating ? { 
          rotateY: [0, type === 'story' ? -10 : 10, 0],
          transition: { duration: 0.8 }
        } : {}}
      >
        {/* Dynamic Book Cover Image */}
        {coverUrl ? (
          <div className="absolute inset-0 bg-cover bg-center z-0" 
               style={{ backgroundImage: `url(${coverUrl})` }} />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${
            type === 'story' ? 'from-yellow-100 to-pink-100' : 'from-blue-100 to-green-100'
          } z-0`} />
        )}
        
        {/* Overlay for better text visibility */}
        <div className="absolute inset-0 bg-black/10 z-1" />
        
        {/* Book Content */}
        <div className="relative z-10 w-full h-full flex flex-col">
          <motion.div 
            className="text-5xl mb-4"
            animate={{ 
              rotate: [0, type === 'story' ? 5 : -5, type === 'story' ? -5 : 5, 0],
              y: [0, -5, 0]
            }}
            transition={{ repeat: Infinity, duration: type === 'story' ? 8 : 6 }}
          >
            {defaultIcon}
          </motion.div>
          
          <h3 className="text-xl font-bold text-white drop-shadow-md">
            {coverData?.title || (type === 'story' ? t('storyTime') : t('coloringBook'))}
          </h3>
          
          <p className="text-sm mb-4 text-white/90 drop-shadow-md">
            {pageCount} {t('pages')}
          </p>
          
          {/* Book Pages Edge */}
          <div className={`absolute ${type === 'story' ? 'left-0' : 'right-0'} top-0 w-1 h-full bg-gray-200 shadow-md`} />
          
          <motion.button
            onClick={onOpen}
            className={`mt-auto gap-2 py-3 px-4 bg-gradient-to-r ${defaultButtonGradient} text-white w-full rounded-lg font-bold`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {type === 'story' ? (
              <BookOpen className="h-5 w-5 inline mr-2" />
            ) : (
              <Palette className="h-5 w-5 inline mr-2" />
            )}
            {type === 'story' ? t('readNow') : t('colorNow')}
          </motion.button>
        </div>
      </motion.div>

      {/* Subtle page curl effect on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className={`absolute ${type === 'story' ? 'right-0' : 'left-0'} top-0 w-4 h-full z-20`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main Component with translations
const MissionsComponent = () => {
  const [missionProgram, setMissionProgram] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [completions, setCompletions] = useState<CompletionData[]>([]);
  const [openVideo, setOpenVideo] = useState<string | null>(null);
  const [showDayCompleteModal, setShowDayCompleteModal] = useState(false);
  const [showStorybook, setShowStorybook] = useState(false);
  const [showColoringBook, setShowColoringBook] = useState(false);
  const [storyPages, setStoryPages] = useState<StoryPage[]>([]);
  const [coloringPages, setColoringPages] = useState<ColoringPage[]>([]);
  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookCovers, setBookCovers] = useState<BookCover[]>([]);
  const { user } = useUser();
  const { language } = useLanguage();
  const [children, setChildren] = useState<Child[]>([]);
  const [showChildNameModal, setShowChildNameModal] = useState(false);
  const [missionToComplete, setMissionToComplete] = useState<Mission | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [childNotFound, setChildNotFound] = useState(false);
  
  // Translation function
  const t = (key: string, params?: Record<string, any>) => {
    let translation = translations[language]?.[key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        translation = translation.replace(`{${k}}`, v);
      });
    }
    return translation;
  };

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        // Fetch missions
        const { data: missions, error: missionsError } = await supabase
          .from("missions")
          .select("*")
          .order("day", { ascending: true });

        if (missionsError) throw missionsError;
        if (missions) setMissionProgram(groupMissionsByDay(missions));

        // Fetch completions
        if (user?.id) {
          const { data: completions, error: completionsError } = await supabase
            .from("mission_completions")
            .select("mission_id, completed_at, child_id")
            .eq("user_id", user.id);

          if (completionsError) throw completionsError;
          setCompletions(completions || []);
        }

        // Fetch audio track (now used as morning video)
        const { data: audioData, error: audioError } = await supabase
          .from("audio_tracks")
          .select("*")
          .eq("is_default", true)
          .single();

        if (!audioError && audioData) {
          setAudioTrack(audioData);
        }

        // Fetch book covers
        const { data: covers, error: coversError } = await supabase
          .from("book_covers")
          .select("*");

        if (!coversError) {
          setBookCovers(covers || []);
        }

        // Fetch children if user is logged in
        if (user?.id) {
          const { data: childrenData, error: childrenError } = await supabase
            .from("children")
            .select("*")
            .eq("parent_id", user.id);

          if (!childrenError) {
            setChildren(childrenData || []);
          }
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  // Fetch story pages and coloring pages when day changes
  useEffect(() => {
    const fetchDayContent = async () => {
      setIsLoading(true);
      try {
        // Fetch story pages from storybook bucket
        const { data: storyData, error: storyError } = await supabase
          .from("storybook_pages")
          .select("*")
          .eq("day", selectedDay)
          .order("page_number", { ascending: true });

        if (storyError) throw storyError;
        setStoryPages(storyData || []);

        // Fetch coloring pages from coloriage bucket
        const { data: coloringData, error: coloringError } = await supabase
          .from("coloring_book_pages")
          .select("*")
          .eq("day", selectedDay)
          .order("page_number", { ascending: true });

        if (coloringError) throw coloringError;
        setColoringPages(coloringData || []);

      } catch (error) {
        console.error("Error fetching day content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDayContent();
  }, [selectedDay]);

  const groupMissionsByDay = (missions: Mission[]) => {
    const grouped: Record<number, DayData> = {};

    missions.forEach((m) => {
      if (!grouped[m.day]) {
        grouped[m.day] = {
          day: m.day,
          title: `Day ${m.day}`,
          theme: t('magicalLearning'),
          emoji: "✨",
          missions: [],
        };
      }
      grouped[m.day].missions.push(m);
    });

    return Object.values(grouped).sort((a, b) => a.day - b.day);
  };

  const completedIds = useMemo(
    () => new Set(completions.map((c) => c.mission_id)),
    [completions]
  );

  const currentDayData = useMemo(
    () => missionProgram.find((d) => d.day === selectedDay),
    [missionProgram, selectedDay]
  );

  const handleMissionComplete = (mission: Mission) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    // If user is logged in, ask for child name
    setMissionToComplete(mission);
    setShowChildNameModal(true);
  };

  const completeMission = async (mission: Mission, childName: string) => {
    // Find child by name
    const child = children.find(c => c.name.toLowerCase() === childName.toLowerCase());
    
    if (!child) {
      setChildNotFound(true);
      setTimeout(() => setChildNotFound(false), 3000);
      return;
    }

    const newCompletion = {
      mission_id: mission.id,
      completed_at: new Date().toISOString(),
      child_id: child.id,
    };

    setCompletions((prev) => [...prev, newCompletion]);

    const confetti = await import("canvas-confetti");
    confetti.default({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (user?.id) {
      await supabase
        .from("mission_completions")
        .insert([{ ...newCompletion, user_id: user.id }]);
    }

    if (currentDayData?.missions.every(m => completedIds.has(m.id) || m.id === mission.id)) {
      setShowDayCompleteModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-4xl animate-pulse mb-4">✨</div>
        <Skeleton className="h-8 w-48 mb-8" />
        
        <div className="flex overflow-x-auto pb-4 gap-3 w-full max-w-2xl">
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <Skeleton key={day} className="h-20 w-20 rounded-xl" />
          ))}
        </div>
        
        <div className="w-full max-w-md mb-6">
          <Skeleton className="h-20 w-full rounded-xl mb-4" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          {[1, 2, 3, 4].map(item => (
            <Skeleton key={item} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Day Selection */}
      <section className="mb-6 w-full">
        <h2 className="text-4xl font-bold text-center mb-6 select-none">
          <motion.span 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5 }}
            className="inline-block mr-3"
          >
            {currentDayData?.emoji || "✨"}
          </motion.span>
          {currentDayData?.theme}
        </h2>

        <div className="flex overflow-x-auto pb-4 gap-4 px-4 scrollbar-thin w-full">
          {missionProgram.slice(0, 7).map(day => (
            <motion.button
              key={day.day}
              onClick={() => setSelectedDay(day.day)}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center p-4 rounded-xl min-w-[100px] transition-all flex-shrink-0
                ${selectedDay === day.day
                  ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg"
                  : "bg-white shadow-md hover:shadow-lg"}`}
            >
              <motion.span 
                className="text-4xl"
                animate={selectedDay === day.day ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {day.emoji}
              </motion.span>
              <span className="text-lg font-bold">Day {day.day}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Morning Video & Nimi Assistant */}
      <div className="max-w-md mx-auto mb-6 space-y-4 w-full px-4">
        <MorningVideoCard video={audioTrack} t={t} />
        <motion.div 
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-full"
        >
          <NimiAssistant mood="happy" />
        </motion.div>
      </div>

      {/* Missions Grid */}
      {currentDayData?.missions.length ? (
        <section className="max-w-2xl mx-auto px-4 w-full">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 w-full">
            {currentDayData.missions.map((mission, index) => {
              const completed = completedIds.has(mission.id);
              const icon = ["🧙", "🦄", "🌈", "🔮", "🎩", "🌟"][index % 6];

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="w-full"
                >
                  <Card className={`relative overflow-hidden border-2 transition-all w-full
                    ${completed ? "border-green-300 bg-green-50" : "border-purple-200 hover:border-purple-300"}`}
                  >
                    {completed && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white p-1 rounded-full">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                    )}

                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-5xl">{icon}</span>
                        <CardTitle className="text-2xl">{mission.title}</CardTitle>
                      </div>
                    </CardHeader>

                    <CardContent className="grid gap-3">
                      <Button
                        onClick={() => setOpenVideo(mission.video_url)}
                        className="w-full gap-3 py-4 text-xl min-h-[64px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                      >
                        <Play className="h-7 w-7" />
                        <span>{t('watchMagic')}</span>
                      </Button>

                      {!completed ? (
                        <Button
                          onClick={() => handleMissionComplete(mission)}
                          variant="outline"
                          className="w-full gap-3 py-4 text-xl min-h-[64px] border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                        >
                          <Sparkles className="h-7 w-7" />
                          <span>{t('completeMission')}</span>
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center gap-3 text-green-600 text-xl font-semibold p-4 bg-green-100 rounded-lg">
                          <Trophy className="h-7 w-7" />
                          <span>{t('completed')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="text-center py-20 text-gray-600 text-lg w-full">
          {t('preparingMagic')}
        </div>
      )}

      {/* Storybook and Coloring Book Cards */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-8">
        {storyPages.length > 0 && (
          <BookCard 
            day={selectedDay} 
            onOpen={() => setShowStorybook(true)}
            pageCount={storyPages.length}
            coverData={bookCovers.find(c => c.day === selectedDay && c.cover_type === 'story')}
            type="story"
            t={t}
          />
        )}
        
        {coloringPages.length > 0 && (
          <BookCard 
            day={selectedDay}
            onOpen={() => setShowColoringBook(true)}
            pageCount={coloringPages.length}
            coverData={bookCovers.find(c => c.day === selectedDay && c.cover_type === 'coloring')}
            type="coloring"
            t={t}
          />
        )}
      </div>

      {/* Child Name Input Modal */}
      <ChildNameModal
        isOpen={showChildNameModal}
        onClose={() => setShowChildNameModal(false)}
        onConfirm={(childName) => {
          if (missionToComplete) {
            completeMission(missionToComplete, childName);
          }
          setShowChildNameModal(false);
          setMissionToComplete(null);
        }}
        t={t}
      />

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        t={t}
      />

      {/* Child Not Found Toast */}
      <AnimatePresence>
        {childNotFound && (
          <motion.div
            className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <div className="flex items-center">
              <X className="h-5 w-5 mr-2" />
              <span>{t('childNotFound')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day Complete Modal */}
      <AnimatePresence>
        {showDayCompleteModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl p-8 shadow-xl text-center w-full max-w-md border-2 border-blue-300 relative overflow-hidden"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="absolute -top-8 -left-8 text-5xl opacity-20">🏆</div>
              <div className="absolute -bottom-8 -right-8 text-5xl opacity-20">🎉</div>
              
              <motion.div
                className="text-5xl mb-4 mx-auto w-20 h-20"
                animate={{
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
              >
                🏅
              </motion.div>

              <h2 className="text-2xl font-bold mb-4 text-blue-800">{t('dayComplete')}</h2>
              <p className="text-lg mb-6">
                {t('masteredDay', { day: selectedDay })}
              </p>

              <Button
                onClick={() => setShowDayCompleteModal(false)}
                className="gap-2 text-lg py-3 w-full max-w-xs mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              >
                <Sparkles className="h-5 w-5" />
                {t('awesome')}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Storybook Viewer */}
      <AnimatePresence>
        {showStorybook && storyPages.length > 0 && (
          <RealBookViewer 
            pages={storyPages.map(page => ({
              image_url: page.image_url,
              page_number: page.page_number,
              text: page.text
            }))}
            onClose={() => setShowStorybook(false)}
            type="story"
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Coloring Book Viewer */}
      <AnimatePresence>
        {showColoringBook && coloringPages.length > 0 && (
          <RealBookViewer 
            pages={coloringPages.map(page => ({
              image_url: page.image_url,
              page_number: page.page_number
            }))}
            onClose={() => setShowColoringBook(false)}
            type="coloring"
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Video Player */}
      <AnimatePresence>
        {openVideo && (
          <VideoPlayerModal 
            videoUrl={openVideo}
            onClose={() => setOpenVideo(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default MissionsComponent;