"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, Camera } from "lucide-react";
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
  const currentUser = { name: "Emma", avatar: "👧" };

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

  // Load data from Supabase
  const fetchCreations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('creations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCreations(data.map(creation => ({
        ...creation,
        childName: creation.child_name,
        createdAt: creation.created_at,
        isPublic: creation.is_public,
        imageUrl: creation.image_url,
        likedByUser: creation.liked_by_user,
        comments: creation.comments || [] // Ensure comments is always an array
      })));

      if (data.length > 0) {
        triggerCelebration(`New art from ${data[0].child_name}!`);
      }
    } catch (err) {
      setError("Couldn't load creations. Please try again.");
      console.error("Error fetching creations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchCreations();
    // Mock pikopals data
    setPikopals([{
      id: '1',
      name: 'Sophia',
      age: 6,
      achievements: 5,
      streak: 7,
      avatar: '👧',
      title: 'Creative Explorer'
    }]);
  }, []);

  // Celebration animation
  const triggerCelebration = useCallback((text: string) => {
    setCelebrationText(text);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  }, []);

  // Handle upload submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadForm.shareMethod === 'whatsapp') {
      // Handle WhatsApp sharing
      if (uploadForm.imageFile) {
        const whatsappUrl = `https://wa.me/?text=Check%20out%20my%20creation!`;
        window.open(whatsappUrl, '_blank');
      }
      setShowUploadModal(false);
      return;
    }

    if (!uploadForm.imageFile) {
      setError("Please select an image to upload");
      return;
    }
  
    try {
      setUploadForm(prev => ({ ...prev, isUploading: true }));
      
      // File validation
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(uploadForm.imageFile.type)) {
        throw new Error('Only JPG, PNG, or GIF images are allowed');
      }
      
      if (uploadForm.imageFile.size > maxSize) {
        throw new Error('Image must be smaller than 5MB');
      }
  
      // Generate unique filename
      const fileExt = uploadForm.imageFile.name.split('.').pop();
      const fileName = `${generateUniqueId()}.${fileExt}`;
      const filePath = `creations/${fileName}`;
  
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('creations')
        .upload(filePath, uploadForm.imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: uploadForm.imageFile.type
        });
  
      if (uploadError) throw uploadError;
  
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('creations')
        .getPublicUrl(filePath);
  
      // Insert record into database
      const { data: creation, error: insertError } = await supabase
        .from('creations')
        .insert({
          child_name: uploadForm.childName,
          age: parseInt(uploadForm.age),
          description: uploadForm.description,
          is_public: uploadForm.isPublic,
          image_url: publicUrl,
          type: 'art',
          completion_status: 'completed',
          likes: 0,
          liked_by_user: false
        })
        .select()
        .single();
  
      if (insertError) throw insertError;
  
      // Update local state
      setCreations(prev => [{
        ...creation,
        childName: creation.child_name,
        createdAt: creation.created_at,
        isPublic: creation.is_public,
        imageUrl: creation.image_url,
        likedByUser: creation.liked_by_user,
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
  
      triggerCelebration(`Your creation has been shared!`);
  
    } catch (err: any) {
      setError(err.message || "Failed to upload creation. Please try again.");
    } finally {
      setUploadForm(prev => ({ ...prev, isUploading: false }));
    }
  };

  // Share creation function
  const shareCreation = useCallback(async (creation: Creation) => {
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
  
      const shareData = {
        title: `Art by ${creation.childName}`,
        text: `${creation.description || "Check out this amazing creation!"}\n\nBy ${creation.childName} (age ${creation.age})`,
        url: shareableUrl
      };
  
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareableUrl);
        triggerCelebration("Link copied to clipboard!");
      } else {
        window.open(shareableUrl, '_blank');
      }
    } catch (err) {
      console.error("Sharing failed:", err);
      setError("Sharing didn't work. Try copying the link manually.");
    }
  }, [triggerCelebration]);

  // Like functionality
  const handleLike = useCallback(async (creationId: string) => {
    try {
      setCreations(prev => prev.map(c => {
        if (c.id === creationId) {
          const newLikeState = !c.likedByUser;
          return {
            ...c,
            likes: newLikeState ? c.likes + 1 : c.likes - 1,
            likedByUser: newLikeState
          };
        }
        return c;
      }));

      const { error } = await supabase
        .from('creations')
        .update({ 
          likes: creations.find(c => c.id === creationId)?.likes || 0,
          liked_by_user: !creations.find(c => c.id === creationId)?.likedByUser
        })
        .eq('id', creationId);

      if (error) throw error;
    } catch (err) {
      console.error("Like error:", err);
      setError("Couldn't send like. Try again!");
      setCreations(prev => prev.map(c => {
        if (c.id === creationId) {
          return {
            ...c,
            likes: c.likedByUser ? c.likes - 1 : c.likes + 1,
            likedByUser: !c.likedByUser
          };
        }
        return c;
      }));
    }
  }, [creations, supabase]);

  // Add comment functionality
  const handleAddComment = useCallback(async (creationId: string, content: string) => {
    const tempCommentId = generateUniqueId();
    
    try {
      // Optimistic update
      const newComment = {
        id: tempCommentId,
        creation_id: creationId,
        author: currentUser.name,
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
  }, []);

  // Enhanced Nimi AI chat
  const handleNimiSend = async (message: string) => {
    setIsNimiTyping(true);
    setNimiMessages(prev => [...prev, { sender: 'user', text: message }]);
    
    try {
      // Add a temporary typing indicator
      setNimiMessages(prev => [...prev, { sender: 'nimi', text: '' }]);
      
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
        // Remove the empty typing indicator
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
      setNimiMessages(prev => [...prev, { 
        sender: 'nimi', 
        text: "Sorry, I'm having trouble thinking right now. Could you try again?" 
      }]);
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
      <ErrorToast error={error} onDismiss={() => setError(null)} />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => !uploadForm.isUploading && setShowUploadModal(false)}
        onSubmit={handleUploadSubmit}
        formState={uploadForm}
        setFormState={setUploadForm}
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
                  {pikopals[0].avatar}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{pikopals[0].name}</h3>
                <p className="text-center text-gray-700 mb-4">
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
                  onLike={handleLike}
                  onAddComment={handleAddComment}
                  onShare={shareCreation}
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
          </CardContent>
        </Card>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default CommunityPage;