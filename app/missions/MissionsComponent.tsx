'use client';

import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import NimiReaderButton from "@/components/NimiReaderButton";


// Import icons individually to avoid barrel import issues
import { BookOpen } from "lucide-react";
import { CheckCircle } from "lucide-react";
import { Download } from "lucide-react";
import { Image as ImageIcon } from "lucide-react";
import { Palette } from "lucide-react";
import { Play } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Trophy } from "lucide-react";
import { Video } from "lucide-react";
import { X } from "lucide-react";

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
    pageCount: "Page {current} of {total}",
    loadingMissions: "Loading missions...",
    enterChildName: "Enter your child's name",
    childName: "Child's Name",
    submit: "Submit",
    cancel: "Cancel",
    childNotFound: "Child not found. Please check the name and try again.",
    storyTime: "Story Time",
    coloringBook: "Coloring Book",
    pages: "pages",
    pauseMusic: "Pause music",
    playMusic: "Play music",
    genericSong: "Generic Song",
    playVideo: "Play Video",
    missionCompleted: "Mission completed!",
    missionAlreadyCompleted: "Mission already completed!",
    watchVideoFirst: "Watch video first",
    pleaseWatchVideo: "Please watch the video to completion before completing the mission",
    viewSlides: "View Slides",
    downloadContent: "Download Content"
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
    pageCount: "Página {current} de {total}",
    loadingMissions: "Cargando misiones...",
    enterChildName: "Ingrese el nombre de su hijo",
    childName: "Nombre del Niño",
    submit: "Enviar",
    cancel: "Cancelar",
    childNotFound: "Niño no encontrado. Por favor verifique el nombre e intente nuevamente.",
    storyTime: "Hora del Cuento",
    coloringBook: "Libro para Colorear",
    pages: "páginas",
    pauseMusic: "Pausar música",
    playMusic: "Reproducir música",
    genericSong: "Canción Genérica",
    playVideo: "Reproducir Video",
    missionCompleted: "¡Misión completada!",
    missionAlreadyCompleted: "¡Misión ya completada!",
    watchVideoFirst: "Ver video primero",
    pleaseWatchVideo: "Por favor mira el video completo antes de completar la misión",
    viewSlides: "Ver Diapositivas",
    downloadContent: "Descargar Contenido"
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
    pageCount: "Page {current} sur {total}",
    loadingMissions: "Chargement des missions...",
    enterChildName: "Entrez le nombre de votre enfant",
    childName: "Nom de l'Enfant",
    submit: "Soumettre",
    cancel: "Annuler",
    childNotFound: "Enfant non trouvé. Veuillez vérifier le nom et réessayer.",
    storyTime: "Heure du Conte",
    coloringBook: "Livre de Coloriage",
    pages: "pages",
    pauseMusic: "Pause musique",
    playMusic: "Lecture musique",
    genericSong: "Chanson Générique",
    playVideo: "Lire la Vidéo",
    missionCompleted: "Mission terminée!",
    missionAlreadyCompleted: "Mission déjà terminée!",
    watchVideoFirst: "Regarder la vidéo d'abord",
    pleaseWatchVideo: "Veuillez regarder la vidéo jusqu'au bout avant de terminer la mission",
    viewSlides: "Voir les Diapositivas",
    downloadContent: "Télécharger le Contenido"
  },
  rw: {
    magicalLearning: "Kwiga Ubumenyi",
    watchMagic: "Reba Ubumenyi",
    completeMission: "Komeza Umurimo",
    completed: "Byarakozwe!",
    dayComplete: "Umunsi Warakomeje!",
    masteredDay: "Warakoze ubumenyi bwa {day}!",
    awesome: "Nibbyiza!",
    readNow: "Soma None",
    colorNow: "Paka None",
    preparingMagic: "✨ Gutegura ubumenyi bwa ejo... ✨",
    previousPage: "Ipaji y'Ibanjirije",
    nextPage: "Ipaji Ikurikira",
    pageCount: "Ipaji {current} muri {total}",
    loadingMissions: "Kuringaniza imirimo...",
    enterChildName: "Andika izina ry'umwana wawe",
    childName: "Izina ry'Umwana",
    submit: "Ohereza",
    cancel: "Hagarika",
    childNotFound: "Umwana ntabwo yabonetse. Ngaho cegeranya izina unongere ugerageze.",
    storyTime: "Igiro cy'Inkuru",
    coloringBook: "Igito cyo Gupaka",
    pages: "ipaji",
    pauseMusic: "Pause umuziki",
    playMusic: "Kina umuziki",
    genericSong:"Indirimbo Rusange",
    playVideo: "Videra Video",
    missionCompleted: "Umurimo warangiye!",
    missionAlreadyCompleted: "Umurimo warangiye kera!",
    watchVideoFirst: "Reba video mbere",
    pleaseWatchVideo: "Nyamuneka reba video ukomeza mbere y'uko ukomeza umurimo",
    viewSlides: "Reba Amapikisiki",
    downloadContent: "Kuramo Ibirimo"
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
    pageCount: "Ukurasa {current} kati ya {total}",
    loadingMissions: "Inapakia misheni...",
    enterChildName: "Weka jina la mtoto wako",
    childName: "Jina la Mtoto",
    submit: "Wasilisha",
    cancel: "Ghairi",
    childNotFound: "Mtoto hajapatikana. Tafadhali angalia jina na ujaribu tena.",
    storyTime: "Wakati wa Hadithi",
    coloringBook: "Kitabu cha Rangi",
    pages: "kurasa",
    pauseMusic: "Pausa muziki",
    playMusic: "Cheza muziki",
    genericSong: "Wimbo wa Jumla",
    playVideo: "Cheza Video",
    missionCompleted: "Misheni imekamilika!",
    missionAlreadyCompleted: "Misheni tayari imekamilika!",
    watchVideoFirst: "Tazama video kwanza",
    pleaseWatchVideo: "Tafadhali tazama video hadi mwisho kabla ya kukamilisha misheni",
    viewSlides: "Tazama Slaidi",
    downloadContent: "Pakua Yaliyomo"
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
  slides_url?: string;
  difficulty: number;
  mission_type: string;
}

interface CompletionData {
  mission_id: string;
  completed_at: string;
  child_name?: string;
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
// Update the SlidesModal component to properly display images
const SlidesModal = ({
  slides,
  onClose,
  mission,
  onMissionComplete,
  t
}: {
  slides: { image_url: string; title?: string; description?: string }[];
  onClose: () => void;
  mission: Mission;
  onMissionComplete: (mission: Mission) => void;
  t: (key: string) => string;
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [processedSlides, setProcessedSlides] = useState<typeof slides>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Process Supabase URLs
  useEffect(() => {
    const processSlideImages = async () => {
      const processed = await Promise.all(
        slides.map(async (slide) => {
          if (slide.image_url.startsWith("supabase://")) {
            const path = slide.image_url.replace("supabase://", "");
            const [bucket, ...filePath] = path.split("/");
            const { data: { publicUrl } } = await supabase.storage
              .from("mission_slides")
              .getPublicUrl(filePath.join("/"));
            return { ...slide, image_url: publicUrl };
          }
          return slide;
        })
      );
      setProcessedSlides(processed);
      setIsLoading(false);
    };
    processSlideImages();
  }, [slides]);

  const nextSlide = () => {
    if (currentSlide < processedSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      setImageError(false);
    } else {
      onMissionComplete(mission);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      setImageError(false);
    }
  };

  const handleImageError = () => setImageError(true);

  const downloadSlide = async () => {
    try {
      const response = await fetch(processedSlides[currentSlide].image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `slide-${currentSlide + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-4xl animate-pulse text-white">✨</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Blurred background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl"></div>

      {/* Image container */}
      {imageError ? (
        <div className="relative z-10 text-white text-center p-4">
          <div className="text-4xl mb-2">📷</div>
          <p>Failed to load image</p>
        </div>
      ) : (
        <img
          src={processedSlides[currentSlide]?.image_url}
          alt={`Slide ${currentSlide + 1}`}
          onClick={(e) => e.stopPropagation()}
          onLoad={() => setImageError(false)}
          onError={handleImageError}
          className="relative z-10 max-w-full max-h-full object-contain"
          style={{
            display: "block",
            margin: "0 auto",
          }}
        />
      )}

      {/* Navigation arrows */}
      {processedSlides.length > 1 && !imageError && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            disabled={currentSlide === 0}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-3 rounded-full shadow hover:bg-white z-10"
          >
            ◀
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-3 rounded-full shadow hover:bg-white z-10"
          >
            ▶
          </button>
        </>
      )}

      {/* Download button */}
      {!imageError && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadSlide();
            }}
            className="bg-white/80 hover:bg-white p-3 rounded-full shadow-lg flex items-center justify-center"
            title="Download Slide"
          >
            <Download className="w-6 h-6 text-black" />
          </button>
        </div>
      )}
    </div>
  );
};


// Video Player Modal with disabled fast-forward and completion tracking
const VideoPlayerModal = ({ 
  videoUrl, 
  onClose, 
  mission,
  onMissionComplete,
  t
}: { 
  videoUrl: string; 
  onClose: () => void;
  mission: Mission;
  onMissionComplete: (mission: Mission) => void;
  t: (key: string) => string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  
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
        
        // Check if video is at least 95% complete
        if (videoRef.current.duration > 0 && 
            videoRef.current.currentTime / videoRef.current.duration >= 0.95 &&
            !hasCompleted) {
          setHasCompleted(true);
          onMissionComplete(mission);
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const downloadVideo = async () => {
    try {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `mission-${mission.day}-${mission.title.replace(/\s+/g, '-')}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading video:', error);
      toast.error('Failed to download video');
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
        
        <button
          onClick={downloadVideo}
          className="absolute top-1 left-1 md:top-2 md:left-2 z-10 text-white text-2xl md:text-3xl bg-black/50 rounded-full p-1 md:p-2"
          aria-label="Download video"
          title="Download video"
        >
          <Download className="h-5 w-5 md:h-6 md:w-6" />
        </button>
        
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onSeeked={handleTimeUpdate}
          onEnded={() => {
            if (!hasCompleted) {
              setHasCompleted(true);
              onMissionComplete(mission);
            }
          }}
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
          <span className="text-xl font-bold truncate">{t('genericSong')}</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {openVideo && (
          <VideoPlayerModal 
            videoUrl={video.audio_url}
            onClose={() => setOpenVideo(false)}
            mission={{} as Mission}
            onMissionComplete={() => {}}
            t={t}
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
            Please enter your child's name to track their progress
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
// SINGLE PAGE BOOK VIEWER - ENHANCED WITH FULL-SCREEN IMAGE DISPLAY
const SinglePageBookViewer = ({ 
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
  const [currentPage, setCurrentPage] = useState(0);
  const [isTurning, setIsTurning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [imageError, setImageError] = useState(false);
  
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

  const goToNextPage = () => {
    if (currentPage < processedPages.length - 1 && !isTurning) {
      setIsTurning(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsTurning(false);
        setImageError(false);
      }, 300);
      playPageTurnSound();
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0 && !isTurning) {
      setIsTurning(true);
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsTurning(false);
        setImageError(false);
      }, 300);
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

  // Download current page
  const downloadCurrentPage = async () => {
    try {
      const currentPageData = processedPages[currentPage];
      if (!currentPageData) return;

      const response = await fetch(currentPageData.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const fileName = type === 'story' 
        ? `story-day${pages[0]?.day || '1'}-page${currentPageData.page_number}.jpg`
        : `coloring-day${pages[0]?.day || '1'}-page${currentPageData.page_number}.jpg`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Downloaded page ${currentPageData.page_number}`);
    } catch (error) {
      console.error('Error downloading page:', error);
      toast.error('Failed to download page');
    }
  };

  // Download all pages
  const downloadAllPages = async () => {
    try {
      toast.info(`Starting download of ${processedPages.length} pages...`);
      
      for (let i = 0; i < processedPages.length; i++) {
        const page = processedPages[i];
        const response = await fetch(page.image_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const fileName = type === 'story' 
          ? `story-day${pages[0]?.day || '1'}-page${page.page_number}.jpg`
          : `coloring-day${pages[0]?.day || '1'}-page${page.page_number}.jpg`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup and small delay between downloads
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Add a small delay to avoid overwhelming the browser
        if (i < processedPages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      toast.success(`Downloaded all ${processedPages.length} pages!`);
    } catch (error) {
      console.error('Error downloading all pages:', error);
      toast.error('Failed to download some pages');
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
        goToNextPage();
      } else {
        goToPrevPage();
      }
      setTouchStart(null);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, processedPages.length, isTurning]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="text-4xl animate-pulse">📖</div>
      </div>
    );
  }

  const currentPageData = processedPages[currentPage];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white text-2xl bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors"
      >
        ✕
      </button>

      {/* Download buttons */}
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <button
          onClick={downloadCurrentPage}
          className="text-white bg-blue-600/80 hover:bg-blue-700 rounded-full p-3 transition-colors"
          title="Download current page"
        >
          <Download className="h-5 w-5" />
        </button>
        <button
          onClick={downloadAllPages}
          className="text-white bg-green-600/80 hover:bg-green-700 rounded-full p-3 transition-colors relative"
          title="Download all pages"
        >
          <Download className="h-5 w-5" />
          <span className="text-xs absolute -top-1 -right-1 bg-yellow-500 text-black rounded-full h-5 w-5 flex items-center justify-center">
            {processedPages.length}
          </span>
        </button>
      </div>

      <div className="relative w-full h-full flex justify-center items-center p-4">
        {/* Current Page */}
        {currentPageData && (
          <motion.div
            className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center"
            key={currentPage}
            initial={{ opacity: 0, x: isTurning ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {imageError ? (
              <div className="text-white text-center">
                <div className="text-6xl mb-4">🖼️</div>
                <p>Failed to load image</p>
              </div>
            ) : (
              <>
                {/* Main Image */}
                <img 
                  src={currentPageData.image_url} 
                  alt={`Page ${currentPageData.page_number}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error("Error loading image:", currentPageData.image_url);
                    setImageError(true);
                  }}
                />
                
                {/* Text Overlay for Story Pages */}
                {type === 'story' && currentPageData.text && (
                  <div className="absolute bottom-4 left-0 right-0 mx-auto max-w-2xl px-4">
                    <div className="bg-black/70 text-white p-4 rounded-lg text-center backdrop-blur-sm">
                      <p className="text-sm md:text-base">{currentPageData.text}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Navigation Arrows */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-40">
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 0 || isTurning}
          className={`p-3 rounded-full bg-black/50 text-white ${currentPage === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/70 cursor-pointer'} transition-colors`}
          aria-label={t('previousPage')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-40">
        <button
          onClick={goToNextPage}
          disabled={currentPage === processedPages.length - 1 || isTurning}
          className={`p-3 rounded-full bg-black/50 text-white ${currentPage === processedPages.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/70 cursor-pointer'} transition-colors`}
          aria-label={t('nextPage')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Page Counter */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-40">
        <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
          {t('pageCount', {
            current: currentPage + 1,
            total: processedPages.length
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
const MissionCard = ({ 
  mission, 
  completed, 
  videoWatched, 
  onVideoOpen, 
  onManualComplete, 
  t, 
  index,
  missionSlides,
  setOpenSlides
}: { 
  mission: Mission; 
  completed: boolean; 
  videoWatched: boolean; 
  onVideoOpen: (mission: Mission) => void; 
  onManualComplete: (mission: Mission) => void; 
  t: (key: string) => string; 
  index: number;
  missionSlides: Record<string, any[]>;
  setOpenSlides: (slides: {slides: any[], mission: Mission}) => void;
}) => {
  const iconSrc = `/mission-icon-${index + 1}.png`;
  const missionType = mission.mission_type || 'video';
  const hasSlides = missionSlides[mission.id]?.length > 0;
  const hasVideo = mission.video_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="w-full"
    >
      <Card className={`relative overflow-hidden border-2 transition-all w-full h-full
        ${completed ? "border-green-300 bg-green-50" : "border-purple-200 hover:border-purple-300"}`}
      >
        {completed && (
          <div className="absolute top-3 right-3 bg-green-500 text-white p-1 rounded-full">
            <CheckCircle className="h-5 w-5" />
          </div>
        )}

        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <img src={iconSrc} alt="Mission icon" className="h-10 w-10 object-contain" />
            <CardTitle className="text-xl">{mission.title}</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3">
          {/* Content Buttons */}
          <div className="grid gap-2">
            {hasVideo && (
              <Button
                onClick={() => onVideoOpen(mission)}
                className="w-full gap-2 py-4 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Video className="h-5 w-5" />
                <span>{t('watchMagic')}</span>
              </Button>
            )}

            {hasSlides && (
              <Button
                onClick={() => setOpenSlides({ slides: missionSlides[mission.id] || [], mission })}
                className="w-full gap-2 py-4 text-lg bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 text-white"
              >
                <ImageIcon className="h-5 w-5" />
                <span>{t('viewSlides')}</span>
              </Button>
            )}
          </div>

          {/* Complete Mission Button */}
          {!completed ? (
            <Button
              onClick={() => onManualComplete(mission)}
              variant="outline"
              className={`w-full gap-2 py-4 text-lg ${
                (missionType === 'video' && !videoWatched) 
                  ? "border-gray-300 text-gray-400 cursor-not-allowed"
                  : "border-yellow-400 text-yellow-600 hover:bg-yellow-50"
              }`}
              disabled={missionType === 'video' && !videoWatched}
            >
              <Sparkles className="h-5 w-5" />
              <span>
                {missionType === 'video' && !videoWatched 
                  ? t('watchVideoFirst') 
                  : t('completeMission')}
              </span>
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-green-600 text-lg font-semibold p-4 bg-green-100 rounded-lg">
              <Trophy className="h-5 w-5" />
              <span>{t('completed')}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
// Main Component with translations
const MissionsComponent = () => {
  const [missionProgram, setMissionProgram] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [completions, setCompletions] = useState<CompletionData[]>([]);
  const [openVideo, setOpenVideo] = useState<{url: string, mission: Mission} | null>(null);
  const [showDayCompleteModal, setShowDayCompleteModal] = useState(false);
  const [showStorybook, setShowStorybook] = useState(false);
  const [showColoringBook, setShowColoringBook] = useState(false);
  const [storyPages, setStoryPages] = useState<StoryPage[]>([]);
  const [coloringPages, setColoringPages] = useState<ColoringPage[]>([]);
  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookCovers, setBookCovers] = useState<BookCover[]>([]);
  const { language } = useLanguage();
  const [showChildNameModal, setShowChildNameModal] = useState(false);
  const [missionToComplete, setMissionToComplete] = useState<Mission | null>(null);
  const [childNotFound, setChildNotFound] = useState(false);
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({});
  const [videoCompletion, setVideoCompletion] = useState<Record<string, boolean>>({});
  const [openSlides, setOpenSlides] = useState<{slides: any[], mission: Mission} | null>(null);
  const [missionSlides, setMissionSlides] = useState<Record<string, any[]>>({});
  const [nimiContent, setNimiContent] = useState<string>("");
  
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

        // Fetch completions from local storage first
        const storedCompletions = localStorage.getItem('missionCompletions');
        if (storedCompletions) {
          setCompletions(JSON.parse(storedCompletions));
        }

        // Also fetch from database for persistence
        const { data: dbCompletions, error: completionsError } = await supabase
          .from("mission_completions")
          .select("mission_id, completed_at, child_name");

        if (!completionsError && dbCompletions) {
          // Merge with local completions, prioritizing local ones
          setCompletions(prev => {
            const merged = [...prev];
            dbCompletions.forEach(dbCompletion => {
              if (!prev.find(c => c.mission_id === dbCompletion.mission_id)) {
                merged.push(dbCompletion);
              }
            });
            return merged;
          });
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

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Save completions to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('missionCompletions', JSON.stringify(completions));
  }, [completions]);

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

 useEffect(() => {
  if (!missionProgram.length) return;

  const fetchMissionSlides = async () => {
    const missionIds = missionProgram.flatMap(day => day.missions.map(m => m.id));

    const { data, error } = await supabase
      .from("mission_slides")
      .select("*")
      .in("mission_id", missionIds)
      .order("slide_order", { ascending: true });

    if (error) {
      console.error("Failed to fetch slides:", error);
      return;
    }

    const groupedSlides: Record<string, any[]> = {};
    data?.forEach(slide => {
      if (!groupedSlides[slide.mission_id]) groupedSlides[slide.mission_id] = [];
      groupedSlides[slide.mission_id].push(slide);
    });

    setMissionSlides(groupedSlides);
  };

  fetchMissionSlides();
}, [missionProgram]);
  
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

  const handleMissionComplete = async (mission: Mission, childName?: string) => {
    // Check if mission is already completed locally first
    if (completedIds.has(mission.id)) {
      toast.info(t('missionAlreadyCompleted'));
      return;
    }

    try {
      let childId: string | null = null;
      
      // If child name is provided, find or create the child
      if (childName && childName.trim() !== '') {
        const trimmedName = childName.trim();
        
        // First try to find the child by name (get first match if multiple exist)
        const { data: existingChildren, error: findError } = await supabase
          .from('children')
          .select('id')
          .ilike('name', trimmedName)
          .limit(1);

        if (findError) {
          console.error('Error finding child:', findError);
          throw new Error(`Failed to find child: ${findError.message}`);
        }

        if (existingChildren && existingChildren.length > 0) {
          // Child exists, use their ID
          childId = existingChildren[0].id;
          
          // Check if this child has already completed this mission
          const { data: existingCompletion, error: completionError } = await supabase
            .from('mission_completions')
            .select('id')
            .eq('mission_id', mission.id)
            .eq('child_id', childId)
            .maybeSingle();

          if (completionError) {
            console.error('Error checking existing completion:', completionError);
            throw new Error(`Failed to check existing completion: ${completionError.message}`);
          }

          if (existingCompletion) {
            toast.info(t('missionAlreadyCompleted'));
            return;
          }
        } else {
          // Child doesn't exist, create a new child record
          const { data: newChild, error: createError } = await supabase
            .from('children')
            .insert([{ name: trimmedName }])
            .select('id')
            .single();

          if (createError) {
            console.error('Error creating child:', createError);
            throw new Error(`Failed to create child: ${createError.message}`);
          }

          childId = newChild.id;
        }
      } else {
        // For anonymous completions, check if mission is already completed by anyone
        const { data: existingCompletion, error: completionError } = await supabase
          .from('mission_completions')
          .select('id')
          .eq('mission_id', mission.id)
          .is('child_id', null)
          .maybeSingle();

        if (completionError) {
          console.error('Error checking existing completion:', completionError);
          throw new Error(`Failed to check existing completion: ${completionError.message}`);
        }

        if (existingCompletion) {
          toast.info(t('missionAlreadyCompleted'));
          return;
        }
      }

      // Insert completion into Supabase
      const completionData: any = {
        mission_id: mission.id,
        completed_at: new Date().toISOString()
      };

      // Only add child_id if we have one (for anonymous completions, don't set it)
      if (childId) {
        completionData.child_id = childId;
      }

      const { data, error } = await supabase
        .from('mission_completions')
        .insert([completionData])
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate error (unique constraint violation)
        if (error.code === '23505') {
          toast.info(t('missionAlreadyCompleted'));
          return;
        }
        throw new Error(`Supabase error: ${error.message} (code: ${error.code})`);
      }

      // Update local state
      const newCompletion = {
        mission_id: mission.id,
        completed_at: new Date().toISOString(),
        child_name: childName
      };

      setCompletions((prev) => [...prev, newCompletion]);

      // Show success message
      toast.success(t('missionCompleted'));

      // Trigger confetti
      const confetti = await import("canvas-confetti");
      confetti.default({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Check if all missions for the day are completed
      if (currentDayData?.missions.every(m => completedIds.has(m.id) || m.id === mission.id)) {
        setShowDayCompleteModal(true);
      }
    } catch (error) {
      console.error('Error completing mission:', error);
      
      // Extract error message
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast.error(`Failed to complete mission: ${errorMessage}`);
    }
  };

  const handleVideoOpen = (mission: Mission) => {
    setOpenVideo({ url: mission.video_url, mission });
  };

  const handleVideoComplete = (mission: Mission) => {
    setVideoCompletion(prev => ({ ...prev, [mission.id]: true }));
  };

  const handleManualCompletion = (mission: Mission) => {
    // Check if video was watched to completion (for video missions)
    if (mission.mission_type === 'video' && !videoCompletion[mission.id]) {
      toast.error(t('pleaseWatchVideo'));
      return;
    }

    // Check if already completed
    if (completedIds.has(mission.id)) {
      toast.info(t('missionAlreadyCompleted'));
      return;
    }

    // Show child name modal
    setMissionToComplete(mission);
    setShowChildNameModal(true);
  };

  const handleOpenStorybook = () => {
    setShowStorybook(true);
  };

  const handleCloseStorybook = () => {
    setShowStorybook(false);
  };

  const handleOpenColoringBook = () => {
    setShowColoringBook(true);
  };

  const handleCloseColoringBook = () => {
    setShowColoringBook(false);
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

        <div className="flex overflow-x-auto pb-4 gap-3 px-4 scrollbar-thin w-full max-w-6xl mx-auto">
          {missionProgram.slice(0, 7).map(day => (
            <motion.button
              key={day.day}
              onClick={() => setSelectedDay(day.day)}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center p-3 md:p-4 rounded-xl min-w-[80px] md:min-w-[100px] transition-all flex-shrink-0
                ${selectedDay === day.day
                  ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg"
                  : "bg-white shadow-md hover:shadow-lg"}`}
            >
              <motion.span 
                className="text-3xl md:text-4xl"
                animate={selectedDay === day.day ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {day.emoji}
              </motion.span>
              <span className="text-base md:text-lg font-bold mt-1">Day {day.day}</span>
            </motion.button>
          ))}
        </div>
      </section>
      {audioTrack && <MorningVideoCard video={audioTrack} t={t} />}
      {/* Missions Grid */}
      {currentDayData?.missions.length ? (
        <section className="max-w-2xl mx-auto px-4 w-full">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 w-full">
            {currentDayData.missions.map((mission, index) => {
              const completed = completedIds.has(mission.id);
              const videoWatched = videoCompletion[mission.id];

              return (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  completed={completed}
                  videoWatched={videoWatched}
                  onVideoOpen={handleVideoOpen}
                  onManualComplete={handleManualCompletion}
                  t={t}
                  index={index}
                  missionSlides={missionSlides}
                  setOpenSlides={setOpenSlides}
                />
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
            onOpen={handleOpenStorybook}
            pageCount={storyPages.length}
            coverData={bookCovers.find(c => c.day === selectedDay && c.cover_type === 'story')}
            type="story"
            t={t}
          />
        )}
        
        {coloringPages.length > 0 && (
          <BookCard 
            day={selectedDay}
            onOpen={handleOpenColoringBook}
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
            handleMissionComplete(missionToComplete, childName);
          }
          setShowChildNameModal(false);
          setMissionToComplete(null);
        }}
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
          <SinglePageBookViewer 
            pages={storyPages.map(page => ({
              image_url: page.image_url,
              page_number: page.page_number,
              text: page.text
            }))}
            onClose={handleCloseStorybook}
            type="story"
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Coloring Book Viewer */}
      <AnimatePresence>
        {showColoringBook && coloringPages.length > 0 && (
          <SinglePageBookViewer 
            pages={coloringPages.map(page => ({
              image_url: page.image_url,
              page_number: page.page_number
            }))}
            onClose={handleCloseColoringBook}
            type="coloring"
            t={t}
          />
        )}
      </AnimatePresence>

    {/* Video Player */}
      <AnimatePresence>
        {openVideo && (
          <VideoPlayerModal 
            videoUrl={openVideo.url}
            onClose={() => setOpenVideo(null)}
            mission={openVideo.mission}
            onMissionComplete={handleVideoComplete}
            t={t}
          />
        )}
      </AnimatePresence>

   {/* Slides Modal */}
    <AnimatePresence>
      {openSlides && (
        <SlidesModal
          slides={openSlides.slides}
          mission={openSlides.mission}
          onClose={() => setOpenSlides(null)}
          onMissionComplete={handleMissionComplete}
          t={t}
        />
      )}
    </AnimatePresence>
{/* Nimi Reader Button */}
<NimiReaderButton hide={!!openSlides || showStorybook || showColoringBook} />


    </>
  );
};

export default MissionsComponent;