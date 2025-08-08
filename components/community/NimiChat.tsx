"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Mic, Volume2, VolumeX, AlertCircle } from "lucide-react";

interface UserMessage {
  sender: 'user' | 'nimi';
  text: string;
}

interface NimiChatProps {
  messages: UserMessage[];
  isTyping: boolean;
  onSend: (message: string) => Promise<void>;
  currentUser: { name: string; avatar: string };
  voiceEnabled?: boolean;
  textToSpeechEnabled?: boolean;
}

export const NimiChat = ({ 
  messages, 
  isTyping, 
  onSend, 
  currentUser,
  voiceEnabled = true,
  textToSpeechEnabled = true
}: NimiChatProps) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [browserSupport, setBrowserSupport] = useState({
    speechSynthesis: false,
    speechRecognition: false,
  });
  const [voicesReady, setVoicesReady] = useState(false);
  const [permissions, setPermissions] = useState({
    microphone: 'prompt' as 'granted' | 'denied' | 'prompt',
  });

  // Initialize browser capabilities and permissions
  useEffect(() => {
    // Check browser support
    setBrowserSupport({
      speechSynthesis: 'speechSynthesis' in window,
      speechRecognition: 'webkitSpeechRecognition' in window,
    });

    // Load voices if supported
    if ('speechSynthesis' in window) {
      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices();
        setVoicesReady(voices.length > 0);
      };

      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      handleVoicesChanged(); // Initial check

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
    }
  }, []);

  // Check microphone permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (navigator.permissions) {
          const micStatus = await navigator.permissions.query({ 
            name: 'microphone' as any 
          });
          setPermissions(prev => ({ ...prev, microphone: micStatus.state }));
          
          micStatus.onchange = () => {
            setPermissions(prev => ({ ...prev, microphone: micStatus.state }));
          };
        }
      } catch (error) {
        console.log("Permission API not fully supported");
      }
    };

    checkPermissions();
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSend = async () => {
    const input = chatInputRef.current;
    if (!input || !input.value.trim()) return;

    try {
      setError(null);
      const message = input.value.trim();
      input.value = '';
      await onSend(message);
    } catch (err) {
      setError("Failed to send message. Please try again.");
      console.error("Send error:", err);
    }
  };

  const startVoiceInput = async () => {
    if (!browserSupport.speechRecognition) {
      setError("Voice input not supported in your browser");
      return;
    }

    if (permissions.microphone === 'denied') {
      setError(
        <span>
          Microphone access was blocked. Please enable it in your 
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              // Try to trigger permission prompt again
              navigator.mediaDevices.getUserMedia({ audio: true })
                .catch(() => setError("Please enable microphone in browser settings"));
            }}
            className="underline ml-1"
          >
            browser settings
          </a>.
        </span>
      );
      return;
    }

    try {
      // Initialize recognition if not already done
      if (!recognitionRef.current) {
        recognitionRef.current = new (window as any).webkitSpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onerror = (event: any) => {
          setIsListening(false);
          handleRecognitionError(event.error);
        };

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (chatInputRef.current) {
            chatInputRef.current.value = transcript;
            handleSend();
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }

      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      
      setIsListening(true);
      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      console.error("Microphone access error:", err);
      setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      setError("Couldn't access microphone. Please check permissions.");
      setIsListening(false);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleRecognitionError = (error: string) => {
    switch(error) {
      case 'no-speech':
        setError("No speech detected. Please speak clearly.");
        break;
      case 'audio-capture':
        setError("No microphone found. Please check your audio devices.");
        break;
      case 'not-allowed':
        setError("Microphone access denied. Please enable it in browser settings.");
        break;
      default:
        setError("Voice input failed. Please try again.");
    }
  };

  const speakMessage = async () => {
    if (!browserSupport.speechSynthesis) {
      setError("Text-to-speech not supported in your browser");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const lastNimiMessage = [...messages].reverse().find(m => m.sender === 'nimi');
    if (!lastNimiMessage?.text?.trim()) {
      setError("No message available to speak");
      return;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      utteranceRef.current = new SpeechSynthesisUtterance(lastNimiMessage.text);
      
      // Configure voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.includes('en') && v.name.includes('Female')
      ) || voices.find(v => v.lang.includes('en')) || null;
      
      if (preferredVoice) {
        utteranceRef.current.voice = preferredVoice;
      }
      
      utteranceRef.current.rate = 0.9;
      utteranceRef.current.pitch = 1.1;
      utteranceRef.current.volume = 1;

      // Event handlers
      utteranceRef.current.onerror = (event) => {
        console.error("Speech error:", event);
        setIsSpeaking(false);
        setError("Couldn't speak the message. Please try again.");
      };

      utteranceRef.current.onend = () => {
        setIsSpeaking(false);
      };

      utteranceRef.current.onboundary = () => {
        // Keep the utterance alive in Chrome
      };

      setIsSpeaking(true);
      window.speechSynthesis.speak(utteranceRef.current);

      // Check if speech actually started (Chrome autoplay policy)
      setTimeout(() => {
        if (!window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          setError("Please click the button again to allow speech");
        }
      }, 300);

    } catch (err) {
      console.error("Speech error:", err);
      setIsSpeaking(false);
      setError("Failed to initialize speech. Please try again.");
    }
  };

  const ErrorMessage = () => {
    if (!error) return null;

    const isPermissionError = typeof error === 'string' && 
      (error.includes('access') || error.includes('allow') || error.includes('denied'));

    return (
      <div className={`mb-3 p-3 rounded-md flex items-start ${isPermissionError ? 'bg-blue-50 border border-blue-200 text-blue-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
        <AlertCircle className="flex-shrink-0 mr-2" size={16} />
        <div className="flex-1">
          <div className="text-sm">{error}</div>
          {isPermissionError && (
            <button 
              onClick={() => {
                setError(null);
                if (typeof error === 'string' && error.includes('microphone')) {
                  startVoiceInput();
                } else if (typeof error === 'string' && error.includes('speech')) {
                  speakMessage();
                }
              }}
              className="mt-2 text-sm font-medium underline"
            >
              Try Again
            </button>
          )}
        </div>
        <button 
          onClick={() => setError(null)}
          className="p-1 -mt-1 -mr-1 hover:bg-opacity-10 hover:bg-current rounded"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat messages */}
      <div className="flex-1 p-4 bg-white rounded-lg border border-gray-200 overflow-y-auto mb-4 shadow-inner">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="text-4xl mb-4">🤖</div>
            <p>Hello {currentUser.name}! I'm Nimi.</p>
            <p>What would you like to chat about today?</p>
          </div>
        ) : (
          messages.map((msg, i) => (
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
          ))
        )}
        
        {isTyping && (
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
      
      {/* Error message */}
      <ErrorMessage />
      
      {/* Input area */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            ref={chatInputRef}
            type="text"
            placeholder="Chat with Nimi about anything..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isTyping) {
                handleSend();
              }
            }}
            disabled={isTyping || isListening}
          />
          <Button
            onClick={handleSend}
            disabled={isTyping || isListening}
            size="icon"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isTyping ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </div>
        <p className="text-xs text-center text-gray-500">
          Nimi loves talking about art, creativity, and your creations!
        </p>
      </div>
    </div>
  );
};