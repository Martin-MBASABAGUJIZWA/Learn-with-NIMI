"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Users, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import  launchMagic  from "@/lib/sparkle"

export default function BottomNavigation() {
  const [isClient, setIsClient] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const pathname = usePathname();
  const { t } = useLanguage();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navItems = [
    {
      name: t("home") || "Home",
      href: "/",
      icon: Home,
      activeColor: "bg-pink-200 text-pink-700",
      hoverColor: "hover:bg-pink-100 hover:text-pink-600",
    },
    {
      name: t("mission") || "Mission",
      href: "/missions",
      icon: BookOpen,
      activeColor: "bg-yellow-200 text-yellow-700",
      hoverColor: "hover:bg-yellow-100 hover:text-yellow-600",
    },
    {
      name: t("community") || "Community",
      href: "/community",
      icon: Users,
      activeColor: "bg-purple-200 text-purple-700",
      hoverColor: "hover:bg-purple-100 hover:text-purple-600",
    },
    {
      name: t("surprise") || "Surprise",
      href: "/rewards",
      icon: Sparkles,
      activeColor: "bg-green-200 text-green-700",
      hoverColor: "hover:bg-green-100 hover:text-green-600",
    },
  ];

  if (!isClient) return null;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t-4 border-pink-300 shadow-2xl z-50 h-16 md:h-20"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-full max-w-4xl mx-auto px-2 sm:px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                if (item.href === "/rewards") {
                  e.preventDefault();
                  launchMagic();
                }
              }}
              onMouseEnter={() => setActiveHover(item.href)}
              onMouseLeave={() => setActiveHover(null)}
              className={`group relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 ${
                isActive ? "scale-105" : "scale-100"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Animated background circle */}
              <div className={`absolute inset-0 mx-auto w-16 h-16 rounded-full opacity-0 ${
                activeHover === item.href ? "animate-pulse opacity-20" : ""
              } ${item.activeColor.replace("bg-", "bg-opacity-20 bg-")}`} />

              <div
                className={`relative rounded-full p-2 md:p-3 transition-all duration-300 ${
                  isActive 
                    ? `${item.activeColor} shadow-md` 
                    : `bg-gray-100 text-gray-500 ${item.hoverColor}`
                } ${
                  activeHover === item.href ? "scale-110 rotate-3" : ""
                }`}
              >
                <item.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-transform duration-200" />
              </div>
              
              <span className={`text-xs sm:text-sm font-bold mt-1 transition-all duration-200 ${
                isActive 
                  ? "text-black font-extrabold" 
                  : "text-gray-600 group-hover:text-black"
              } truncate max-w-full px-1`}>
                {item.name}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 w-4 h-1 rounded-full bg-pink-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}