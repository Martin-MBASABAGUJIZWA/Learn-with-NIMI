"use client";

import { Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-white/90 border-t-2 border-pink-200 p-4">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="flex items-center text-pink-500 mb-2">
          <Heart className="w-8 h-8 fill-pink-400 mr-2 animate-pulse" />
          <span className="text-xl font-bold">{t('madeWithLove') || "Made with love"}</span>
          <Heart className="w-8 h-8 fill-pink-400 ml-2 animate-pulse" />
        </div>
        <div className="text-gray-500 text-sm">
          © {new Date().getFullYear()} NIMI Play
        </div>
      </div>
    </footer>
  );
}