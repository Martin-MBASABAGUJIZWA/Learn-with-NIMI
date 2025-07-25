"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Star, Gift, Volume2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { speak } from "@/lib/speak";

export default function BottomNavigation() {
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const { t, language } = useLanguage();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navItems = [
    { 
      name: t('play') || "Play", 
      href: "/", 
      icon: Home,
      activeColor: "text-pink-600"
    },
    { 
      name: t('stars') || "Stars", 
      href: "/progress", 
      icon: Star,
      activeColor: "text-yellow-500" 
    },
    { 
      name: t('prizes') || "Prizes", 
      href: "/rewards", 
      icon: Gift,
      activeColor: "text-purple-500"
    },
  ];

  if (!isClient) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 border-t-2 border-pink-200 shadow-lg z-50 h-20">
      <div className="flex items-center justify-around h-full max-w-4xl mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive ? item.activeColor : "text-gray-500"
              }`}
            >
              <item.icon className={`w-8 h-8 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className="text-xs font-bold mt-1">{item.name}</span>
            </Link>
          );
        })}
        
        <button 
          onClick={() => speak(t('letsPlay') || "Let's play!", language)}
          className="flex flex-col items-center justify-center flex-1 h-full text-blue-500"
        >
          <Volume2 className="w-8 h-8" />
          <span className="text-xs font-bold mt-1">{t('voice') || "Voice"}</span>
        </button>
      </div>
    </nav>
  );
}