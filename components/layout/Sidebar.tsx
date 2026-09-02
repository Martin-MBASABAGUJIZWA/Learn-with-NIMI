"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X, LogOut, Crown, ChevronRight } from "lucide-react";
import ChildAvatar from "@/components/avatar/ChildAvatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/AppThemeProvider";
import { getThemeAssets } from "@/lib/design-system/assetRegistry";
import { getActiveSubscription } from "@/lib/payments/products";
import supabase from "@/lib/supabaseClient";
import type { Child } from "@/lib/queries";

interface SidebarProps {
  activeChild: Child | null;
  level: number;
  weekStreak: boolean[];
  streakCount: number;
  isOpen: boolean;
  onClose: () => void;
  onLogoutClick: () => void;
}

const NAV_ITEMS = [
  {
    label: "Home",         href: "/home",          match: (p: string) => p === "/home",
    emoji: "🏠",
    activeBg: "bg-[var(--ds-brand-subtle)]",  activeText: "text-[var(--ds-text-brand)]",
    activeBorder: "border-[var(--ds-border-brand)]/60", activeBar: "bg-[var(--ds-brand-primary)]",
    activeGrad: "linear-gradient(135deg,var(--ds-brand-subtle),var(--ds-brand-soft))", activeColor: "var(--ds-text-brand)", activeShadow: "rgba(15,23,42,0.14)",
    hoverBg: "hover:bg-[var(--ds-brand-soft)] hover:text-[var(--ds-text-brand)]",
  },
  {
    label: "Stories",      href: "/stories",       match: (p: string) => p.startsWith("/stories"),
    emoji: "📚",
    activeBg: "bg-[var(--ds-brand-subtle)]",  activeText: "text-[var(--ds-text-brand)]",
    activeBorder: "border-[var(--ds-border-brand)]/60", activeBar: "bg-[var(--ds-brand-primary)]",
    activeGrad: "linear-gradient(135deg,#EEF2FF,#DBEAFE)", activeColor: "#4338CA", activeShadow: "rgba(67,56,202,0.18)",
    hoverBg: "hover:bg-indigo-50 hover:text-indigo-700",
  },
  {
    label: "Challenges",   href: "/treasure",      match: (p: string) => p.startsWith("/treasure"),
    emoji: "🏆",
    activeBg: "bg-amber-50",    activeText: "text-amber-700",
    activeBorder: "border-amber-200/60",   activeBar: "bg-amber-500",
    activeGrad: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", activeColor: "#B45309", activeShadow: "rgba(180,83,9,0.18)",
    hoverBg: "hover:bg-amber-50 hover:text-amber-700",
  },
  {
    label: "Community",    href: "/community",     match: (p: string) => p.startsWith("/community"),
    emoji: "👥",
    activeBg: "bg-cyan-50",     activeText: "text-cyan-700",
    activeBorder: "border-cyan-200/60",    activeBar: "bg-cyan-500",
    activeGrad: "linear-gradient(135deg,#ECFEFF,#CFFAFE)", activeColor: "#0E7490", activeShadow: "rgba(14,116,144,0.18)",
    hoverBg: "hover:bg-cyan-50 hover:text-cyan-700",
  },
  {
    label: "Talk to Nimi", href: "/talk-to-nimi",  match: (p: string) => p.startsWith("/talk-to-nimi"),
    emoji: "🤖",
    activeBg: "bg-violet-50",   activeText: "text-violet-700",
    activeBorder: "border-violet-200/60",  activeBar: "bg-violet-500",
    activeGrad: "linear-gradient(135deg,#F5F3FF,#EDE9FE)", activeColor: "#6D28D9", activeShadow: "rgba(109,40,217,0.18)",
    hoverBg: "hover:bg-violet-50 hover:text-violet-700",
  },
  {
    label: "Star Shop",    href: "/shop",          match: (p: string) => p.startsWith("/shop"),
    emoji: "🛍️",
    activeBg: "bg-orange-50",   activeText: "text-orange-700",
    activeBorder: "border-orange-200/60",  activeBar: "bg-orange-500",
    activeGrad: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", activeColor: "#C2410C", activeShadow: "rgba(194,65,12,0.18)",
    hoverBg: "hover:bg-orange-50 hover:text-orange-700",
  },
  {
    label: "Masterpiece",  href: "/masterpiece",   match: (p: string) => p.startsWith("/masterpiece"),
    emoji: "👑",
    activeBg: "bg-yellow-50",   activeText: "text-yellow-700",
    activeBorder: "border-yellow-200/60",  activeBar: "bg-yellow-500",
    activeGrad: "linear-gradient(135deg,#FEFCE8,#FEF9C3)", activeColor: "#A16207", activeShadow: "rgba(161,98,7,0.18)",
    hoverBg: "hover:bg-yellow-50 hover:text-yellow-700",
  },
  {
    label: "Profile",      href: "/user-profile",  match: (p: string) => p.startsWith("/user-profile"),
    emoji: "👤",
    activeBg: "bg-teal-50",     activeText: "text-teal-700",
    activeBorder: "border-teal-200/60",    activeBar: "bg-teal-500",
    activeGrad: "linear-gradient(135deg,#F0FDFA,#CCFBF1)", activeColor: "#0F766E", activeShadow: "rgba(15,118,110,0.18)",
    hoverBg: "hover:bg-teal-50 hover:text-teal-700",
  },
  {
    label: "Parents",      href: "/parents",       match: (p: string) => p.startsWith("/parents"),
    emoji: "👨‍👩‍👧",
    activeBg: "bg-blue-50",     activeText: "text-blue-700",
    activeBorder: "border-blue-200/60",    activeBar: "bg-blue-500",
    activeGrad: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", activeColor: "#1D4ED8", activeShadow: "rgba(29,78,216,0.18)",
    hoverBg: "hover:bg-blue-50 hover:text-blue-700",
  },
];

export default function Sidebar({ activeChild, isOpen, onClose, onLogoutClick }: SidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { themeId } = useAppTheme();
  const assets = getThemeAssets(themeId);
  const [isClub, setIsClub]         = useState<boolean | null>(null);
  const [parentName, setParentName] = useState<string>("");
  const [parentAvatar, setParentAvatar] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsClub(false); return; }
      const [sub, row] = await Promise.all([
        getActiveSubscription(user.id),
        supabase.from("parents").select("name").eq("id", user.id).maybeSingle(),
      ]);
      setIsClub(sub !== null);
      setParentName(row.data?.name ?? user.email?.split("@")[0] ?? "Parent");
    })();
    const stored = typeof window !== "undefined" ? localStorage.getItem("nimipiko-parent-avatar") : null;
    setParentAvatar(stored);
  }, []);

  const content = (
    <div className="relative z-10 flex flex-col px-3 py-4 flex-1">
      {/* Ambient texture layers */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at top right, rgba(255,255,255,0.6), transparent 42%), url('${assets.navigation.particles}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.8,
        }}
      />
      <div
        className="pointer-events-none absolute bottom-4 right-3 w-16 h-16 opacity-70"
        style={{
          backgroundImage: `url('${assets.navigation.ornaments}')`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          filter: "drop-shadow(0 4px 10px rgba(15,23,42,0.08))",
        }}
      />

      {/* Close — mobile only */}
      <button
        onClick={onClose}
        aria-label="Close menu"
        className="lg:hidden absolute right-3 top-4 text-[var(--ds-text-secondary)] hover:text-[var(--ds-brand-primary)] p-1 transition z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Brand portal */}
      <Link
        href="/home"
        onClick={onClose}
        className="flex flex-col items-center mb-6 leaf border border-[var(--ds-border-primary)]/70 bg-[var(--ds-surface-card)]/90 p-2 shadow-[0_12px_26px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:scale-[1.01]"
      >
        <Image
          src={assets.nimiLogo}
          alt="NIMIPIKO"
          width={72}
          height={72}
          className="w-[72px] h-[72px] rounded-full border-2 border-white shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
        />
        <Image
          src={assets.nimiLogoText}
          alt="NIMIPIKO"
          width={140}
          height={28}
          className="h-7 mt-1.5"
          style={{ width: "auto" }}
        />
        <p className="mt-1 px-2 py-0.5 rounded-full bg-[var(--ds-brand-soft)] text-5xs font-bold text-[var(--ds-brand-primary)] select-none">
          🌟 Learn • Play • Grow 🌟
        </p>
      </Link>

      {/* Adventure nav */}
      <nav aria-label="Main navigation" className="flex flex-col gap-1.5">
        {NAV_ITEMS.map(item => {
          const isActive = item.match(pathname);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex items-center gap-3 px-3 py-2.5 leaf font-baloo font-black text-sm transition-all duration-200 active:scale-[0.97] ${
                isActive
                  ? "shadow-md"
                  : `border border-transparent text-[var(--ds-text-secondary)] ${item.hoverBg} hover:shadow-sm`
              }`}
              style={
                isActive
                  ? {
                      background: item.activeGrad,
                      color: item.activeColor,
                      boxShadow: `0 4px 14px ${item.activeShadow}`,
                      border: item.activeColor.startsWith("var(")
                        ? "1.5px solid var(--ds-border-brand)"
                        : `1.5px solid ${item.activeColor}33`,
                    }
                  : undefined
              }
            >
              {/* Emoji destination icon */}
              <span
                className={`text-2xl shrink-0 leading-none transition-transform duration-200 ${
                  isActive ? "scale-110 drop-shadow-sm" : "group-hover:scale-110"
                }`}
              >
                {item.emoji}
              </span>

              {/* Label */}
              <span className="flex-1 leading-tight">{item.label}</span>

              {/* Active sparkle */}
              {isActive && (
                <span className="text-[10px] opacity-50 shrink-0">✦</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Club upsell */}
      {isClub === false && (
        <Link
          href="/pricing"
          onClick={onClose}
          className="mt-6 block border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 leaf p-3 text-center shadow-[0_8px_20px_rgba(245,158,11,0.12)] hover:shadow-[0_10px_24px_rgba(245,158,11,0.2)] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        >
          <Crown className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="font-baloo font-black text-amber-700 text-xs leading-tight">Join Club 👑</p>
          <p className="font-nunito text-amber-600/80 text-4xs leading-snug mt-0.5">Unlock all themes, Nimi AI & more</p>
          <div className="mt-2 bg-amber-500 text-white font-baloo font-black text-2xs px-3 py-1 rounded-full inline-block">
            Upgrade →
          </div>
        </Link>
      )}

      {/* Club member badge */}
      {isClub === true && (
        <div className="mt-6 border border-[var(--ds-border-brand)] bg-[var(--ds-brand-subtle)] leaf p-3 text-center shadow-sm">
          <Crown className="w-5 h-5 text-[var(--ds-text-brand)] mx-auto mb-1" />
          <p className="font-baloo font-black text-[var(--ds-text-brand)] text-xs">Club Member 👑</p>
          <p className="font-nunito text-[var(--ds-text-secondary)] text-4xs mt-0.5">All features unlocked</p>
        </div>
      )}

      {/* "Keep Going!" encouragement — shown only for non-club (avoids double spacing when club badge shown) */}
      {isClub === false && (
        <div className="mt-2 border border-[var(--ds-border-primary)] bg-gradient-to-br from-[var(--ds-surface-card)]/95 via-[var(--ds-brand-soft)]/80 to-[var(--ds-surface-card)]/95 leaf p-4 text-center shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <p className="font-baloo font-black text-[var(--ds-text-primary)] text-sml">{t("keepGoingLabel")}</p>
          <p className="font-nunito text-[var(--ds-text-secondary)] text-4xs leading-snug mt-0.5">{t("keepGoingBody")}</p>
          <div className="text-2xl mt-2">⭐</div>
        </div>
      )}

      {/* Parent account chip */}
      <Link
        href="/parents"
        onClick={onClose}
        className="mt-3 flex items-center gap-2 px-3 py-2.5 leaf border border-[var(--ds-border-primary)] bg-[var(--ds-surface-card)]/80 hover:bg-[var(--ds-surface-card-hover)] transition-all duration-200 group"
      >
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--ds-brand-subtle)] border-2 border-[var(--ds-brand-primary)]/30 flex items-center justify-center">
            {parentAvatar ? (
              <ChildAvatar avatarUrl={parentAvatar} size={32} />
            ) : (
              <span className="text-sml font-black text-[var(--ds-brand-primary)]">
                {parentName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-400 border border-white flex items-center justify-center text-5xs">
            👑
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-baloo font-black text-ds-text text-xs truncate leading-tight">{parentName}</p>
          <p className="text-4xs text-ds-muted font-semibold leading-none mt-0.5">Parent Account</p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-ds-muted shrink-0 group-hover:text-ds-text transition-colors" />
      </Link>

      {/* Logout */}
      <button
        onClick={() => { onClose(); onLogoutClick(); }}
        className="mt-1.5 flex items-center gap-2 px-3 py-2 leaf font-nunito font-bold text-xs bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-200 hover:shadow-sm"
      >
        <LogOut className="w-4 h-4 shrink-0" />
        <span>{t("authLogout")}</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-[200px] lg:z-30 border-r border-[var(--ds-border-primary)] overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90)), url('${assets.navigation.sidebar}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {content}
        </div>
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-[240px] border-r border-[var(--ds-border-primary)] overflow-y-auto"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90)), url('${assets.navigation.sidebar}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {content}
          </aside>
        </>
      )}
    </>
  );
}
