// components/Header.tsx
'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Target,
  Users,
  Globe,
  ChevronDown,
  Star,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, translations } from "@/contexts/LanguageContext";

const languages = [
  { code: "en", label: "English", flag: "/flags/us.svg" },
  { code: "fr", label: "Français", flag: "/flags/fr.svg" },
  { code: "es", label: "Español", flag: "/flags/es.svg" },
  { code: "rw", label: "Kinyarwanda", flag: "/flags/rw.svg" },
  { code: "sw", label: "Swahili", flag: "/flags/tz.svg" },
];

export default function Header() {
  const pathname = usePathname();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  const navigation = [
    { name: t("missions"), href: "/missions", icon: Target },
    { name: t("community"), href: "/community", icon: Users },
  ];

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as any);
    setShowLangDropdown(false);
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-xl border-b-4 border-gradient-to-r from-orange-200 to-pink-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-4 group">
            <div className="
              relative w-14 h-14 
              bg-gradient-to-br from-orange-500 to-pink-500 
              rounded-full flex items-center justify-center shadow-xl
              transition-shadow duration-300 ease-in-out
              group-hover:shadow-2xl
              group-hover:scale-110
              transform
              "
            >
              <img src="/nimi-logo.png" alt="NIMI Home" className="w-12 h-12 rounded-full object-contain" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                <Star className="w-3 h-3 text-white" />
              </div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-pink-400 rounded-full animate-bounce"></div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded select-none">
                  {t("home")}
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent select-none">
                NIMI
              </h1>
              <p className="text-sm text-gray-600 font-semibold select-none">
                {t("dailyVictories")}
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-bold
                    transition-all duration-300 ease-in-out transform
                    ${isActive
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-xl scale-110"
                      : "text-gray-700 hover:text-white hover:shadow-lg hover:scale-110 hover:bg-gradient-to-r hover:from-orange-400 hover:to-pink-400"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 transition-colors duration-300" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="
                  flex items-center space-x-2 text-sm text-gray-600
                  bg-white/90 px-4 py-2 rounded-full shadow-lg
                  transition-shadow transform duration-300 ease-in-out
                  hover:shadow-xl hover:scale-105
                  focus:outline-none focus:ring-2 focus:ring-orange-400
                "
                aria-label="Change language"
                aria-expanded={showLangDropdown}
              >
                <Globe className="w-4 h-4 text-orange-500 transition-colors duration-300" />
                <img 
                  src={currentLanguage.flag} 
                  alt={currentLanguage.label} 
                  className="w-6 h-4 rounded-sm select-none" 
                />
                <span className="font-semibold select-none">
                  {currentLanguage.code.toUpperCase()}
                </span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${
                  showLangDropdown ? "transform rotate-180" : ""
                }`} />
              </button>

              {showLangDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg z-50 border border-gray-200"
                  role="menu"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className="
                        flex items-center px-4 py-2 text-sm text-gray-700 w-full
                        hover:bg-orange-100 hover:text-orange-700 transition-colors duration-200
                        select-none
                      "
                      role="menuitem"
                    >
                      <img 
                        src={lang.flag} 
                        alt={lang.label} 
                        className="w-5 h-3 mr-2 rounded-sm" 
                      />
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile */}
            <Link href="/user-profile">
              <Button className="
                bg-gradient-to-r from-purple-500 to-pink-500
                hover:from-purple-600 hover:to-pink-600
                text-white rounded-full p-3 shadow-lg
                transition-shadow transform duration-300 ease-in-out
                hover:shadow-xl hover:scale-110
                focus:outline-none focus:ring-2 focus:ring-purple-400
              ">
                <User className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}