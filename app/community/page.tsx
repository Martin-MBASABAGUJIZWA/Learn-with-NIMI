"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, Camera, Share2, MessageCircle, Heart } from "lucide-react";
import { CreationCard } from "@/components/community/CreationCard";
import { UploadModal } from "@/components/community/UploadModal";
import { NimiChat } from "@/components/community/NimiChat";
import { CelebrationBanner } from "@/components/community/CelebrationBanner";
import { ErrorToast } from "@/components/community/ErrorToast";
import { Creation, PikoPal, UserMessage } from "@/components/community/types";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import Footer from "@/components/Footer";

const CommunityPage = () => {
  const supabase = createClientComponentClient();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [pikopals, setPikopals] = useState<PikoPal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [nimiMessages, setNimiMessages] = useState<UserMessage[]>([
    { sender: 'nimi', text: "Hello friend! I'm Nimi!\n\nWhat's on your mind today?" }
  ]);
  const [isNimiTyping, setIsNimiTyping] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  const [currentUser, setCurrentUser] = useState({
    id: "",
    name: "Guest",
    avatar: "👤",
    avatarUrl: ""
  });

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    childName: "",
    age: "",
    description: "",
    isPublic: true,
    imageFile: null as File | null,
    previewUrl: "",
    uploadProgress: 0,
    isUploading: false,
    shareMethod: 'public' as 'public' | 'whatsapp'
  });

  // Generate unique ID
  const generateUniqueId = () => uuidv4();

  // Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Try both 'users' and 'profiles' tables
          let profileData = null;
          
          // First try 'users' table
          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("auth_user_id", user.id)
            .maybeSingle();

          if (userData) {
            profileData = userData;
          } else {
            // Fallback to 'profiles' table
            const { data: profileDataFromProfiles } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .maybeSingle();
            
            profileData = profileDataFromProfiles;
          }

          if (profileData) {
            setCurrentUser({
              id: user.id,
              name: profileData.full_name || user.email?.split("@")[0] || "User",
              avatar: profileData.avatar_url || "👤",
              avatarUrl: profileData.avatar_url || ""
            });
          }
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    getCurrentUser();
  }, [supabase]);

  // Fetch public creations
  const fetchCreations = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try different table structures
      let query = supabase
        .from("creations")
        .select(`
          *,
          comments:comments(*),
          likes:likes(*)
        `)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Format creations based on available data
      const formattedCreations: Creation[] = data.map((c: any) => ({
        id: c.id,
        childId: c.child_id,
        childName: c.child_name || "Unknown",
        age: c.age,
        description: c.description,
        imageUrl: c.image_url,
        likes: c.likes?.length || c.likes_count || 0,
        likedByUser: c.likes?.some((l: any) => l.user_id === currentUser.id) || false,
        isPublic: c.is_public !== undefined ? c.is_public : true,
        type: c.type || "art",
        completionStatus: c.completion_status || "completed",
        createdAt: c.created_at,
        comments: c.comments || []
      }));

      setCreations(formattedCreations);
    } catch (err) {
      setError("Couldn't load creations.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, supabase]);

  useEffect(() => {
    fetchCreations();
  }, [fetchCreations]);

  // Fetch Pikopals (featured children)
  const fetchPikopals = useCallback(async () => {
    try {
      // Try different table structures
      let query = supabase
        .from("children")
        .select(`
          id, name, age, points, streak, avatar,
          creations:creations(count)
        `)
        .order("points", { ascending: false })
        .limit(1);

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const child = data[0];
        const achievements = child.creations?.[0]?.count || 0;
        
        setPikopals([{
          id: child.id,
          name: child.name,
          age: parseInt(child.age) || 0,
          achievements,
          streak: child.streak || 0,
          avatar: child.avatar || "👦",
          avatarUrl: child.avatar || "",
          title: achievements > 10 ? "Master Creator" : achievements > 5 ? "Creative Explorer" : "Rising Star",
        }]);
      }
    } catch (err) {
      console.error("Error fetching pikopals:", err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPikopals();
  }, [fetchPikopals]);

  // Celebration animation
  const triggerCelebration = useCallback((text: string) => {
    setCelebrationText(text);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  }, []);

  // Handle like/unlike
  const handleLike = useCallback(async (creationId: string) => {
    try {
      const creation = creations.find(c => c.id === creationId);
      if (!creation) return;

      const newLikeState = !creation.likedByUser;

      // Optimistic update
      setCreations(prev => prev.map(c => c.id === creationId ? {
        ...c,
        likedByUser: newLikeState,
        likes: newLikeState ? c.likes + 1 : c.likes - 1
      } : c));

      if (newLikeState) {
        await supabase.from("likes").insert({ creation_id: creationId, user_id: currentUser.id });
      } else {
        await supabase.from("likes").delete().eq("creation_id", creationId).eq("user_id", currentUser.id);
      }

      if (newLikeState && creation) {
        triggerCelebration(`You liked ${creation.childName}'s creation!`);
      }
    } catch (err) {
      console.error(err);
      setError("Couldn't update like.");
      fetchCreations(); // rollback
    }
  }, [creations, currentUser.id, fetchCreations, supabase, triggerCelebration]);

  // Add comment
  const handleAddComment = useCallback(async (creationId: string, content: string) => {
    if (!content.trim()) return false;

    const tempCommentId = generateUniqueId();
    const creation = creations.find(c => c.id === creationId);
    
    try {
      // Optimistic update
      const newComment = {
        id: tempCommentId,
        creation_id: creationId,
        author: currentUser.name,
        author_avatar: currentUser.avatarUrl,
        content,
        created_at: new Date().toISOString()
      };

      setCreations(prev => prev.map(c => 
        c.id === creationId 
          ? { 
              ...c, 
              comments: [...(c.comments || []), newComment] 
            } 
          : c
      ));

      // Save to Supabase
      const { data, error } = await supabase
        .from('comments')
        .insert({
          creation_id: creationId,
          author: currentUser.name,
          author_avatar: currentUser.avatarUrl,
          content
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp comment with actual comment from DB
      setCreations(prev => prev.map(c => 
        c.id === creationId 
          ? { 
              ...c, 
              comments: [
                ...(c.comments?.filter(comment => comment.id !== tempCommentId) || []), 
                data
              ] 
            } 
          : c
      ));

      // Notify about the comment
      if (creation) {
        triggerCelebration(`You commented on ${creation.childName}'s creation!`);
      }

      return true;
    } catch (err) {
      // Rollback on error
      setCreations(prev => prev.map(c => 
        c.id === creationId 
          ? { 
              ...c, 
              comments: c.comments?.filter(comment => comment.id !== tempCommentId) || [] 
            } 
          : c
      ));
      setError("Couldn't add comment. Try again!");
      return false;
    }
  }, [currentUser, creations, supabase, triggerCelebration]);

  // Share creation function with multiple platform options
  const shareCreation = useCallback(async (creation: Creation, platform?: string) => {
    try {
      let shareableUrl = creation.imageUrl;
      
      if (!shareableUrl.startsWith('http')) {
        const pathParts = shareableUrl.split('/creations/');
        const fileName = pathParts[pathParts.length - 1];
        const { data: { publicUrl } } = supabase.storage
          .from('creations')
          .getPublicUrl(fileName);
        shareableUrl = publicUrl;
      }
  
      const shareText = `${creation.description || "Check out this amazing creation!"}\n\nBy ${creation.childName} (age ${creation.age})`;
      const shareTitle = `Art by ${creation.childName}`;
  
      // Platform-specific sharing
      if (platform === 'whatsapp') {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareableUrl)}`;
        window.open(whatsappUrl, '_blank');
        return;
      }
      
      if (platform === 'facebook') {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(facebookUrl, '_blank');
        return;
      }
      
      if (platform === 'twitter') {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareableUrl)}`;
        window.open(twitterUrl, '_blank');
        return;
      }
  
      // Generic sharing
      const shareData = {
        title: shareTitle,
        text: shareText,
        url: shareableUrl
      };
  
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareableUrl);
        triggerCelebration("Link copied to clipboard!");
      } else {
        // Fallback: show share options
        setCelebrationText("Share options: Copy the image URL to share");
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    } catch (err) {
      console.error("Sharing failed:", err);
      setError("Sharing didn't work. Try copying the link manually.");
    }
  }, [triggerCelebration, supabase]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!uploadForm.imageFile) {
      setError("Please select an image to upload");
      return;
    }
  
    try {
      setUploadForm(prev => ({ ...prev, isUploading: true }));
  
      // ----------------------------
      // 1️⃣ File validation
      // ----------------------------
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!validTypes.includes(uploadForm.imageFile.type)) throw new Error('Only JPG, PNG, or GIF images are allowed');
      if (uploadForm.imageFile.size > maxSize) throw new Error('Image must be smaller than 5MB');
  
      // ----------------------------
      // 2️⃣ Generate unique filename & upload
      // ----------------------------
      const fileExt = uploadForm.imageFile.name.split('.').pop();
      const fileName = `${generateUniqueId()}.${fileExt}`;
      const filePath = `creations/${fileName}`;
  
      const { error: uploadError } = await supabase.storage
        .from('creations')
        .upload(filePath, uploadForm.imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: uploadForm.imageFile.type
        });
      if (uploadError) throw uploadError;
  
      const { data: { publicUrl } } = supabase.storage
        .from('creations')
        .getPublicUrl(filePath);
  
      // ----------------------------
      // 3️⃣ Private WhatsApp share (no DB insert)
      // ----------------------------
      if (uploadForm.shareMethod === 'whatsapp') {
        const text = `Check out ${uploadForm.childName}'s creation!${uploadForm.description ? `\n\n"${uploadForm.description}"` : ''}\n\n${publicUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank'); // Mobile app or desktop QR
  
        setShowUploadModal(false);
        setUploadForm({
          childName: "",
          age: "",
          description: "",
          isPublic: true,
          imageFile: null,
          previewUrl: "",
          uploadProgress: 0,
          isUploading: false,
          shareMethod: 'public'
        });
  
        triggerCelebration("Shared privately via WhatsApp!");
        return;
      }
  
      // ----------------------------
      // 4️⃣ Public community share (normal DB insert)
      // ----------------------------
      const { data: children } = await supabase
        .from('children')
        .select('id')
        .eq('parent_id', currentUser.id)
        .limit(1);
      const childId = children?.[0]?.id || null;
  
      const { data: creation, error: insertError } = await supabase
        .from('creations')
        .insert({
          child_id: childId,
          child_name: uploadForm.childName,
          age: parseInt(uploadForm.age),
          description: uploadForm.description,
          is_public: uploadForm.isPublic,
          image_url: publicUrl,
          type: 'art',
          completion_status: 'completed'
        })
        .select()
        .single();
      if (insertError) throw insertError;
  
      // Update local state
      setCreations(prev => [{
        id: creation.id,
        childId: creation.child_id,
        childName: creation.child_name,
        age: creation.age,
        description: creation.description,
        imageUrl: creation.image_url,
        likes: 0,
        likedByUser: false,
        isPublic: creation.is_public,
        type: creation.type,
        completionStatus: creation.completion_status,
        createdAt: creation.created_at,
        comments: []
      }, ...prev]);
  
      // Close modal and reset form
      setShowUploadModal(false);
      setUploadForm({
        childName: "",
        age: "",
        description: "",
        isPublic: true,
        imageFile: null,
        previewUrl: "",
        uploadProgress: 0,
        isUploading: false,
        shareMethod: 'public'
      });
  
      triggerCelebration("Your creation has been shared publicly!");
  
    } catch (err: any) {
      setError(err.message || "Failed to upload creation. Please try again.");
    } finally {
      setUploadForm(prev => ({ ...prev, isUploading: false }));
    }
  };
  
  // Enhanced Nimi AI chat
  const handleNimiSend = async (message: string) => {
    setIsNimiTyping(true);
    setNimiMessages(prev => [...prev, { sender: 'user', text: message }]);
    
    try {
      // Add a temporary typing indicator
      setNimiMessages(prev => [...prev, { sender: 'nimi', text: '...' }]);
      
      const response = await fetch('/api/nimi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }],
          childName: currentUser.name,
          language: "en"
        })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiMessage = '';
      
      if (reader) {
        // Remove the typing indicator
        setNimiMessages(prev => prev.slice(0, -1));
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.substring(5));
                if (data.error) {
                  throw new Error(data.error);
                }
                if (data.content) {
                  aiMessage += data.content;
                  // Update the last message with new content
                  setNimiMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage?.sender === 'nimi') {
                      return [...prev.slice(0, -1), { sender: 'nimi', text: aiMessage }];
                    }
                    return [...prev, { sender: 'nimi', text: aiMessage }];
                  });
                }
              } catch (err) {
                console.error("Error parsing chunk:", err);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      // Remove typing indicator and show error message
      setNimiMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.text === '...') {
          return [...prev.slice(0, -1), { 
            sender: 'nimi', 
            text: "Sorry, I'm having trouble thinking right now. Could you try again?" 
          }];
        }
        return [...prev, { 
          sender: 'nimi', 
          text: "Sorry, I'm having trouble thinking right now. Could you try again?" 
        }];
      });
    } finally {
      setIsNimiTyping(false);
    }
  };

  // Clean up blob URLs
  useEffect(() => {
    return () => {
      if (uploadForm.previewUrl) {
        URL.revokeObjectURL(uploadForm.previewUrl);
      }
    };
  }, [uploadForm.previewUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <CelebrationBanner isVisible={showCelebration} text={celebrationText} />
      {error && <ErrorToast message={error} onDismiss={() => setError(null)} />}

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => !uploadForm.isUploading && setShowUploadModal(false)}
        onSubmit={handleUploadSubmit}
        formState={uploadForm}
        setFormState={setUploadForm}
        onShareMethodChange={(method) => setUploadForm(prev => ({ ...prev, shareMethod: method }))}
      />

      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Creative Community
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            Share, explore, and celebrate creativity together!
          </p>
        </div>

        {/* Upload Card */}
        <Card className="mb-8 bg-gradient-to-r from-pink-100 to-purple-100 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <Sparkles className="w-8 h-8 mr-3 text-pink-600" />
              <span>Share Your Creation!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-6 rounded-full text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
            >
              <Camera className="w-8 h-8 mr-3" /> Share Your Work
            </Button>
            <p className="text-sm text-gray-600 mt-4">
              Share publicly or privately with friends on WhatsApp
            </p>
          </CardContent>
        </Card>

        {/* PikoPal of the Week */}
        {pikopals[0] && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-100 to-orange-100 border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-2xl">
                <Trophy className="w-8 h-8 mr-3 text-yellow-600" />
                <span>🌟 Featured Creator</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="text-8xl mb-4 animate-bounce">
                  {pikopals[0].avatarUrl ? (
                    <img 
                      src={pikopals[0].avatarUrl} 
                      alt={pikopals[0].name}
                      className="w-24 h-24 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <span>{pikopals[0].avatar}</span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{pikopals[0].name}</h3>
                <p className="text-lg text-yellow-600 font-semibold mb-2">{pikopals[0].title}</p>
                <p className="text-center text-gray-700">
                  Our featured creator this week! Say hello to {pikopals[0].name}! 👋
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Creations Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
            <Sparkles className="w-8 h-8 mr-3 text-pink-500" />
            Community Creations
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(null).map((_, i) => (
                <div key={`skeleton-${i}`} className="animate-pulse bg-white rounded-lg h-64 shadow-lg" />
              ))}
            </div>
          ) : creations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🖼️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No Creations Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to share something amazing!
              </p>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
              >
                Share Your Creation
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creations.map(creation => (
                <CreationCard 
                  key={`creation-${creation.id}`} 
                  creation={creation}
                  onLike={() => handleLike(creation.id)}
                  onAddComment={(content) => handleAddComment(creation.id, content)}
                  onShare={(platform) => shareCreation(creation, platform)}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </div>

        {/* Nimi Chat */}
        <Card className="mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-purple-100 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3 shadow-sm border border-purple-200">
                <span className="text-2xl">🤖</span>
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Chat with Nimi
              </span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <NimiChat 
              messages={nimiMessages}
              isTyping={isNimiTyping}
              onSend={handleNimiSend}
              currentUser={currentUser}
              voiceEnabled={true}
            />
          </CardContent>
        </Card>
  
        {/* Coming Soon */}
        <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-none shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">More Features Coming!</h3>
            <p className="text-gray-700 mb-6">We're working on new ways to create and share together!</p>
            <div className="flex justify-center gap-4">
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 text-green-600 mr-2" />
                <span>Enhanced Comments</span>
              </div>
              <div className="flex items-center">
                <Heart className="w-5 h-5 text-red-600 mr-2" />
                <span>Reactions</span>
              </div>
              <div className="flex items-center">
                <Share2 className="w-5 h-5 text-blue-600 mr-2" />
                <span>More Sharing Options</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
      <Footer />
    </div>
  );
};

export default CommunityPage;