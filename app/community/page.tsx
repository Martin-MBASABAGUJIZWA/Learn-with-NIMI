"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreationCard from "@/components/CreationCard";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import Footer from "@/components/Footer";
import NimiChat from "@/components/NimiChat";
import { MessageCircle, Heart, Star, Upload, Camera, Mic, Crown, Sparkles, Trophy, Send, X, Lock, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";

// -------------------
// Interfaces and Store
// -------------------

interface CommentType {
  id: number;
  creationId: number;
  author: string;
  content: string;
  createdAt?: string;
}

interface Creation {
  id: number;
  childName: string;
  age: number;
  creation: string;
  type: string;
  likes: number;
  image: string;
  mission: string;
  emoji: string;
  comments?: CommentType[];
  isPublic: boolean;
  createdAt?: string;
  sharedWith?: string[];
}

interface PikoPal {
  name: string;
  age: number;
  achievements: number;
  streak: number;
  avatar: string;
  title: string;
}

interface CreationsState {
  creations: Creation[];
  pikopals: PikoPal[];
  loadingCreations: boolean;
  loadingPals: boolean;
  errorCreations: boolean;
  errorPals: boolean;
  page: number;
  totalPages: number;
  filterMission: string | null;
  sortBy: "likes" | "recency" | null;
  privacyFilter: "all" | "public" | "private";
  addCreations: (newCreations: Creation[], page?: number, totalPages?: number) => void;
  resetCreations: () => void;
  likeCreation: (id: number) => void;
  addComment: (creationId: number, comment: CommentType) => void;
  setFilterMission: (mission: string | null) => void;
  setSortBy: (sort: "likes" | "recency" | null) => void;
  setPrivacyFilter: (filter: "all" | "public" | "private") => void;
  setPage: (page: number) => void;
  setPikopals: (pals: PikoPal[]) => void;
  setLoadingCreations: (val: boolean) => void;
  setLoadingPals: (val: boolean) => void;
  setErrorCreations: (val: boolean) => void;
  setErrorPals: (val: boolean) => void;
  addSharedWith: (creationId: number, contact: string) => void;
}

const useCreationsStore = create<CreationsState>((set) => ({
  creations: [],
  pikopals: [],
  loadingCreations: true,
  loadingPals: true,
  errorCreations: false,
  errorPals: false,
  page: 1,
  totalPages: 1,
  filterMission: null,
  sortBy: null,
  privacyFilter: "all",
  addCreations: (newCreations, page, totalPages) => {
    set((state) => ({
      creations: page && page > 1 ? [...state.creations, ...newCreations] : newCreations,
      page: page || 1,
      totalPages: totalPages || state.totalPages,
      loadingCreations: false,
      errorCreations: false,
    }));
  },
  resetCreations: () => set({ creations: [], page: 1, totalPages: 1, loadingCreations: true }),
  likeCreation: (id) => {
    set((state) => ({
      creations: state.creations.map((c) => 
        c.id === id ? { ...c, likes: c.likes + 1 } : c
      )
    }));
  },
  addComment: (creationId, comment) => {
    set((state) => ({
      creations: state.creations.map((c) => {
        if (c.id === creationId) {
          const existingComments = c.comments || [];
          return { ...c, comments: [...existingComments, comment] };
        }
        return c;
      })
    }));
  },
  addSharedWith: (creationId, contact) => {
    set((state) => ({
      creations: state.creations.map((c) => {
        if (c.id === creationId) {
          const existingShared = c.sharedWith || [];
          return { ...c, sharedWith: [...existingShared, contact] };
        }
        return c;
      })
    }));
  },
  setFilterMission: (mission) => set({ filterMission: mission }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setPrivacyFilter: (filter) => set({ privacyFilter: filter }),
  setPage: (page) => set({ page }),
  setPikopals: (pals) => set({ pikopals: pals, loadingPals: false, errorPals: false }),
  setLoadingCreations: (val) => set({ loadingCreations: val }),
  setLoadingPals: (val) => set({ loadingPals: val }),
  setErrorCreations: (val) => set({ errorCreations: val }),
  setErrorPals: (val) => set({ errorPals: val }),
}));

// -------------------
// Main Component
// -------------------
export default function CommunityPage() {
  const {
    creations,
    pikopals,
    addCreations,
    resetCreations,
    likeCreation,
    addComment,
    addSharedWith,
    page,
    totalPages,
    setPage,
    filterMission,
    setFilterMission,
    sortBy,
    setSortBy,
    privacyFilter,
    setPrivacyFilter,
    loadingCreations,
    loadingPals,
    errorCreations,
    errorPals,
    setPikopals,
    setLoadingCreations,
    setLoadingPals,
    setErrorCreations,
    setErrorPals,
  } = useCreationsStore();

  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNimiChat, setShowNimiChat] = useState(false);
  const [nimiMessage, setNimiMessage] = useState("Want to show your drawing? I'll help you!");
  const [celebrations, setCelebrations] = useState<{id: number, tag: string}[]>([]);
  const childNameFromContext = "Emma";
  const creationsContainerRef = useRef<HTMLDivElement>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [friendOfTheWeek, setFriendOfTheWeek] = useState<PikoPal | null>(null);

  const fetchCreations = useCallback(async (pageToLoad = 1) => {
    setLoadingCreations(true);
    try {
      const params = new URLSearchParams();
      params.append("page", pageToLoad.toString());
      if (filterMission) params.append("mission", filterMission);
      if (sortBy) params.append("sortBy", sortBy);
      if (privacyFilter !== "all") params.append("isPublic", privacyFilter === "public" ? "true" : "false");
      params.append("ageMin", "2");
      params.append("ageMax", "4");

      const res = await fetch(`/api/creations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load creations");
      const data = await res.json();
      
      const filteredCreations = data.creations.filter((c: Creation) => c.age >= 2 && c.age <= 4);
      addCreations(filteredCreations, pageToLoad, data.totalPages);

      // Add celebration tags for new creations
      if (pageToLoad === 1) {
        const newCelebrations = filteredCreations.slice(0, 3).map((c: Creation) => ({
          id: c.id,
          tag: ["Bravo!", "Amazing!", "Wow!"][Math.floor(Math.random() * 3)]
        }));
        setCelebrations(newCelebrations);
      }
    } catch {
      setErrorCreations(true);
    } finally {
      setLoadingCreations(false);
    }
  }, [filterMission, sortBy, privacyFilter]);

  const fetchPikoPals = useCallback(async () => {
    setLoadingPals(true);
    try {
      const res = await fetch("/api/pikopals?ageMin=2&ageMax=4");
      if (!res.ok) throw new Error("Failed to load piko pals");
      const data = await res.json();
      const filteredPals = data.pikopals.filter((p: PikoPal) => p.age >= 2 && p.age <= 4);
      setPikopals(filteredPals);
      
      // Set a random friend of the week
      if (filteredPals.length > 0) {
        setFriendOfTheWeek(filteredPals[Math.floor(Math.random() * filteredPals.length)]);
      }
    } catch {
      setErrorPals(true);
    } finally {
      setLoadingPals(false);
    }
  }, []);

  useEffect(() => {
    resetCreations();
    fetchCreations(1);
    fetchPikoPals();
  }, [fetchCreations, fetchPikoPals, resetCreations]);

  useEffect(() => {
    const container = creationsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 200 &&
          !loadingCreations && !isFetchingMore && page < totalPages) {
        setIsFetchingMore(true);
        fetchCreations(page + 1).finally(() => setIsFetchingMore(false));
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [fetchCreations, isFetchingMore, loadingCreations, page, totalPages]);

  const handleUploadSuccess = (newCreation: Creation) => {
    addCreations([newCreation], 1);
    setShowUploadModal(false);
    
    // Add celebration for the new creation
    const newCelebration = {
      id: newCreation.id,
      tag: ["Yay!", "Great job!", "Beautiful!"][Math.floor(Math.random() * 3)]
    };
    setCelebrations([...celebrations, newCelebration]);
    
    // Trigger Nimi celebration
    setNimiMessage(`Wow ${childNameFromContext}! I love your ${newCreation.type}!`);
    setShowNimiChat(true);
  };

  const handleLoveCreation = async (creationId: number) => {
    likeCreation(creationId);
    try {
      await fetch(`/api/creations/${creationId}/like`, { method: "POST" });
      
      // Add heart animation celebration
      const newCelebration = {
        id: creationId,
        tag: "❤️ Loved!"
      };
      setCelebrations([...celebrations, newCelebration]);
    } catch (err) {
      console.error("Error liking creation:", err);
    }
  };

  const handleAddComment = async (creationId: number, content: string) => {
    try {
      const res = await fetch(`/api/creations/${creationId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      const comment: CommentType = await res.json();
      addComment(creationId, comment);
      
      // Add comment celebration
      const newCelebration = {
        id: creationId,
        tag: "💬 Commented!"
      };
      setCelebrations([...celebrations, newCelebration]);
    } catch (err) {
      alert("Failed to add comment. Please try again.");
    }
  };

  const handleSharePrivate = async (creationId: number, contacts: string[]) => {
    try {
      const res = await fetch(`/api/creations/${creationId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts }),
      });
      if (!res.ok) throw new Error("Failed to share creation");
      
      contacts.forEach(contact => {
        addSharedWith(creationId, contact);
      });
      
      // Add share celebration
      const newCelebration = {
        id: creationId,
        tag: "📤 Shared!"
      };
      setCelebrations([...celebrations, newCelebration]);
    } catch (err) {
      console.error("Error sharing creation:", err);
    }
  };

  const uniqueMissions = Array.from(new Set(creations.map(c => c.mission))).filter(Boolean);

  const SkeletonCard = () => (
    <div className="animate-pulse bg-white rounded-lg h-64 shadow-lg" />
  );

  const triggerNimiCelebration = (message: string) => {
    setNimiMessage(message);
    setShowNimiChat(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-900">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {["💖", "🌟", "🎈", "✨"].map((emoji, i) => (
          <div 
            key={i}
            className={`absolute text-2xl select-none animate-bounce`}
            style={{
              top: `${20 + i * 10}%`,
              left: `${10 + i * 20}%`,
              animationDelay: `${i * 0.5}s`,
              color: i % 2 ? "#f472b6" : "#60a5fa"
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Piko Community
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            Share and celebrate your amazing creations with friends!
          </p>
          
          {/* Nimi AI Prompt */}
          <div 
            className="bg-white/80 rounded-xl p-4 max-w-md mx-auto shadow-lg cursor-pointer hover:shadow-xl transition-all"
            onClick={() => {
              setNimiMessage("Want to show your drawing? I'll help you!");
              setShowNimiChat(true);
            }}
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="bg-pink-100 p-2 rounded-full">
                <MessageCircle className="w-6 h-6 text-pink-600" />
              </div>
              <span className="font-medium">Hear from Nimi</span>
            </div>
          </div>
        </div>

        {/* Upload Card - Simplified for Kids */}
        <Card className="mb-8 bg-gradient-to-r from-pink-100 to-purple-100 border-none shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-200 rounded-full opacity-20"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-200 rounded-full opacity-20"></div>
          
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <Sparkles className="w-8 h-8 mr-3 text-pink-600" />
              <span>Show My Drawing!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-gray-700 mb-6">
              Let's share your artwork with friends! Tap the button below.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => {
                  setNimiMessage("Let's share your drawing! Tap the camera to take a photo or choose one from your gallery.");
                  setShowNimiChat(true);
                  setShowUploadModal(true);
                }}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
              >
                <Camera className="w-6 h-6 mr-3" />📷 Show My Art
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Friend of the Week Spotlight */}
        {friendOfTheWeek && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-100 to-orange-100 border-none shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-300 rounded-bl-full opacity-30"></div>
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-2xl">
                <Sparkles className="w-8 h-8 mr-3 text-yellow-600" />
                <span>🌟 Friend of the Week</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="text-8xl mb-4 animate-bounce" style={{ animationDelay: '0.2s' }}>
                  {friendOfTheWeek.avatar}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{friendOfTheWeek.name}</h3>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-3">
                  {friendOfTheWeek.title}
                </Badge>
                <p className="text-center text-gray-700 mb-4">
                  Let's celebrate {friendOfTheWeek.name}'s amazing creations this week!
                </p>
                <Button 
                  variant="outline" 
                  className="border-pink-500 text-pink-600 hover:bg-pink-50"
                  onClick={() => {
                    setNimiMessage(`Say hello to ${friendOfTheWeek.name}, our Friend of the Week! 🌟`);
                    setShowNimiChat(true);
                  }}
                >
                  <Sparkles className="w-5 h-5 mr-2" /> Celebrate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Creations Gallery */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
            <Sparkles className="w-8 h-8 mr-3 text-pink-500" />
            🎨 Our Gallery
            <Heart className="w-8 h-8 ml-3 text-red-500" />
          </h2>
          
          {/* Simple Filter for Kids */}
          <div className="flex justify-center mb-6 space-x-2">
            <Button
              variant={filterMission === null ? "default" : "outline"}
              onClick={() => setFilterMission(null)}
              className="rounded-full"
            >
              All
            </Button>
            {uniqueMissions.slice(0, 3).map((mission) => (
              <Button
                key={mission}
                variant={filterMission === mission ? "default" : "outline"}
                onClick={() => setFilterMission(mission)}
                className="rounded-full"
              >
                {mission}
              </Button>
            ))}
          </div>
          
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[600px] overflow-y-auto"
            ref={creationsContainerRef}
          >
            {loadingCreations && creations.length === 0 ? (
              Array(6).fill(null).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              creations
                .filter(c => filterMission ? c.mission === filterMission : true)
                .filter(c => privacyFilter === "all" ? true : privacyFilter === "public" ? c.isPublic : !c.isPublic)
                .sort((a, b) => {
                  if (sortBy === "likes") return b.likes - a.likes;
                  if (sortBy === "recency") {
                    if (a.createdAt && b.createdAt) {
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    }
                    return b.id - a.id;
                  }
                  return 0;
                })
                .map(creation => (
                  <div key={creation.id} className="relative">
                    <CreationCard
                      creation={creation}
                      onLike={handleLoveCreation}
                      onComment={handleAddComment}
                      onClick={setSelectedCreation}
                      onShare={handleSharePrivate}
                      simpleView={true}
                    />
                    
                    {/* Celebration Tags */}
                    {celebrations.find(c => c.id === creation.id) && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        className="absolute -top-3 -right-3 bg-yellow-100 border-2 border-yellow-300 px-3 py-1 rounded-full shadow-lg z-10"
                      >
                        <span className="font-bold text-yellow-700">
                          {celebrations.find(c => c.id === creation.id)?.tag}
                        </span>
                      </motion.div>
                    )}
                  </div>
                ))
            )}
            {loadingCreations && creations.length > 0 && (
              <div className="absolute bottom-0 left-0 w-full text-center text-gray-500 p-2">
                Loading more creations...
              </div>
            )}
          </div>
          {errorCreations && (
            <p className="mt-4 text-center text-red-600">
              Error loading creations. Please try again.
            </p>
          )}
        </div>

        {/* Simple Hall of Fame */}
        <Card className="mb-8 bg-gradient-to-r from-yellow-100 to-orange-100 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <Crown className="w-8 h-8 mr-3 text-yellow-600" />🌟 Our Stars
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPals ? (
              <p className="text-center text-gray-600 animate-pulse">Loading...</p>
            ) : errorPals ? (
              <p className="text-center text-red-600">Error loading Piko Pals</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pikopals.slice(0, 3).map((pal) => (
                  <div
                    key={pal.name}
                    className="text-center p-6 bg-white/80 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                    onClick={() => {
                      setNimiMessage(`This is ${pal.name}! ${pal.name} is a ${pal.title.toLowerCase()}!`);
                      setShowNimiChat(true);
                    }}
                  >
                    <div className="text-6xl mb-4 animate-bounce" style={{ animationDelay: '0.2s' }}>
                      {pal.avatar}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{pal.name}</h3>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-3">
                      {pal.title}
                    </Badge>
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
            )}
          </CardContent>
        </Card>

        <NimiChat />


        {/* Coming Soon Section */}
        <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-none shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Coming Soon!</h3>
            <p className="text-gray-700 mb-6">More fun ways to learn and play with friends!</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
      <BottomNavigation />
    </div>
  );
}