"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MessageCircle, Heart, Camera, Mic, Trophy, Send, X, Users, Share2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import Footer from "@/components/Footer";

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

// Mock API functions with proper unique IDs
const generateUniqueId = () => Math.random().toString(36).substring(2, 11);

const mockFetchCreations = async (): Promise<Creation[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return [
    {
      id: generateUniqueId(),
      childName: 'Emma',
      age: 7,
      imageUrl: 'https://source.unsplash.com/random/300x300/?child,drawing',
      likes: 12,
      type: 'drawing',
      isPublic: true,
      createdAt: new Date().toISOString(),
      description: 'My first drawing of a dinosaur!',
      comments: [
        {
          id: generateUniqueId(),
          creationId: '1',
          author: 'Liam',
          content: 'Wow, this is amazing!',
          createdAt: new Date().toISOString()
        }
      ],
      likedByUser: false
    },
    {
      id: generateUniqueId(),
      childName: 'Noah',
      age: 5,
      imageUrl: 'https://source.unsplash.com/random/300x300/?child,painting',
      likes: 8,
      type: 'painting',
      isPublic: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      description: 'Rainbow painting for mom',
      likedByUser: false
    }
  ];
};

const mockFetchPikopals = async (): Promise<PikoPal[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: generateUniqueId(),
      name: 'Sophia',
      age: 6,
      achievements: 5,
      streak: 7,
      avatar: '👧',
      title: 'Creative Explorer'
    }
  ];
};

const mockUploadCreation = async (formData: FormData): Promise<Creation> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const isPublic = formData.get('isPublic') === 'true';
  const imageFile = formData.get('image') as File;
  
  return {
    id: generateUniqueId(),
    childName: formData.get('childName') as string,
    age: parseInt(formData.get('age') as string),
    imageUrl: isPublic 
      ? URL.createObjectURL(imageFile)
      : '', // Private creations don't get a public URL
    likes: 0,
    type: 'art',
    isPublic,
    createdAt: new Date().toISOString(),
    description: formData.get('description') as string || undefined,
    likedByUser: false
  };
};

const mockLikeCreation = async (creationId: string): Promise<Creation> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const creations = await mockFetchCreations();
  const creation = creations.find(c => c.id === creationId) || creations[0];
  
  return {
    ...creation,
    likes: creation.likedByUser ? creation.likes - 1 : creation.likes + 1,
    likedByUser: !creation.likedByUser
  };
};

const mockAddComment = async (creationId: string, content: string): Promise<Comment> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    id: generateUniqueId(),
    creationId,
    author: 'You',
    content,
    createdAt: new Date().toISOString()
  };
};

const CommunityPage = () => {
  // State management
  const [creations, setCreations] = useState<Creation[]>([]);
  const [pikopals, setPikopals] = useState<PikoPal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [nimiMessages, setNimiMessages] = useState<UserMessage[]>([
    { 
      sender: 'nimi', 
      text: "Hello friend! I'm Nim!\n\n What's in your mind today" 
    }
  ]);
  const [isNimiTyping, setIsNimiTyping] = useState(false);
  const [celebrations, setCelebrations] = useState<{id: string, tag: string}[]>([]);
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
    previewUrl: ""
  });

  // Memoized data loading
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [creationsData, pikopalsData] = await Promise.all([
        mockFetchCreations(),
        mockFetchPikopals()
      ]);

      setCreations(creationsData.filter(c => c.isPublic)); // Only show public creations
      setPikopals(pikopalsData);
      
      if (creationsData.length > 0) {
        setCelebrations(
          creationsData
            .slice(0, 3)
            .map(creation => ({
              id: creation.id,
              tag: ["🌟 Amazing!", "🎉 Wonderful!", "💖 Lovely!", "👏 Great job!", "✨ Fantastic!"][
                Math.floor(Math.random() * 5)
              ]
            }))
        );
        triggerCelebration(`New art from ${creationsData[0].childName}!`);
      }
    } catch (err) {
      setError("Couldn't load data. Please check your connection and try again.");
      console.error("Data loading error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Celebration animation
  const triggerCelebration = useCallback((text: string) => {
    setCelebrationText(text);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  }, []);

  // Enhanced Nimi AI response handler
  const handleNimiSend = useCallback(async (message: string) => {
    // Add user message
    setNimiMessages(prev => [...prev, { sender: 'user', text: message }]);
    setIsNimiTyping(true);

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

      // Enhanced response logic
      let responseText = "";
      const lowerMessage = message.toLowerCase();

      // Art-related responses
      if (lowerMessage.includes('art') || lowerMessage.includes('draw') || lowerMessage.includes('paint')) {
        responseText = [
          "That's beautiful! What inspired you to create this? 🎨",
          "I love seeing your creativity! Tell me more about this piece. 💖",
          "Art is such a wonderful way to express yourself! What colors did you use? 🌈",
          "Would you like to share this with your friends? They'd love to see it! 👀"
        ][Math.floor(Math.random() * 4)];
      } 
      // General conversation
      else if (lowerMessage.includes('how are you')) {
        responseText = "I'm doing great! Excited to see what you'll create or share today. 😊";
      }
      else if (lowerMessage.includes('thank')) {
        responseText = "You're very welcome! It's my pleasure to chat with you. 💕";
      }
      else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        responseText = "Hi there! 👋 What would you like to talk about today?";
      }
      // Default creative response
      else {
        responseText = [
          "That's interesting! Tell me more about it. 😊",
          "I'd love to hear more about what you're thinking! 💭",
          "What a great thing to share! How does that make you feel? 🌟",
          "That's wonderful! Would you like to create something about it? 🎨"
        ][Math.floor(Math.random() * 4)];
      }

      setNimiMessages(prev => [...prev, { sender: 'nimi', text: responseText }]);
    } catch (err) {
      setError("Sorry, I couldn't process that. Please try again!");
      console.error("Nimi response error:", err);
    } finally {
      setIsNimiTyping(false);
    }
  }, []);

  // Handle file upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File is too large. Please select an image under 5MB.");
        return;
      }
      setUploadForm(prev => ({
        ...prev,
        imageFile: file,
        previewUrl: URL.createObjectURL(file)
      }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1
  });

  // Handle form submission
  const handleUploadSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.imageFile) {
      setError("Please select an image to upload");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('childName', uploadForm.childName);
      formData.append('age', uploadForm.age);
      formData.append('description', uploadForm.description);
      formData.append('isPublic', String(uploadForm.isPublic));
      formData.append('image', uploadForm.imageFile);

      const newCreation = await mockUploadCreation(formData);
      
      if (newCreation.isPublic) {
        setCreations(prev => [newCreation, ...prev]);
      }
      
      setShowUploadModal(false);
      setUploadForm({
        childName: "",
        age: "",
        description: "",
        isPublic: true,
        imageFile: null,
        previewUrl: ""
      });
      
      // Share private creation directly via WhatsApp if not public
      if (!newCreation.isPublic && uploadForm.imageFile) {
        sharePrivateCreation(uploadForm.imageFile, newCreation);
      } else {
        triggerCelebration(`Your creation has been shared!`);
      }
    } catch (err) {
      setError("Failed to upload creation. Please try again.");
      console.error("Upload error:", err);
    }
  }, [uploadForm]);

  // Share private creation via WhatsApp
  const sharePrivateCreation = useCallback((file: File, creation: Creation) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const shareText = `Check out my private creation! ${creation.description ? `\n\n${creation.description}` : ''}`;
        
        if (navigator.share) {
          navigator.share({
            title: `My Private Creation`,
            text: shareText,
            files: [file]
          }).catch(() => {
            // Fallback to WhatsApp web with text only
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
          });
        } else {
          // Direct WhatsApp sharing with text only
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Private sharing failed:', err);
      setError("Sharing failed. Please try again or copy the text manually.");
    }
  }, []);

  // Share public creation via WhatsApp
  const sharePublicCreation = useCallback((creation: Creation) => {
    try {
      const shareText = `Check out this amazing creation by ${creation.childName} (${creation.age} years old)!\n\n${creation.description || "No description provided"}\n\nShared via PikoPal App`;
      
      if (navigator.share) {
        navigator.share({
          title: `Art by ${creation.childName}`,
          text: shareText,
          url: creation.imageUrl
        }).catch(() => {
          // Fallback to WhatsApp
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + creation.imageUrl)}`, '_blank');
        });
      } else {
        // Direct WhatsApp sharing
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + creation.imageUrl)}`, '_blank');
      }
    } catch (err) {
      console.error('Sharing failed:', err);
      setError("Sharing failed. Please try again or copy the link manually.");
    }
  }, []);

  // Handle like action
  const handleLike = useCallback(async (creationId: string) => {
    try {
      const updatedCreation = await mockLikeCreation(creationId);
      setCreations(prev => prev.map(c => c.id === creationId ? updatedCreation : c));
    } catch (err) {
      setError("Couldn't send like. Try again!");
      console.error("Like error:", err);
    }
  }, []);

  // Handle comment submission
  const handleAddComment = useCallback(async (creationId: string, content: string) => {
    try {
      const newComment = await mockAddComment(creationId, content);
      setCreations(prev => prev.map(c => 
        c.id === creationId 
          ? { 
              ...c, 
              comments: [...(c.comments || []), newComment] 
            } 
          : c
      ));
      return true;
    } catch (err) {
      setError("Couldn't add comment. Try again!");
      console.error("Comment error:", err);
      return false;
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
        if (success) {
          setComment("");
        }
        setIsCommenting(false);
      }
    };

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-square">
          <img 
            src={creation.imageUrl} 
            alt={`Art by ${creation.childName}`}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {!creation.isPublic && (
            <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-full flex items-center text-xs shadow-sm">
              <Users className="w-3 h-3 mr-1" /> Private
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">{creation.childName}</h3>
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
              <Heart 
                className="w-5 h-5" 
                fill={creation.likedByUser ? "currentColor" : "none"} 
                color={creation.likedByUser ? "#ec4899" : "currentColor"}
              />
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
              onClick={() => creation.isPublic 
                ? sharePublicCreation(creation) 
                : creation.imageUrl && sharePrivateCreation(new File([creation.imageUrl], 'art.png'), creation)
              }
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
                  {isCommenting ? 'Posting...' : 'Post'}
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
                    onClick={() => setShowUploadModal(false)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUploadSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Child's Name</label>
                      <Input
                        value={uploadForm.childName}
                        onChange={(e) => setUploadForm(prev => ({...prev, childName: e.target.value}))}
                        required
                        minLength={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Age</label>
                      <Input
                        type="number"
                        min="1"
                        max="18"
                        value={uploadForm.age}
                        onChange={(e) => setUploadForm(prev => ({...prev, age: e.target.value}))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                      <Input
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm(prev => ({...prev, description: e.target.value}))}
                        maxLength={200}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Visibility</label>
                        <p className="text-xs text-gray-500">
                          {uploadForm.isPublic 
                            ? "Public (visible to everyone)" 
                            : "Private (share only via WhatsApp)"}
                        </p>
                      </div>
                      <Switch
                        checked={uploadForm.isPublic}
                        onCheckedChange={(checked) => setUploadForm(prev => ({...prev, isPublic: checked}))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Upload Image</label>
                      <div 
                        {...getRootProps()} 
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input {...getInputProps()} />
                        {uploadForm.previewUrl ? (
                          <div className="relative">
                            <img 
                              src={uploadForm.previewUrl} 
                              alt="Preview" 
                              className="mx-auto max-h-48 rounded-md mb-2"
                              loading="lazy"
                            />
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

                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                        disabled={!uploadForm.imageFile || !uploadForm.childName || !uploadForm.age}
                      >
                        {uploadForm.isPublic ? 'Share Publicly' : 'Share Privately via WhatsApp'}
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
                <div key={`creation-${creation.id}`} className="relative">
                  <CreationCard creation={creation} />
                  {celebrations.some(c => c.id === creation.id) && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      className="absolute -top-3 -right-3 bg-yellow-100 border-2 border-yellow-300 px-3 py-1 rounded-full shadow-lg z-10"
                      key={`celebration-${creation.id}`}
                    >
                      <span className="font-bold text-yellow-700">
                        {celebrations.find(c => c.id === creation.id)?.tag}
                      </span>
                    </motion.div>
                  )}
                </div>
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
              <div ref={useRef<HTMLDivElement>(null)} className="h-4" />
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
              
              <Button
                onClick={() => {
                  setNimiMessages(prev => [...prev, {
                    sender: 'nimi', 
                    text: "What would you like to create or share today? I'm here to help! 😊"
                  }]);
                }}
                variant="outline"
                className="border-purple-300 bg-white hover:bg-purple-50 text-purple-600"
              >
                Get Creative Ideas
              </Button>
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

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default CommunityPage;