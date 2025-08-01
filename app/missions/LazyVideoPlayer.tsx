"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function LazyVideoPlayer({
  videoUrl,
  onClose,
}: {
  videoUrl: string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.error("Video play failed:", e));
    }
  }, [videoUrl]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative w-full max-w-4xl">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-yellow-300 text-3xl z-10"
          aria-label="Close video"
        >
          ✕
        </button>
        
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full max-h-[90vh] rounded-lg"
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </motion.div>
  );
}