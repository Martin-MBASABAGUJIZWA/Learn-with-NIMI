"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  MessageCircle, Heart, Camera, Mic, Trophy, Send, X, Users, Share2, Sparkles, Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";

interface Comment {
  id: string;
  creationId: string;
  author: string;
  content: string;
  createdAt: string;
}

interface Creation {
  id: string;
  childName: string;
  age: number;
  imageUrl: string;
  likes: number;
  type: string;
  isPublic: boolean;
  createdAt: string;
  description?: string;
  comments?: Comment[];
  likedByUser?: boolean;
  completionStatus?: 'draft' | 'in-progress' | 'completed';
}

interface PikoPal {
  id: string;
  name: string;
  age: number;
  achievements: number;
  streak: number;
  avatar: string;
  title: string;
}

interface UserMessage {
  sender: 'user' | 'nimi';
  text: string;
}

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
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    childName: "",
    age: "",
    description: "",
    isPublic: true,
    imageFile: null as File | null,
    previewUrl: "",
    uploadProgress: 0,
    isUploading: false
  });

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
        createdAt: creation.created_at,
        isPublic: creation.is_public,
        imageUrl: creation.image_url
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

  // Scroll chat to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [nimiMessages]);

  // Celebration animation
  const triggerCelebration = useCallback((text: string) => {
    setCelebrationText(text);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  }, []);

  // Enhanced dropzone for image upload
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (file.size > 5 * 1024 * 1024) {
          setError("File is too large. Please select an image under 5MB.");
          return;
        }
        setUploadForm(prev => ({
          ...prev,
          imageFile: file,
          previewUrl: URL.createObjectURL(file)
        }));
      }
    }, []),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1
  });

  // Handle upload submission to Supabase
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.imageFile) {
      setError("Please select an image to upload");
      return;
    }

    try {
      setUploadForm(prev => ({ ...prev, isUploading: true }));
      
      // Upload image to Supabase Storage
      const fileExt = uploadForm.imageFile.name.split('.').pop();
      const fileName = `${generateUniqueId()}.${fileExt}`;
      const filePath = `creations/${fileName}`;

      // Upload with progress tracking
      const { error: uploadError } = await supabase.storage
        .from('creations')
        .upload(filePath, uploadForm.imageFile, {
          cacheControl: '3600',
          upsert: false,
          onProgress: (progress) => {
            setUploadForm(prev => ({ ...prev, uploadProgress: progress }));
          }
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('creations')
        .getPublicUrl(filePath);

      // Insert creation record
      const { data: creation, error: insertError } = await supabase
        .from('creations')
        .insert({
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
        ...creation,
        childName: creation.child_name,
        isPublic: creation.is_public,
        imageUrl: creation.image_url,
        createdAt: creation.created_at,
        likes: 0,
        likedByUser: false,
        completionStatus: 'completed'
      }, ...prev]);

      setShowUploadModal(false);
      triggerCelebration(`Your creation has been shared!`);
      
      // Reset form
      setUploadForm({
        childName: "",
        age: "",
        description: "",
        isPublic: true,
        imageFile: null,
        previewUrl: "",
        uploadProgress: 0,
        isUploading: false
      });
    } catch (err) {
      setError("Failed to upload creation. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setUploadForm(prev => ({ ...prev, isUploading: false }));
    }
  };

  // Share creation
  const shareCreation = useCallback((creation: Creation) => {
    try {
      const shareText = creation.isPublic
        ? `Check out this amazing creation by ${creation.childName} (${creation.age} years old)!\n\n${creation.description || "No description provided"}\n\nShared via PikoPal App`
        : `Check out my private creation! ${creation.description ? `\n\n${creation.description}` : ''}`;

      const shareData = creation.isPublic
        ? {
            title: `Art by ${creation.childName}`,
            text: shareText,
            url: creation.imageUrl
          }
        : {
            title: `My Private Creation`,
            text: shareText,
            files: [new File([creation.imageUrl], 'art.png')]
          };

      if (navigator.share) {
        navigator.share(shareData).catch(() => {
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText + (creation.isPublic ? '\n\n' + creation.imageUrl : ''))}`, '_blank');
        });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + (creation.isPublic ? '\n\n' + creation.imageUrl : ''))}`, '_blank');
      }
    } catch (err) {
      setError("Sharing failed. Please try again.");
    }
  }, []);

  // Like creation
  const handleLike = useCallback(async (creationId: string) => {
    try {
      // Optimistic update
      setCreations(prev => prev.map(c => {
        if (c.id === creationId) {
          const liked = !c.likedByUser;
          return {
            ...c,
            likes: liked ? c.likes + 1 : c.likes - 1,
            likedByUser: liked
          };
        }
        return c;
      }));

      // Update in Supabase
      const creation = creations.find(c => c.id === creationId);
      if (!creation) return;

      const { error } = await supabase
        .from('creations')
        .update({ 
          likes: creation.likedByUser ? creation.likes - 1 : creation.likes + 1
        })
        .eq('id', creationId);

      if (error) throw error;
    } catch (err) {
      // Rollback on error
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
      setError("Couldn't send like. Try again!");
    }
  }, [creations]);

  // Add comment
  const handleAddComment = useCallback(async (creationId: string, content: string) => {
    try {
      // Optimistic update
      const newComment = {
        id: generateUniqueId(),
        creationId,
        author: currentUser.name,
        content,
        createdAt: new Date().toISOString()
      };

      setCreations(prev => prev.map(c => 
        c.id === creationId 
          ? { ...c, comments: [...(c.comments || []), newComment] } 
          : c
      ));

      // Save to Supabase
      const { error } = await supabase
        .from('comments')
        .insert({
          creation_id: creationId,
          author: currentUser.name,
          content
        });

      if (error) throw error;
      return true;
    } catch (err) {
      // Rollback on error
      setCreations(prev => prev.map(c => 
        c.id === creationId 
          ? { ...c, comments: c.comments?.slice(0, -1) } 
          : c
      ));
      setError("Couldn't add comment. Try again!");
      return false;
    }
  }, []);

  // Nimi AI chat
  const handleNimiSend = useCallback(async (message: string) => {
    setNimiMessages(prev => [...prev, { sender: 'user', text: message }]);
    setIsNimiTyping(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

      let responseText = "";
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes('art') || lowerMessage.includes('draw') || lowerMessage.includes('paint')) {
        responseText = "That's beautiful! What inspired you to create this? 🎨";
      } 
      else if (lowerMessage.includes('how are you')) {
        responseText = "I'm doing great! Excited to see what you'll create today. 😊";
      }
      else if (lowerMessage.includes('thank')) {
        responseText = "You're very welcome! 💕";
      }
      else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        responseText = "Hi there! 👋 What would you like to create today?";
      }
      else {
        responseText = "That's interesting! Tell me more about it. 😊";
      }

      setNimiMessages(prev => [...prev, { sender: 'nimi', text: responseText }]);
    } catch (err) {
      setError("Sorry, I couldn't process that. Please try again!");
    } finally {
      setIsNimiTyping(false);
    }
  }, []);

  // Clean up blob URLs
  useEffect(() => {
    return () => {
      if (uploadForm.previewUrl) {
        URL.revokeObjectURL(uploadForm.previewUrl);
      }
    };
  }, [uploadForm.previewUrl]);

  // Creation Card Component
  const CreationCard = React.memo(({ creation }: { creation: Creation }) => {
    const [comment, setComment] = useState("");
    const [showComments, setShowComments] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [isCommenting, setIsCommenting] = useState(false);

    const handleLikeClick = async () => {
      setIsLiking(true);
      await handleLike(creation.id);
      setIsLiking(false);
    };

    const handleCommentSubmit = async () => {
      if (comment.trim()) {
        setIsCommenting(true);
        const success = await handleAddComment(creation.id, comment);
        if (success) setComment("");
        setIsCommenting(false);
      }
    };

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow relative">
        {creation.completionStatus === 'completed' && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center z-10">
            <Sparkles className="w-3 h-3 mr-1" />
            Completed!
          </div>
        )}
        
        <div className="relative aspect-square">
          <img 
            src={creation.imageUrl} 
            alt={`Art by ${creation.childName}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">{creation.childName} ({creation.age})</h3>
            <div className="text-xs text-gray-500">
              {new Date(creation.createdAt).toLocaleDateString()}
            </div>
          </div>
          
          {creation.description && (
            <p className="text-sm text-gray-600 mb-3">{creation.description}</p>
          )}
          
          <div className="flex justify-around border-t pt-3">
            <Button 
              variant="ghost" 
              className="flex items-center gap-1" 
              onClick={handleLikeClick}
              disabled={isLiking}
            >
              {isLiking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart 
                  className="w-5 h-5" 
                  fill={creation.likedByUser ? "currentColor" : "none"} 
                  color={creation.likedByUser ? "#ec4899" : "currentColor"}
                />
              )}
              <span>{creation.likes}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="flex items-center gap-1" 
              onClick={() => setShowComments(!showComments)}
              disabled={isCommenting}
            >
              <MessageCircle className="w-5 h-5" />
              <span>{creation.comments?.length || 0}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => shareCreation(creation)}
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {showComments && (
            <div className="mt-3 space-y-2">
              {creation.comments?.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                    {comment.author[0]}
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2 flex-1">
                    <div className="font-medium text-xs">{comment.author}</div>
                    <div className="text-sm">{comment.content}</div>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                  disabled={isCommenting}
                />
                <Button 
                  onClick={handleCommentSubmit}
                  disabled={!comment.trim() || isCommenting}
                  size="sm"
                >
                  {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div 
              className="bg-gradient-to-r from-yellow-400 to-pink-500 text-white text-2xl font-bold px-8 py-4 rounded-full shadow-2xl"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [-5, 5, -5, 5, 0],
              }}
              transition={{ 
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              {celebrationText} 🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Notification */}
      {error && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center"
        >
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-3 p-1 rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Share Your Creation</h3>
                  <button 
                    onClick={() => !uploadForm.isUploading && setShowUploadModal(false)}
                    className="p-1 rounded-full hover:bg-gray-100"
                    disabled={uploadForm.isUploading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUploadSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="childName">Child's Name</Label>
                      <Input
                        id="childName"
                        value={uploadForm.childName}
                        onChange={(e) => setUploadForm(prev => ({...prev, childName: e.target.value}))}
                        required
                        minLength={2}
                        disabled={uploadForm.isUploading}
                      />
                    </div>

                    <div>
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        min="1"
                        max="18"
                        value={uploadForm.age}
                        onChange={(e) => setUploadForm(prev => ({...prev, age: e.target.value}))}
                        required
                        disabled={uploadForm.isUploading}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm(prev => ({...prev, description: e.target.value}))}
                        maxLength={200}
                        disabled={uploadForm.isUploading}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Visibility</Label>
                        <p className="text-xs text-gray-500">
                          {uploadForm.isPublic 
                            ? "Public (visible to everyone)" 
                            : "Private (share only via WhatsApp)"}
                        </p>
                      </div>
                      <Switch
                        checked={uploadForm.isPublic}
                        onCheckedChange={(checked) => setUploadForm(prev => ({...prev, isPublic: checked}))}
                        disabled={uploadForm.isUploading}
                      />
                    </div>

                    <div>
                      <Label>Upload Image</Label>
                      <div 
                        {...getRootProps()} 
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                        } ${uploadForm.isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input {...getInputProps()} disabled={uploadForm.isUploading} />
                        {uploadForm.previewUrl ? (
                          <div className="relative">
                            <img 
                              src={uploadForm.previewUrl} 
                              alt="Preview" 
                              className="mx-auto max-h-48 rounded-md mb-2"
                              loading="lazy"
                            />
                            {!uploadForm.isUploading && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUploadForm(prev => ({...prev, imageFile: null, previewUrl: ""}));
                                }}
                                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            <Camera className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">
                              {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG (max 5MB)</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Upload progress */}
                    {uploadForm.isUploading && (
                      <div className="pt-2">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: '0%' }}
                            animate={{ width: `${uploadForm.uploadProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-xs text-center text-gray-600 mt-1">
                          Uploading... {uploadForm.uploadProgress}%
                        </p>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                        disabled={!uploadForm.imageFile || !uploadForm.childName || !uploadForm.age || uploadForm.isUploading}
                      >
                        {uploadForm.isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : uploadForm.isPublic ? (
                          'Share Publicly'
                        ) : (
                          'Share Privately via WhatsApp'
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <motion.div 
                  className="text-8xl mb-4"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  {pikopals[0].avatar}
                </motion.div>
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
                <CreationCard key={`creation-${creation.id}`} creation={creation} />
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
            <div className="h-64 p-4 bg-white rounded-lg border border-gray-200 overflow-y-auto mb-4 shadow-inner">
              {nimiMessages.map((msg, i) => (
                <div key={`message-${i}`} className={`mb-3 flex ${msg.sender === 'nimi' ? 'justify-start' : 'justify-end'}`}>
                  <div className="flex items-start max-w-xs md:max-w-md">
                    {msg.sender === 'nimi' && (
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0 border border-purple-200">
                        <span className="text-lg">🤖</span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-2 ${msg.sender === 'nimi' 
                      ? 'bg-purple-100 text-gray-800 rounded-tl-none border border-purple-200' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-tr-none'}`}
                    >
                      <div className="whitespace-pre-wrap text-sm md:text-base">{msg.text}</div>
                    </div>
                    {msg.sender === 'user' && (
                      <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center ml-2 mt-1 flex-shrink-0 border border-pink-200">
                        <span className="text-lg">{currentUser.avatar}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isNimiTyping && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0 border border-purple-200">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div className="bg-purple-100 rounded-2xl px-4 py-2 rounded-tl-none border border-purple-200">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Chat with Nimi about anything..."
                  className="flex-1 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleNimiSend(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  disabled={isNimiTyping}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input.value.trim()) {
                      handleNimiSend(input.value);
                      input.value = '';
                    }
                  }}
                  disabled={isNimiTyping}
                  className={`p-2 rounded-full ${isNimiTyping 
                    ? 'bg-gray-200 text-gray-400' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'}`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
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

      <BottomNavigation />
    </div>
  );
};

export default CommunityPage;