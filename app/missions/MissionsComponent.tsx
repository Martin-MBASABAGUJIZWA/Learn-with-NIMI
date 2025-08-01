'use client';

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";
import supabase from "@/lib/supabaseClient";
import { Howl } from "howler";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import NimiAssistant from "@/components/NimiAssistant";
import { useUser } from "@/contexts/UserContext";
import { CheckCircle, Play, Trophy, Sparkles, Volume2, BookOpen } from "lucide-react";

// Initialize PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

// Audio Constants
const MORNING_SONG = new Howl({
  src: ["/sounds/morning-song.mp3"],
  volume: 0.5
});

interface Mission {
  id: string;
  day_number: number;
  title: string;
  description: string;
  duration: string;
  points: number;
  video_url: string;
  order: number;
  theme?: string;
  emoji?: string;
  archived: boolean;
}

interface DayData {
  day: number;
  title: string;
  theme: string;
  emoji: string;
  missions: Mission[];
}

interface CompletionData {
  mission_id: string;
  completed_at: string;
}

const MusicPlayerCard = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    isPlaying ? MORNING_SONG.pause() : MORNING_SONG.play();
  };

  return (
    <motion.div 
      className="bg-gradient-to-r from-purple-100 to-blue-100 p-3 md:p-4 rounded-xl mb-4 md:mb-6 border-2 border-yellow-300 w-full max-w-[400px] mx-auto"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-center gap-3 md:gap-4">
        <button 
          onClick={togglePlay}
          className="p-2 md:p-3 bg-white rounded-full shadow-md flex-shrink-0"
          aria-label={isPlaying ? "Pause music" : "Play music"}
        >
          <Volume2 className={`h-6 w-6 md:h-8 md:w-8 ${isPlaying ? 'text-purple-600' : 'text-gray-500'}`} />
        </button>
        <span className="text-lg md:text-xl font-bold truncate">Magic Song</span>
      </div>
    </motion.div>
  );
};

const VideoPlayerModal = ({ videoUrl, onClose }: { videoUrl: string; onClose: () => void }) => {
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
        
        <div className="w-full h-full">
          <iframe
            src={videoUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="eager"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

const SimplePDFViewer = ({ pdfUrl, onClose }: { pdfUrl: string; onClose: () => void }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfData, setPdfData] = useState<Uint8Array | string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(800);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const urlParts = pdfUrl.replace('supabase://', '').split('/');
        const bucket = urlParts[0];
        const path = urlParts.slice(1).join('/');
        
        const { data, error: fetchError } = await supabase.storage
          .from(bucket)
          .download(path);
          
        if (fetchError) throw fetchError;
        
        const objectUrl = URL.createObjectURL(data);
        setPdfData(objectUrl);
        
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load storybook. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (pdfUrl?.startsWith('supabase://')) {
      fetchPdf();
    } else if (pdfUrl) {
      setPdfData(pdfUrl);
      setIsLoading(false);
    }

    return () => {
      if (pdfData && typeof pdfData === 'string') {
        URL.revokeObjectURL(pdfData);
      }
    };
  }, [pdfUrl]);

  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    setPageNumber(newPage);
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-white rounded-xl p-3 md:p-6 w-full max-w-[95vw] h-[90vh] max-h-[90vh] overflow-auto relative"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl md:text-3xl bg-white/80 rounded-full p-1"
          aria-label="Close storybook"
        >
          ✕
        </button>

        {error ? (
          <div className="text-red-500 p-4 text-center h-full flex flex-col items-center justify-center">
            {error}
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="h-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="text-4xl"
            >
              📖
            </motion.div>
          </div>
        ) : (
          <>
            <Document
              file={pdfData}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                setIsLoading(false);
              }}
              loading={
                <div className="h-full flex items-center justify-center">
                  <div className="text-4xl">✨</div>
                </div>
              }
              error={<div className="text-red-500 p-4 h-full flex items-center justify-center">Failed to load PDF content</div>}
            >
              <Page
                pageNumber={pageNumber}
                width={Math.min(800, windowWidth * 0.9)}
                loading={
                  <div className="h-full flex items-center justify-center">
                    <div className="text-4xl">🔍</div>
                  </div>
                }
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>

            <div className="flex justify-between items-center mt-4 sticky bottom-0 bg-white py-2 border-t">
              <Button
                onClick={() => handlePageChange(Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1 || isLoading}
                variant="outline"
                className="text-sm md:text-base px-3 py-1 md:px-4 md:py-2"
              >
                Previous
              </Button>
              <span className="text-sm md:text-base text-gray-600 mx-2">
                Page {pageNumber} of {numPages}
              </span>
              <Button
                onClick={() => handlePageChange(Math.min(numPages, pageNumber + 1))}
                disabled={pageNumber >= numPages || isLoading}
                variant="outline"
                className="text-sm md:text-base px-3 py-1 md:px-4 md:py-2"
              >
                Next
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

const StorybookCard = ({ day, onOpen }: { day: number; onOpen: () => void }) => (
  <motion.div
    className="bg-gradient-to-br from-yellow-100 to-pink-100 p-4 md:p-6 rounded-2xl border-4 border-purple-300 shadow-xl mb-6 md:mb-8 w-full max-w-2xl mx-auto"
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    whileHover={{ y: -5 }}
  >
    <div className="flex flex-col items-center text-center gap-3 md:gap-4">
      <motion.div 
        className="text-5xl md:text-6xl"
        animate={{ 
          rotate: [0, 10, -10, 0],
          y: [0, -10, 0]
        }}
        transition={{ repeat: Infinity, duration: 4 }}
      >
        📚
      </motion.div>
      <h3 className="text-xl md:text-2xl font-bold text-purple-800">Today's Storybook</h3>
      <p className="text-base md:text-lg">Read our special story for Day {day}</p>
      <Button
        onClick={onOpen}
        className="gap-2 text-base md:text-lg py-3 md:py-4 px-4 md:px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white w-full max-w-xs"
      >
        <BookOpen className="h-5 w-5 md:h-6 md:w-6" />
        Open Story
      </Button>
    </div>
  </motion.div>
);

const MissionsComponent = () => {
  const [missionProgram, setMissionProgram] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [completions, setCompletions] = useState<CompletionData[]>([]);
  const [openVideo, setOpenVideo] = useState<string | null>(null);
  const [showDayCompleteModal, setShowDayCompleteModal] = useState(false);
  const [showFlipbook, setShowFlipbook] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState("");
  const { user } = useUser();

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: missions, error: missionsError } = await supabase
          .from("daily_missions")
          .select("*")
          .order("day_number", { ascending: true })
          .order("order", { ascending: true });

        if (missionsError) throw missionsError;

        if (missions) {
          setMissionProgram(groupMissionsByDay(missions));
        }

        if (user?.id) {
          const { data: completions, error: completionsError } = await supabase
            .from("mission_completions")
            .select("*")
            .eq("user_id", user.id);

          if (completionsError) throw completionsError;
          setCompletions(completions || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [user]);

  // Helper Functions
  const groupMissionsByDay = (missions: Mission[]) => {
    const active = missions.filter((m) => !m.archived);
    const grouped: Record<number, DayData> = {};

    active.forEach((m) => {
      if (!grouped[m.day_number]) {
        grouped[m.day_number] = {
          day: m.day_number,
          title: `Day ${m.day_number}`,
          theme: m.theme || "Magical Learning",
          emoji: m.emoji || "✨",
          missions: [],
        };
      }
      grouped[m.day_number].missions.push(m);
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

  const completeMission = async (mission: Mission) => {
    const newCompletion = {
      mission_id: mission.id,
      completed_at: new Date().toISOString(),
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
      const { data } = await supabase
        .from('day_rewards')
        .select('pdf_url')
        .eq('day_number', selectedDay)
        .single();

      setCurrentPdfUrl(data?.pdf_url || `/flipbooks/day${selectedDay}.pdf`);
      setShowDayCompleteModal(true);
    }
  };

  return (
    <>
      {/* Day Selection */}
      <section className="mb-4 sm:mb-6 md:mb-8 w-full">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-3 sm:mb-4 md:mb-6 select-none">
          <motion.span 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5 }}
            className="inline-block mr-2 sm:mr-3"
          >
            {currentDayData?.emoji || "✨"}
          </motion.span>
          {currentDayData?.theme}
        </h2>

        <div className="flex overflow-x-auto pb-2 sm:pb-3 gap-2 sm:gap-3 md:gap-4 px-2 sm:px-3 scrollbar-thin w-full">
          {missionProgram.slice(0, 7).map(day => (
            <motion.button
              key={day.day}
              onClick={() => setSelectedDay(day.day)}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center p-2 sm:p-3 md:p-4 rounded-xl min-w-[70px] sm:min-w-[80px] md:min-w-[100px] transition-all flex-shrink-0
                ${selectedDay === day.day
                  ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg"
                  : "bg-white shadow-md hover:shadow-lg"}`}
            >
              <motion.span 
                className="text-2xl sm:text-3xl md:text-4xl"
                animate={selectedDay === day.day ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {day.emoji}
              </motion.span>
              <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold">Day {day.day}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Music Player & Nimi Assistant */}
      <div className="max-w-md mx-auto mb-4 sm:mb-6 space-y-3 sm:space-y-4 w-full px-2">
        <MusicPlayerCard />
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
        <section className="max-w-2xl mx-auto px-1 sm:px-2 w-full">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 w-full">
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
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-green-500 text-white p-1 rounded-full">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                      </div>
                    )}

                    <CardHeader className="pb-1 sm:pb-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-3xl sm:text-4xl md:text-5xl">{icon}</span>
                        <CardTitle className="text-lg sm:text-xl md:text-2xl">{mission.title}</CardTitle>
                      </div>
                    </CardHeader>

                    <CardContent className="grid gap-2 sm:gap-3">
                      <Button
                        onClick={() => setOpenVideo(mission.video_url)}
                        className="w-full gap-2 sm:gap-3 py-2 sm:py-3 md:py-4 text-base sm:text-lg md:text-xl min-h-[50px] sm:min-h-[60px] md:min-h-[64px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                      >
                        <Play className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                        <span>Watch Magic</span>
                      </Button>

                      {!completed ? (
                        <Button
                          onClick={() => completeMission(mission)}
                          variant="outline"
                          className="w-full gap-2 sm:gap-3 py-2 sm:py-3 md:py-4 text-base sm:text-lg md:text-xl min-h-[50px] sm:min-h-[60px] md:min-h-[64px] border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                        >
                          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                          <span>Complete Mission</span>
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 sm:gap-3 text-green-600 text-base sm:text-lg md:text-xl font-semibold p-2 sm:p-3 md:p-4 bg-green-100 rounded-lg">
                          <Trophy className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                          <span>Completed!</span>
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
        <div className="text-center py-12 sm:py-16 md:py-20 text-gray-600 text-base sm:text-lg md:text-lg w-full">
          ✨ Preparing tomorrow's magic... ✨
        </div>
      )}

      {/* Storybook Card - Added below all missions */}
      {currentDayData && (
        <div className="max-w-2xl mx-auto mt-4 sm:mt-6 md:mt-8 w-full px-2">
          <StorybookCard 
            day={selectedDay} 
            onOpen={() => {
              supabase
                .from('day_rewards')
                .select('pdf_url')
                .eq('day_number', selectedDay)
                .single()
                .then(({ data }) => {
                  setCurrentPdfUrl(data?.pdf_url || `/flipbooks/day${selectedDay}.pdf`);
                  setShowFlipbook(true);
                });
            }}
          />
        </div>
      )}

      {/* Day Complete Modal */}
      <AnimatePresence>
        {showDayCompleteModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl p-4 sm:p-6 md:p-8 shadow-xl text-center w-full max-w-[90%] sm:max-w-md border-2 border-blue-300 relative overflow-hidden"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="absolute -top-6 -left-6 sm:-top-8 sm:-left-8 text-4xl sm:text-5xl opacity-20">🏆</div>
              <div className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8 text-4xl sm:text-5xl opacity-20">🎉</div>
              
              <motion.div
                className="text-4xl sm:text-5xl mb-3 sm:mb-4 mx-auto w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20"
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

              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 md:mb-4 text-blue-800">Day Complete!</h2>
              <p className="text-sm sm:text-base md:text-lg mb-3 sm:mb-4 md:mb-6">You mastered Day {selectedDay}'s magic!</p>

              <Button
                onClick={() => {
                  setShowDayCompleteModal(false);
                }}
                className="gap-2 text-sm sm:text-base md:text-lg py-2 sm:py-3 w-full max-w-xs mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              >
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Viewer */}
      <AnimatePresence>
        {showFlipbook && currentPdfUrl && (
          <SimplePDFViewer 
            pdfUrl={currentPdfUrl}
            onClose={() => setShowFlipbook(false)}
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