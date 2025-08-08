import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface ErrorToastProps {
  error: string | null;
  onDismiss: () => void;
}

export const ErrorToast = ({ error, onDismiss }: ErrorToastProps) => {
  if (!error) return null;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center"
    >
      {error}
      <button 
        onClick={onDismiss}
        className="ml-3 p-1 rounded-full hover:bg-red-600"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};