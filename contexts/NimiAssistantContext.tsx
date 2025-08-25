'use client';

import React from "react";
import { useNimiReader } from "@/contexts/NimiReaderContext";

interface NimiAssistantProps {
  mood: string;
}

const NimiAssistant = ({ mood }: NimiAssistantProps) => {
  const { 
    isReaderActive, 
    toggleReader, 
    currentContent, 
    isReading,
    startReading,
    stopReading 
  } = useNimiReader();

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-purple-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-purple-700">Nimi Assistant</h3>
        <button
          onClick={toggleReader}
          className={`p-2 rounded-full ${isReaderActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
          title={isReaderActive ? "Turn off reader" : "Turn on reader"}
        >
          {isReaderActive ? "🔊" : "🔇"}
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-4xl">
          {mood === "happy" ? "😊" : mood === "sad" ? "😢" : "😐"}
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">
            {isReading ? "Reading..." : currentContent || "Ready to help!"}
          </p>
          
          {isReaderActive && currentContent && (
            <div className="flex gap-2">
              <button
                onClick={startReading}
                disabled={isReading}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded disabled:opacity-50"
              >
                Read Again
              </button>
              <button
                onClick={stopReading}
                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
              >
                Stop
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NimiAssistant;