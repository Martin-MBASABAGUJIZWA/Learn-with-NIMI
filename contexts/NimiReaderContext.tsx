"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface NimiReaderContextType {
  isReaderActive: boolean;
  toggleReader: () => void;
  currentContent: string;
  setCurrentContent: (content: string) => void;
  isReading: boolean;
  startReading: () => void;
  stopReading: () => void;
}

const NimiReaderContext = createContext<NimiReaderContextType | undefined>(undefined);

export function NimiReaderProvider({ children }: { children: React.ReactNode }) {
  const [isReaderActive, setIsReaderActive] = useState(false);
  const [currentContent, setCurrentContent] = useState("");
  const [isReading, setIsReading] = useState(false);

  const toggleReader = () => setIsReaderActive((prev) => !prev);
  
  const startReading = () => {
    if (currentContent && isReaderActive) {
      setIsReading(true);
      // Here you would integrate with your text-to-speech API
      console.log("Starting to read:", currentContent);
    }
  };
  
  const stopReading = () => {
    setIsReading(false);
    // Stop the text-to-speech here
    console.log("Stopping reading");
  };

  // Auto-read when content changes and reader is active
  useEffect(() => {
    if (isReaderActive && currentContent) {
      startReading();
    }
  }, [currentContent, isReaderActive]);

  return (
    <NimiReaderContext.Provider value={{ 
      isReaderActive, 
      toggleReader, 
      currentContent, 
      setCurrentContent,
      isReading,
      startReading,
      stopReading
    }}>
      {children}
    </NimiReaderContext.Provider>
  );
}

export function useNimiReader() {
  const context = useContext(NimiReaderContext);
  if (!context) {
    throw new Error("useNimiReader must be used within a NimiReaderProvider");
  }
  return context;
}

