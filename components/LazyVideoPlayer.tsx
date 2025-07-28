"use client";

import React from "react";

interface LazyVideoPlayerProps {
  videoUrl: string;
  onClose: () => void;
}

const LazyVideoPlayer: React.FC<LazyVideoPlayerProps> = ({ videoUrl, onClose }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        autoPlay
        className="max-w-full max-h-[80vh] rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        playsInline
      />
    </div>
  );
};

export default LazyVideoPlayer;