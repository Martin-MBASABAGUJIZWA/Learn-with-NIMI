
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import CreationCard from "@/components/CreationCard";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import Footer from "@/components/Footer";
import { MessageCircle, Heart, Star, Upload, Camera, Mic, Crown, Sparkles, Trophy, Send, X, Lock, Globe, Users, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";
import { WhatsappShareButton, WhatsappIcon } from "react-share";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

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
  description?: string;
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
  addCreations: (newCreations: Creation[], page?: number, totalPages?: number) => void;
  resetCreations: () => void;
  likeCreation: (id: number) => void;
  addComment: (creationId: number, comment: CommentType) => void;
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
  setPage: (page) => set({ page }),
  setPikopals: (pals) => set({ pikopals: pals, loadingPals: false, errorPals: false }),
  setLoadingCreations: (val) => set({ loadingCreations: val }),
  setLoadingPals: (val) => set({ loadingPals: val }),
  setErrorCreations: (val) => set({ errorCreations: val }),
  setErrorPals: (val) => set({ errorPals: val }),
}));

// Replace your existing UploadModal component with this improved version
const UploadModal = ({ onClose, onSuccess, childName }: { onClose: () => void, onSuccess: (creation: Creation) => void, childName: string }) => {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: acceptedFiles => {
      setError(null);
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setFile(file);
        
        // Additional client-side validation
        if (file.size > 5 * 1024 * 1024) {
          setError("File is too large (max 5MB)");
          return;
        }
        
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
          setError("Please upload a JPG or PNG image");
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection.errors.some(e => e.code === 'file-too-large')) {
        setError("File is too large (max 5MB)");
      } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
        setError("Please upload a valid image (JPG, PNG)");
      } else {
        setError("Unable to upload file");
      }
    }
  });
  const handleSubmit = async () => {
    if (!image || !file) {
      setError("Please select an image first");
      return;
    }
  
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
  
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("childName", childName);
      formData.append("description", description);
      formData.append("isPublic", String(isPublic));
  
      const response = await fetch("/api/creations/upload", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          `Upload failed with status ${response.status}`
        );
      }
  
      const responseData = await response.json();
      onSuccess(responseData);
    } catch (err: any) {
      console.error("Upload error:", err);
      
      let errorMessage = err.message;
      if (err.message.includes("404")) {
        errorMessage = "Upload service unavailable. Please try again later.";
      } else if (err.message.includes("413")) {
        errorMessage = "File is too large (max 5MB)";
      } else if (err.message.includes("415")) {
        errorMessage = "Unsupported file type (only JPG/PNG allowed)";
      }
  
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };
    return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Share Your Art</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={isUploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer mb-4 transition-colors ${
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input {...getInputProps()} disabled={isUploading} />
          {image ? (
            <div className="relative h-48 w-full rounded-md overflow-hidden mb-2">
              <Image
                src={image}
                alt="Preview"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Camera className="w-10 h-10 mx-auto text-gray-400" />
              <p className="text-sm text-gray-600">
                {isDragActive ? "Drop your artwork here" : "Drag & drop your artwork, or click to select"}
              </p>
              <p className="text-xs text-gray-500">Supports JPG, PNG, GIF (max 5MB)</p>
            </div>
          )}
        </div>

          {isUploading && (
            <div className="w-full space-y-2 mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-center text-gray-600">
                {uploadProgress < 30 && "Starting upload..."}
                {uploadProgress >= 30 && uploadProgress < 70 && "Uploading your artwork..."}
                {uploadProgress >= 70 && uploadProgress < 100 && "Almost done! Processing..."}
                {uploadProgress === 100 && "Finalizing..."}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <div className="font-medium">Upload failed</div>
              <div>{error}</div>
              {error.includes('large') && (
                <div className="mt-1 text-xs">Try resizing your image or choose a different file.</div>
              )}
              {error.includes('type') && (
                <div className="mt-1 text-xs">Supported formats: JPG, PNG (max 5MB)</div>
              )}
            </div>
          )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tell us about your art
            </label>
            <Input
              placeholder="What did you create?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full"
              disabled={isUploading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="visibility"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isUploading}
            />
            <label htmlFor="visibility" className="text-sm font-medium">
              {isPublic ? "Public (Share with everyone)" : "Private (Only family)"}
            </label>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div className="flex space-x-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              disabled={!image || isUploading}
            >
              {isUploading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {uploadProgress}%
                </div>
              ) : (
                "Share Art"
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const EnhancedCreationCard = ({ 
  creation, 
  onLike, 
  onComment, 
  onShare,
  onClick,
  simpleView,
  showReactions
}: {
  creation: Creation;
  onLike: (id: number) => void;
  onComment: (id: number, content: string) => void;
  onShare: (id: number, contacts: string[]) => void;
  onClick?: (creation: Creation) => void;
  simpleView?: boolean;
  showReactions?: boolean;
}) => {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [comment, setComment] = useState("");
  const [activeComment, setActiveComment] = useState(false);
  const [familyMembers] = useState(["Mom", "Dad", "Grandma", "Grandpa"]);

  const handleShareClick = () => {
    setShowShareOptions(true);
  };

  const handlePrivateShare = (contacts: string[]) => {
    onShare(creation.id, contacts);
    setShowShareOptions(false);
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative group">
        <img 
          src={creation.image} 
          alt={`Art by ${creation.childName}`}
          className="w-full h-auto object-cover cursor-pointer"
          onClick={() => onClick && onClick(creation)}
        />
        
        {!creation.isPublic && (
          <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-full flex items-center text-xs shadow-sm">
            <Users className="w-3 h-3 mr-1" /> Family Only
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">{creation.childName}</h3>
          <div className="text-xs text-gray-500">
            {new Date(creation.createdAt || '').toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex justify-around border-t pt-3">
          <Button 
            variant="ghost" 
            className={`flex items-center space-x-1 ${showReactions ? 'text-red-500' : ''}`}
            onClick={() => onLike(creation.id)}
          >
            <Heart 
              className="w-5 h-5" 
              fill={showReactions ? "currentColor" : "none"}
            />
            <span>{creation.likes}</span>
          </Button>

          <Button 
            variant="ghost" 
            className="flex items-center space-x-1"
            onClick={() => setActiveComment(!activeComment)}
          >
            <MessageCircle className="w-5 h-5" />
            <span>{creation.comments?.length || 0}</span>
          </Button>

          <Button 
            variant="ghost" 
            className="flex items-center space-x-1"
            onClick={handleShareClick}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {activeComment && (
          <div className="mt-3 space-y-2">
            {creation.comments?.map(comment => (
              <div key={comment.id} className="flex space-x-2">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                  {comment.author.charAt(0)}
                </div>
                <div className="bg-gray-100 rounded-lg px-3 py-2 flex-1">
                  <div className="font-medium text-xs">{comment.author}</div>
                  <div className="text-sm">{comment.content}</div>
                </div>
              </div>
            ))}
            
            <div className="flex space-x-2 mt-2">
              <Input
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && onComment(creation.id, comment)}
                className="flex-1 text-sm"
              />
              <Button 
                onClick={() => {
                  onComment(creation.id, comment);
                  setComment("");
                }}
                disabled={!comment.trim()}
                size="sm"
              >
                Post
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <AnimatePresence>
        {showShareOptions && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-sm"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h3 className="text-xl font-bold mb-4">
                {creation.isPublic ? "Share This Art" : "Share With Family"}
              </h3>
              
              {creation.isPublic ? (
                <div className="space-y-3">
                  <WhatsappShareButton
                    url={`${window.location.origin}/creation/${creation.id}`}
                    title={`Check out ${creation.childName}'s art on Piko!`}
                    className="w-full"
                  >
                    <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                      <WhatsappIcon size={24} round className="mr-2" />
                      Share on WhatsApp
                    </Button>
                  </WhatsappShareButton>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/creation/${creation.id}`);
                      setShowShareOptions(false);
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Select family members to share with:
                  </p>
                  <div className="space-y-2">
                    {familyMembers.map(member => (
                      <div 
                        key={member} 
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={() => handlePrivateShare([member])}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <span>{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button 
                variant="ghost" 
                className="w-full mt-4"
                onClick={() => setShowShareOptions(false)}
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

const NimiChatCard = ({ 
  messages,
  onSend,
  isTyping
}: { 
  messages: Array<{sender: 'user' | 'nimi', text: string}>;
  onSend: (msg: string) => void;
  isTyping: boolean;
}) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  const startListening = () => {
    if (isListening) {
      stopListening();
      return;
    }

    setIsListening(true);
    
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };

      recognitionRef.current.start();
    } else {
      alert("Speech recognition is not supported in your browser. Try Chrome or Edge.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Card className="mb-8 bg-gradient-to-br from-indigo-100 to-purple-100 border-none shadow-xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-200 rounded-full opacity-20"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-200 rounded-full opacity-20"></div>
      
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3 shadow-sm">
            <span className="text-2xl">🤖</span>
          </div>
          <span>Nimi Says...</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 p-4 bg-white rounded-lg border border-gray-200 overflow-y-auto mb-4 shadow-inner">
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`mb-3 flex ${msg.sender === 'nimi' ? 'justify-start' : 'justify-end'}`}
            >
              <div className="flex items-start max-w-xs md:max-w-md">
                {msg.sender === 'nimi' && (
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <span className="text-lg">🤖</span>
                  </div>
                )}
                <div 
                  className={`rounded-2xl px-4 py-2 ${msg.sender === 'nimi' 
                    ? 'bg-purple-100 text-gray-800 rounded-tl-none' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-tr-none'}`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                    <span className="text-lg">👧</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <span className="text-lg">🤖</span>
              </div>
              <div className="bg-purple-100 rounded-2xl px-4 py-2 rounded-tl-none">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={startListening}
            className={`p-2 rounded-full ${isListening 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-gray-200 hover:bg-gray-300'}`}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Talk to Nimi about art..."
            className="flex-1 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className={`p-2 rounded-full ${!input.trim() || isTyping 
              ? 'bg-gray-300 text-gray-500' 
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'}`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

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
  const [celebrations, setCelebrations] = useState<{id: number, tag: string}[]>([]);
  const childNameFromContext = "Emma";
  const creationsContainerRef = useRef<HTMLDivElement>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [friendOfTheWeek, setFriendOfTheWeek] = useState<PikoPal | null>(null);
  const [nimiMessages, setNimiMessages] = useState<Array<{sender: 'user' | 'nimi', text: string}>>([
    {sender: 'nimi', text: "Hi there! 👋 I'm Nimi! Let's look at your friends' art! 🎨\n\nTap the camera to show me your drawing! 📸"}
  ]);
  const [isNimiTyping, setIsNimiTyping] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const fetchCreations = useCallback(async (pageToLoad = 1) => {
    setLoadingCreations(true);
    try {
      const params = new URLSearchParams();
      params.append("page", pageToLoad.toString());
      params.append("ageMin", "2");
      params.append("ageMax", "4");

      const res = await fetch(`/api/creations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load creations");
      const data = await res.json();
      
      const filteredCreations = data.creations.filter((c: Creation) => c.age >= 2 && c.age <= 4);
      addCreations(filteredCreations, pageToLoad, data.totalPages);

      if (pageToLoad === 1) {
        const newCelebrations = filteredCreations.slice(0, 3).map((c: Creation) => ({
          id: c.id,
          tag: ["🌟 Wow!", "🎉 Yay!", "💖 Love!"][Math.floor(Math.random() * 3)]
        }));
        setCelebrations(newCelebrations);
        
        // Auto-celebrate the first creation
        if (filteredCreations.length > 0) {
          triggerCelebration("Look what " + filteredCreations[0].childName + " made!");
        }
      }
    } catch {
      setErrorCreations(true);
    } finally {
      setLoadingCreations(false);
    }
  }, []);

  const fetchPikoPals = useCallback(async () => {
    setLoadingPals(true);
    try {
      const res = await fetch("/api/pikopals?ageMin=2&ageMax=4");
      if (!res.ok) throw new Error("Failed to load piko pals");
      const data = await res.json();
      const filteredPals = data.pikopals.filter((p: PikoPal) => p.age >= 2 && p.age <= 4);
      setPikopals(filteredPals);
      
      if (filteredPals.length > 0) {
        const randomPal = filteredPals[Math.floor(Math.random() * filteredPals.length)];
        setFriendOfTheWeek(randomPal);
        triggerCelebration(randomPal.name + " is our friend of the week!");
      }
    } catch {
      setErrorPals(true);
    } finally {
      setLoadingPals(false);
    }
  }, []);

  const triggerCelebration = (text: string) => {
    setCelebrationText(text);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

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
    
    const newCelebration = {
      id: newCreation.id,
      tag: "🌟 Your Art!"
    };
    setCelebrations([...celebrations, newCelebration]);
    
    setNimiMessages(prev => [...prev, {
      sender: 'nimi', 
      text: `Wow ${childNameFromContext}! I love your ${newCreation.type || 'art'}! ${newCreation.description ? `You said it's ${newCreation.description}` : ''} Let's show your friends! 🎨✨`
    }]);
    triggerCelebration("You did it! 🎉");
  };

  const handleLoveCreation = async (creationId: number) => {
    likeCreation(creationId);
    try {
      await fetch(`/api/creations/${creationId}/like`, { method: "POST" });
      
      const newCelebration = {
        id: creationId,
        tag: "💖 Loved!"
      };
      setCelebrations([...celebrations, newCelebration]);
      triggerCelebration("You gave love! 💖");
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
      
      const newCelebration = {
        id: creationId,
        tag: "💬 Said Hi!"
      };
      setCelebrations([...celebrations, newCelebration]);
      triggerCelebration("You said hello! 👋");
    } catch (err) {
      alert("Oops! Try again!");
    }
  };

  const handleSharePrivate = async (creationId: number, contacts: string[]) => {
    try {
      const creation = creations.find(c => c.id === creationId);
      if (!creation) return;

      // Update local state immediately
      contacts.forEach(contact => {
        addSharedWith(creationId, contact);
      });

      // Prepare WhatsApp share
      const shareUrl = `${window.location.origin}/creation/${creationId}`;
      const shareTitle = `Check out ${creation.childName}'s artwork on Piko!`;
      
      // Open WhatsApp
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${shareTitle}\n\n${shareUrl}`)}`,
        '_blank'
      );

      // Send to backend
      await fetch(`/api/creations/${creationId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts }),
      });

      triggerCelebration("Shared with family! 👨👩👧");
    } catch (err) {
      console.error("Error sharing creation:", err);
      triggerCelebration("Oops! Try again! 🤔");
    }
  };

  async function handleNimiSend(message: string) {
    setNimiMessages(prev => [...prev, { sender: 'user', text: message }]);
    setIsNimiTyping(true);

    try {
      const res = await fetch("/api/nimi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are Nimi, a friendly art assistant for toddlers ages 2-4. Use very simple words (1-2 syllables), short sentences (3-5 words), and lots of emojis. Focus on colors, shapes, and feelings.`,
            },
            ...nimiMessages.map(msg => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text,
            })),
            { role: "user", content: message },
          ],
          childName: "Emma",
          language: "en",
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
      setNimiMessages(prev => [...prev, { 
        sender: 'nimi', 
        text: data.response || "Hmm, ask me about colors! 🎨" 
      }]);
    } catch (err) {
      console.error("Nimi error:", err);
      setNimiMessages(prev => [...prev, { 
        sender: 'nimi', 
        text: "Oops! Try again! 🤔" 
      }]);
    } finally {
      setIsNimiTyping(false);
    }
  }

  const SkeletonCard = () => (
    <div className="animate-pulse bg-white rounded-lg h-64 shadow-lg" />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-900">
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
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

      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Friends Gallery
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            See what your friends made! 🎨
          </p> 
        </div>

        <Card className="mb-8 bg-gradient-to-r from-pink-100 to-purple-100 border-none shadow-xl relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <Sparkles className="w-8 h-8 mr-3 text-pink-600" />
              <span>Show My Drawing!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => {
                setNimiMessages(prev => [...prev, {sender: 'nimi', text: "Let's share your drawing! Tap the camera to take a photo or choose one from your gallery. 📸🎨"}]);
                setShowUploadModal(true);
              }}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-6 rounded-full text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
              size="lg"
            >
              <Camera className="w-8 h-8 mr-3" />📷 Show My Art
            </Button>
          </CardContent>
        </Card>

        {friendOfTheWeek && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-100 to-orange-100 border-none shadow-xl relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-2xl">
                <Trophy className="w-8 h-8 mr-3 text-yellow-600" />
                <span>🌟 Friend of the Week</span>
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
                  {friendOfTheWeek.avatar}
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{friendOfTheWeek.name}</h3>
                <p className="text-center text-gray-700 mb-4">
                  Say hello to {friendOfTheWeek.name}! 👋
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
            <Sparkles className="w-8 h-8 mr-3 text-pink-500" />
            Friends' Art
          </h2>
          
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[600px] overflow-y-auto"
            ref={creationsContainerRef}
          >
            {loadingCreations && creations.length === 0 ? (
              Array(6).fill(null).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              creations.map(creation => (
                <div key={creation.id} className="relative">
                  <EnhancedCreationCard
                    creation={creation}
                    onLike={handleLoveCreation}
                    onComment={handleAddComment}
                    onShare={handleSharePrivate}
                    onClick={setSelectedCreation}
                    showReactions={true}
                  />
                  
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
          </div>
        </div>

        <NimiChatCard 
          messages={nimiMessages}
          onSend={handleNimiSend}
          isTyping={isNimiTyping}
        />
            
        <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-none shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">More Fun Coming!</h3>
            <p className="text-gray-700 mb-6">New ways to play with friends soon! 👋</p>
          </CardContent>
        </Card>
      </main>

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
          childName={childNameFromContext}
        />
      )}

      <Footer />
      <BottomNavigation />
    </div>
  );
}