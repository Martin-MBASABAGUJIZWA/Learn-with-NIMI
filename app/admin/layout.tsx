'use client'

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpenText,
  Flag,
  NotebookText,
  Palette,
  Settings,
  LogOut,
  Bell,
} from "lucide-react";
import  supabase  from "@/lib/supabaseClient";

const navItems = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard, color: "text-pink-500" },
  { name: "Students", path: "/admin/students", icon: GraduationCap, color: "text-blue-500" },
  { name: "Courses", path: "/admin/courses", icon: BookOpenText, color: "text-green-500" },
  { name: "Missions", path: "/admin/daily_missions", icon: Flag, color: "text-yellow-500" },
  { name: "Submissions", path: "/admin/student_submissions", icon: NotebookText, color: "text-purple-500" },
  { name: "Reflections", path: "/admin/reflections", icon: Palette, color: "text-orange-500" },
  { name: "Settings", path: "/admin/settings", icon: Settings, color: "text-gray-500" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const userId = "admin-user-id"; // Replace with real session logic
      const { data, error } = await supabase
        .from("admins")
        .select("name, role")
        .eq("id", userId)
        .single();

    }
    fetchUser();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f9f7f2] font-sans">
      {/* Sidebar */}
      <aside
        className="w-72 fixed h-full bg-white border-r-2 border-[#f0e6d2] p-5 z-50"
        style={{
          backgroundImage: "radial-gradient(#f0e6d2 1px, transparent 1px)",
          backgroundSize: "15px 15px",
        }}
      >
        <div className="flex items-center space-x-3 mb-8">
          <img src="/nimi-logo.png" alt="NIMI Logo" className="w-12 h-12 rounded-md" />
          <h1 className="text-2xl font-bold text-[#5e548e]">
            <span className="text-[#ff9a9e]">NIMI</span> Admin
          </h1>
        </div>

        <nav className="space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all 
                hover:bg-[#fff5e6] hover:translate-x-1 ${item.color}`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium text-gray-700">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-5 right-5">
          <Link
            href="/admin/logout"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-[#fff5e6] text-gray-500"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </Link>
        </div>

        {user && (
          <div className="absolute bottom-20 left-5 right-5 flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-[#ffb7b2] flex items-center justify-center text-white font-medium uppercase">
              {user.name.charAt(0)}
            </div>
            <span className="font-medium text-[#5e548e]">{user.role}</span>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-72">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ff9a9e]"
            />
          </div>

          {/* Notification and Profile */}
          <div className="flex items-center space-x-6 ml-6">
            {/* Notifications */}
            <button className="relative text-gray-600 hover:text-[#ff9a9e]">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
            </button>

            {/* Admin Profile */}
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-[#ffb7b2] flex items-center justify-center text-white font-medium uppercase">
                  {user.name.charAt(0)}
                </div>
                <span className="text-gray-700 font-medium">{user.name}</span>
              </div>
            ) : (
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
            )}
          </div>
        </header>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
