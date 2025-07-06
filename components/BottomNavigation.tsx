"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Target, BarChart3, Trophy, Settings } from "lucide-react"

export default function BottomNavigation() {
  const pathname = usePathname()

  const navigation = [
    { name: "Home", href: "/", icon: Home, emoji: "🏠" },
    { name: "Missions", href: "/missions", icon: Target, emoji: "🎯" },
    { name: "Progress", href: "/progress", icon: BarChart3, emoji: "📈" },
    { name: "Rewards", href: "/piko-peaks", icon: Trophy, emoji: "🏆" },
    { name: "Settings", href: "/settings", icon: Settings, emoji: "⚙️" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t-4 border-gradient-to-r from-orange-200 to-pink-200 md:hidden z-50 shadow-2xl">
      <div className="flex items-center justify-around py-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 text-center transition-all duration-300 transform ${
                isActive ? "text-orange-500 scale-110" : "text-gray-500 hover:text-orange-500 hover:scale-105"
              }`}
            >
              <div className={`relative ${isActive ? "animate-bounce" : ""}`}>
                <item.icon className="w-6 h-6 mb-1" />
                {isActive && <div className="absolute -top-1 -right-1 text-lg">{item.emoji}</div>}
              </div>
              <span className={`text-xs font-bold ${isActive ? "text-orange-600" : ""}`}>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
