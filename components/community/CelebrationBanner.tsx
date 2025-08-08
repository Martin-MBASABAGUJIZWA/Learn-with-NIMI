import React from "react";
import { motion } from "framer-motion";

interface CelebrationBannerProps {
  isVisible: boolean;
  text: string;
}

export const CelebrationBanner = ({ isVisible, text }: CelebrationBannerProps) => {
  if (!isVisible) return null;

  return (
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
        {text} 🎉
      </motion.div>
    </motion.div>
  );
};