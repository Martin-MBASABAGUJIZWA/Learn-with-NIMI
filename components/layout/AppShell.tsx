"use client";

import React, { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Bell, Crown, Flame, Heart, LogOut, Search, Settings, Trophy, User, X } from "lucide-react";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { getChildren, getWeekStreak, getTotalStars, getActivityDates, getChildBadges, getCurrentLevel, updateChildLanguage, getChildCosmetics, getCurriculumMissions, getActiveStories, getStreakShieldsPurchased, getUsedShieldDates } from "@/lib/queries";
import { getStoryLibrary } from "@/lib/storyRepository";
import { computeStreaks } from "@/lib/parentInsights";
import { resolveShields } from "@/lib/streakShields";
import type { Child, ChildCosmetics } from "@/lib/queries";
import { SHOP_ITEM_MAP } from "@/components/shop/_shopData";
import Sidebar from "./Sidebar";
import LogoutModal from "./LogoutModal";
import LanguageSwitchDialog from "@/components/LanguageSwitchDialog";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import UpdateToast from "@/components/pwa/UpdateToast";
import { useSwUpdate } from "@/hooks/useSwUpdate";
import BottomNavBar from "@/components/home/BottomNavBar";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import NotificationPanel from "@/components/layout/NotificationPanel";
import Flag from "@/components/ui/Flag";
import { useAppTheme } from "@/contexts/AppThemeProvider";
import { getThemeAssets } from "@/lib/design-system/assetRegistry";
import { getComponentVariant } from "@/lib/design-system/componentVariants";
import { MotionConfig } from "framer-motion";
import ChildAvatar from "@/components/avatar/ChildAvatar";
import supabase from "@/lib/supabaseClient";
import { getActiveSubscription } from "@/lib/payments/products";

const ACTIVE_CHILD_KEY = "nimipiko_active_child";

const LEVEL_LABELS: Record<number, string> = {
  1: "Sprout", 2: "Explorer", 3: "Creator", 4: "Champion", 5: "Legend",
};
const getLevelLabel = (n: number) => LEVEL_LABELS[Math.min(Math.max(n, 1), 5)] ?? "Explorer";

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English",     flag: "🇬🇧" },
  { code: "fr", label: "Français",    flag: "🇫🇷" },
  { code: "rw", label: "Kinyarwanda", flag: "🇷🇼" },
];

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, setLanguageSilent, t } = useLanguage();
  const { themeId } = useAppTheme();
  const assets = getThemeAssets(themeId);
  const variants = getComponentVariant(themeId);
  const isOnline = useOnlineStatus();
  useOfflineSync();
  const { updateReady } = useSwUpdate();
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const activeChildRef = useRef<Child | null>(null);
  // H26/H27: guard async state setters in childSwitch and languageChange handlers
  const isMounted = useRef(true);
  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [level, setLevel]             = useState(1);
  const [totalStars, setTotalStars]   = useState(0);
  const [gems, setGems]               = useState(0);
  const [weekStreak, setWeekStreak]   = useState<boolean[]>(Array(7).fill(false));
  const [streakCount, setStreakCount] = useState(0);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [showLogout, setShowLogout]   = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingLanguage, setPendingLanguage] = useState<Language | null>(null);
  const [switchingLanguage, setSwitchingLanguage] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cosmetics, setCosmetics] = useState<ChildCosmetics>({ nimi_outfit: null, piko_outfit: null, frame: null, title_badge: null });
  const [trialBannerDays, setTrialBannerDays] = useState<number | null>(null);
  const [trialExpiredBanner, setTrialExpiredBanner] = useState(false);
  const [trialGraceBanner, setTrialGraceBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/loginpage${next}`);
    }
  }, [authLoading, user, router, pathname]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // best-effort — offline caching just won't be available this session
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!user) return; // Don't fetch until auth is confirmed
    let active = true;
    void (async () => {
      const list = await getChildren();
      if (!active) return;
      if (list.length === 0) {
        router.replace("/onboarding");
        return;
      }
      const savedId = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_CHILD_KEY) : null;
      const child = list.find(c => c.id === savedId) ?? list[0] ?? null;
      activeChildRef.current = child;
      if (active) setActiveChild(child);
      if (child) {
        if (active) setLanguageSilent(child.language);
        // Shields (getStreakShieldsPurchased + getUsedShieldDates) now run in
        // parallel with everything else. resolveShields below hits the warm
        // qcached results — zero extra network round-trips.
        const [ws, dates, , , badges, cos] = await Promise.all([
          getWeekStreak(child.id, child.language),
          getActivityDates(child.id, child.language),
          getTotalStars(child.id, child.language).then(v => { if (active) setTotalStars(v); }),
          getCurrentLevel(child.id, child.language).then(v => { if (active) setLevel(v); }),
          getChildBadges(child.id, child.language),
          getChildCosmetics(child.id),
          getStreakShieldsPurchased(child.id),
          getUsedShieldDates(child.id, child.language),
        ]);
        if (!active) return;
        setWeekStreak(ws);
        const { usedDates } = await resolveShields(child.id, child.language, dates);
        if (!active) return;
        setStreakCount(computeStreaks(dates, new Date(), usedDates).current);
        setGems(badges.length);
        setCosmetics(cos);

        // Warm the cache for the most common navigation destinations so that
        // /missions, /stories, and /treasure feel instant when the user taps them.
        void getCurriculumMissions(child.id);
        void getStoryLibrary(child.id, child.language);
        void getActiveStories();
      }

      // Trial banner logic — non-blocking, runs after children load
      // `user` is already in scope from the outer effect guard (line 105)
      void (async () => {
        const sub = await getActiveSubscription(user.id);
        if (!active) return;
        if (sub?.payment_provider === "trial" && sub.current_period_end) {
          // Grace period: status is 'expired' but within 24h — show specific copy
          if ((sub as { status?: string }).status === "expired") {
            setTrialGraceBanner(true);
          } else {
            const daysLeft = Math.max(0, Math.ceil((new Date(sub.current_period_end).getTime() - Date.now()) / 86_400_000));
            if (daysLeft <= 3) setTrialBannerDays(daysLeft);
          }
        } else if (!sub) {
          // Check for a recently expired trial (within 7 days) to show the "trial ended" banner
          const { data: expired } = await supabase
            .from("nimipiko_subscriptions")
            .select("id")
            .eq("parent_id", user.id)
            .eq("payment_provider", "trial")
            .eq("status", "expired")
            .gte("updated_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
            .limit(1)
            .maybeSingle();
          if (active && expired) setTrialExpiredBanner(true);
        }
      })();
    })();
    return () => { active = false; };
  }, [user, router]);

  // Listen for cosmetics changes from the shop (equip/unequip)
  useEffect(() => {
    const handler = (e: Event) => {
      const cos = (e as CustomEvent<{ cosmetics: ChildCosmetics }>).detail?.cosmetics;
      if (cos) setCosmetics(cos);
    };
    window.addEventListener("app:cosmeticsChange", handler);
    return () => window.removeEventListener("app:cosmeticsChange", handler);
  }, []);

  // Listen for active-child switches fired from the parents page
  useEffect(() => {
    const handler = async (e: Event) => {
      const childId = (e as CustomEvent<{ childId: string }>).detail?.childId;
      if (!childId) return;
      const list = await getChildren();
      const child = list.find(c => c.id === childId) ?? null;
      if (!child) return;
      activeChildRef.current = child;
      setActiveChild(child);
      setLanguageSilent(child.language as Language);
      const [ws, dates, , , badges, cos] = await Promise.all([
        getWeekStreak(child.id, child.language),
        getActivityDates(child.id, child.language),
        getTotalStars(child.id, child.language).then(v => { if (isMounted.current) setTotalStars(v); }),
        getCurrentLevel(child.id, child.language).then(v => { if (isMounted.current) setLevel(v); }),
        getChildBadges(child.id, child.language),
        getChildCosmetics(child.id),
      ]);
      if (!isMounted.current) return;
      setWeekStreak(ws);
      const { usedDates } = await resolveShields(child.id, child.language, dates);
      if (!isMounted.current) return;
      setStreakCount(computeStreaks(dates, new Date(), usedDates).current);
      setGems(badges.length);
      setCosmetics(cos);
    };
    window.addEventListener("app:childSwitch", handler as EventListener);
    return () => window.removeEventListener("app:childSwitch", handler as EventListener);
  }, []);

  // Reflects profile edits (name / avatar) saved from any page
  useEffect(() => {
    const handler = (e: Event) => {
      const { childId, name, avatarUrl } = (e as CustomEvent<{ childId: string; name: string; avatarUrl: string }>).detail ?? {};
      const current = activeChildRef.current;
      if (!current || current.id !== childId) return;
      const updated = { ...current, name, avatar_url: avatarUrl };
      activeChildRef.current = updated;
      setActiveChild(updated);
    };
    window.addEventListener("app:profileUpdate", handler as EventListener);
    return () => window.removeEventListener("app:profileUpdate", handler as EventListener);
  }, []);

  // Reflects journey-language switches fired from anywhere in the app
  // (this header picker, /settings, the homepage language badges) into the
  // sidebar's own per-language streak.
  useEffect(() => {
    const handler = (e: Event) => {
      const lang = (e as CustomEvent<{ language: Language }>).detail?.language;
      const current = activeChildRef.current;
      if (!lang || !current) return;
      const updated = { ...current, language: lang };
      activeChildRef.current = updated;
      setActiveChild(updated);
      void (async () => {
        const [ws, dates] = await Promise.all([
          getWeekStreak(updated.id, lang),
          getActivityDates(updated.id, lang),
          getTotalStars(updated.id, lang).then(v => { if (isMounted.current) setTotalStars(v); }),
          getCurrentLevel(updated.id, lang).then(v => { if (isMounted.current) setLevel(v); }),
          getChildBadges(updated.id, lang).then(b => { if (isMounted.current) setGems(b.length); }),
        ]);
        if (!isMounted.current) return;
        setWeekStreak(ws);
        const { usedDates } = await resolveShields(updated.id, lang, dates);
        if (!isMounted.current) return;
        setStreakCount(computeStreaks(dates, new Date(), usedDates).current);
      })();
    };
    window.addEventListener("app:languageChange", handler);
    return () => window.removeEventListener("app:languageChange", handler);
  }, []);

  const confirmLanguageSwitch = async () => {
    if (!pendingLanguage || !activeChild || !user) return;
    setSwitchingLanguage(true);
    await updateChildLanguage(activeChild.id, pendingLanguage, user.id);
    setLanguage(pendingLanguage);
    setSwitchingLanguage(false);
    setPendingLanguage(null);
  };

  if (authLoading || !user) return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--ds-surface-page,#f9fafb)]">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-[var(--ds-brand-primary,#16a34a)] border-t-transparent" />
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen overflow-x-hidden">
      {/* ── Global shell: sky-blue ambient background ── */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `linear-gradient(160deg, rgba(255,255,255,0.88) 0%, rgba(220,242,255,0.60) 50%, rgba(219,250,229,0.55) 100%), url('${assets.backgrounds.app}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />
      {/* Soft sky-blue radial bloom from top-right — gives the "open sky" feel */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 -z-10"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 70% 0%, rgba(186,230,253,0.38) 0%, rgba(167,243,208,0.18) 55%, transparent 80%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 -z-10 opacity-30"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0), rgba(240,249,255,0.95)), url('${assets.backgrounds.page}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(1.05)",
        }}
      />
      <div
        className="pointer-events-none absolute right-4 top-24 hidden md:block w-28 h-28 -z-10 opacity-70"
        style={{
          backgroundImage: `url('${assets.decorations.floating2}')`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          transform: "translateY(0)",
        }}
      />
      <Sidebar
        activeChild={activeChild}
        level={level}
        weekStreak={weekStreak}
        streakCount={streakCount}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogoutClick={() => setShowLogout(true)}
      />

      <div className="relative lg:pl-[200px] flex flex-col min-h-screen">

        {!isOnline && (
          <div className="bg-ds-warn-surface text-ds-warn text-xs font-semibold text-center py-1.5 px-3 border-b border-ds-warn">
            📡 {t("offlineBanner")}
          </div>
        )}

        {/* ── Trial countdown / expired banner ─────────────────────────── */}
        {!bannerDismissed && (trialBannerDays !== null || trialExpiredBanner || trialGraceBanner) && (
          <div
            className={`flex items-center justify-between gap-3 px-4 py-2 text-xs font-semibold border-b ${
              trialExpiredBanner || trialGraceBanner || trialBannerDays === 0
                ? "bg-ds-danger-surface text-ds-danger border-ds-danger"
                : "bg-ds-warn-surface text-ds-warn border-ds-warn"
            }`}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">{trialExpiredBanner || trialGraceBanner || trialBannerDays === 0 ? "🔴" : "⏳"}</span>
              <span className="truncate">
                {trialExpiredBanner
                  ? "Your free trial has ended — subscribe to restore full access."
                  : trialGraceBanner
                  ? "Your trial ended — you have 24 hours of grace access. Subscribe to keep Club."
                  : trialBannerDays === 0
                  ? "Your trial ends today! Subscribe now to keep all premium stories."
                  : trialBannerDays === 1
                  ? "1 day left on your trial — subscribe before tomorrow to keep Club access."
                  : `${trialBannerDays} days left on your free trial.`}
              </span>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/pricing"
                className={`font-black px-3 py-1 rounded-xl text-2xs transition ${
                  trialExpiredBanner || trialGraceBanner || trialBannerDays === 0
                    ? "bg-[var(--ds-state-error)] text-white hover:opacity-90"
                    : "bg-[var(--ds-warn-icon)] text-white hover:opacity-90"
                }`}
              >
                {trialExpiredBanner || trialGraceBanner ? "Subscribe" : "Subscribe →"}
              </a>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-current opacity-50 hover:opacity-100 transition"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        {activeChild && (
          <div className="sticky top-0 z-20">
            {/* Background layer */}
            <div
              className={`absolute inset-0 overflow-hidden ${variants.navigationStyle.background} border-b border-[var(--ds-border-primary)]/60 shadow-[0_10px_32px_rgba(15,23,42,0.06)]`}
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.97), rgba(240,249,255,0.93)), url('${assets.navigation.topbar}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_0%,rgba(186,230,253,0.28),transparent_60%)]" />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/20 to-transparent" />
              <div
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-20 h-20 opacity-50"
                style={{
                  backgroundImage: `url('${assets.navigation.ornaments}')`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                }}
              />
            </div>

            {/* Content layer — overflow-visible so dropdowns escape */}
            <div className="relative flex items-center h-16 px-4 lg:px-6 max-w-[1800px] mx-auto gap-3">

              {/* Mobile: hamburger */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--ds-border-primary)]/60 bg-white/80 text-[var(--ds-text-secondary)] shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--ds-brand-soft)] hover:text-[var(--ds-brand-primary)] active:scale-95 shrink-0"
                aria-label="Open menu"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>

              {/* Mobile: search icon — opens overlay */}
              <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--ds-border-primary)]/60 bg-white/80 text-[var(--ds-text-secondary)] shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--ds-brand-soft)] hover:text-[var(--ds-brand-primary)] active:scale-95 shrink-0"
                aria-label="Search"
              >
                <Search className="w-4.5 h-4.5" />
              </button>

              {/* Desktop: search bar */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
                  if (q) void (window.location.href = `/stories?q=${encodeURIComponent(q)}`);
                }}
                className="hidden md:block flex-1 max-w-[400px]"
              >
                <div className="relative group">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ds-text-tertiary)] transition group-focus-within:text-[var(--ds-brand-primary)]" />
                  <input
                    name="q"
                    type="text"
                    placeholder="Search stories, activities…"
                    className="w-full h-[38px] bg-white/80 border border-[var(--ds-border-primary)]/70 rounded-2xl pl-9 pr-4 text-sml font-nunito text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-tertiary)] shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--ds-brand-primary)]/30 focus:border-[var(--ds-brand-primary)]/60 transition"
                  />
                </div>
              </form>

              {/* Right cluster */}
              <div className="ml-auto flex items-center gap-2 shrink-0">

                {/* ── Streak chip — desktop only ── */}
                <div
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all ${
                    streakCount > 0
                      ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200/80 shadow-sm"
                      : "bg-white/70 border-[var(--ds-border-primary)]/60"
                  }`}
                  title={streakCount > 0 ? `${streakCount}-day streak!` : "No streak yet — start learning!"}
                >
                  <span className={`text-xl leading-none ${streakCount === 0 ? "grayscale opacity-40" : ""}`}>🔥</span>
                  <div className="leading-none">
                    <p className={`font-baloo font-black text-mbase leading-none ${streakCount > 0 ? "text-orange-600" : "text-[var(--ds-text-tertiary)]"}`}>
                      {streakCount}
                    </p>
                    <p className="font-nunito text-3xs mt-0.5 text-orange-400/80">streak</p>
                  </div>
                </div>

                {/* ── Stars chip — desktop only ── */}
                <div
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200/80 shadow-sm"
                  title={`${totalStars} stars earned`}
                >
                  <span className="text-xl leading-none">⭐</span>
                  <div className="leading-none">
                    <p className="font-baloo font-black text-amber-600 text-mbase leading-none">{totalStars}</p>
                    <p className="font-nunito text-amber-400/80 text-3xs mt-0.5">stars</p>
                  </div>
                </div>

                {/* Divider — desktop only */}
                <div className="hidden md:block w-px h-6 bg-[var(--ds-border-primary)]/60 rounded-full" />

                {/* ── Bell / Notifications ── */}
                <div className="relative">
                  <button
                    onClick={() => { setShowNotifications(p => !p); setShowLangPicker(false); setShowProfileMenu(false); }}
                    className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--ds-border-primary)]/70 bg-white/80 shadow-sm transition-all hover:shadow-md hover:border-amber-300 hover:bg-amber-50 hover:-translate-y-0.5 active:scale-95"
                    aria-label="Notifications"
                  >
                    <Bell className="w-[17px] h-[17px] text-[var(--ds-text-secondary)]" strokeWidth={1.8} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-5xs font-black text-white border-2 border-white px-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationPanel
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                    onCountChange={setUnreadCount}
                  />
                </div>

                {/* ── Language pill — desktop only ── */}
                <div className="relative hidden md:block">
                  <button
                    onClick={() => { setShowLangPicker(p => !p); setShowProfileMenu(false); setShowNotifications(false); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border border-[var(--ds-border-primary)]/70 bg-white/80 shadow-sm transition-all hover:shadow-md hover:border-[var(--ds-brand-primary)]/40 hover:bg-[var(--ds-brand-soft)] hover:-translate-y-0.5 active:scale-95"
                    aria-label="Language"
                  >
                    <Flag lang={language} className="w-5 h-3.5 rounded-sm flex-shrink-0" />
                    <span className="text-2xs font-black text-[var(--ds-text-secondary)] uppercase tracking-wide">{language}</span>
                    <svg className="w-3 h-3 text-[var(--ds-text-tertiary)]" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {showLangPicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowLangPicker(false)} />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[var(--ds-border-primary)]/80 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5">
                        {([
                          { code: "en" as Language, label: "English",     flag: "🇬🇧" },
                          { code: "fr" as Language, label: "Français",    flag: "🇫🇷" },
                          { code: "rw" as Language, label: "Kinyarwanda", flag: "🇷🇼" },
                        ] as { code: Language; label: string; flag: string }[]).map(l => (
                          <button
                            key={l.code}
                            onClick={() => { setShowLangPicker(false); setPendingLanguage(l.code); }}
                            className={`flex items-center gap-2.5 px-4 py-2.5 w-full transition font-nunito text-sml font-bold ${
                              l.code === language
                                ? "bg-[var(--ds-brand-subtle)] text-[var(--ds-brand-primary)]"
                                : "hover:bg-[var(--ds-surface-card-hover)] text-[var(--ds-text-primary)]"
                            }`}
                          >
                            <Flag lang={l.code} className="w-6 h-4 rounded-sm flex-shrink-0" />
                            <span className="flex-1 text-left">{l.label}</span>
                            {l.code === language && <span className="text-3xs font-black text-[var(--ds-brand-primary)]">✓</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* ── Profile chip ── */}
                <div className="relative">
                  <button
                    onClick={() => { setShowProfileMenu(p => !p); setShowLangPicker(false); setShowNotifications(false); }}
                    className="flex items-center gap-2 rounded-2xl border border-[var(--ds-border-primary)]/70 bg-white/85 pl-1 pr-3 py-1 shadow-sm transition-all hover:shadow-md hover:border-[var(--ds-brand-primary)]/40 hover:-translate-y-0.5 active:scale-95"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(240,253,244,0.85))" }}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 border-2" style={{ borderColor: "var(--ds-brand-primary)" }}>
                      <ChildAvatar avatarUrl={activeChild.avatar_url} name={activeChild.name} size={32} />
                    </div>
                    {/* Name + badge — desktop only */}
                    <div className="hidden md:block text-left leading-none">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="font-baloo font-black text-[var(--ds-text-primary)] text-sml leading-none">{activeChild.name}</p>
                        <span className="text-5xs font-black px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200/70 leading-none whitespace-nowrap">
                          🧒 Child
                        </span>
                      </div>
                      {cosmetics.title_badge && SHOP_ITEM_MAP[cosmetics.title_badge] ? (
                        <span className={`inline-flex items-center gap-1 text-4xs font-black px-1.5 py-0.5 rounded-full ${SHOP_ITEM_MAP[cosmetics.title_badge].titleColor ?? "bg-[var(--ds-surface-card-active)] text-[var(--ds-text-secondary)]"}`}>
                          {SHOP_ITEM_MAP[cosmetics.title_badge].emoji} {t(SHOP_ITEM_MAP[cosmetics.title_badge].nameKey)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-4xs font-black px-1.5 py-0.5 rounded-full bg-[var(--ds-brand-subtle)] text-[var(--ds-brand-primary)] border border-[var(--ds-brand-primary)]/20">
                          ✨ {getLevelLabel(level)} {level}
                        </span>
                      )}
                    </div>
                    <svg className="hidden md:block w-3.5 h-3.5 text-[var(--ds-text-tertiary)] shrink-0 ml-0.5" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* ── Profile dropdown ── */}
                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-[var(--ds-border-primary)]/80 rounded-2xl shadow-xl z-50 overflow-hidden">
                        {/* Child card header */}
                        <div
                          className="px-4 py-3 border-b border-[var(--ds-border-primary)]/60"
                          style={{ background: "linear-gradient(135deg, #F0FDF4, #DBEAFE)" }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border-2 border-white shadow-sm">
                              <ChildAvatar avatarUrl={activeChild.avatar_url} name={activeChild.name} size={44} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-baloo font-black text-[var(--ds-text-primary)] text-mbase truncate">{activeChild.name}</p>
                              {cosmetics.title_badge && SHOP_ITEM_MAP[cosmetics.title_badge] ? (
                                <span className={`inline-flex items-center gap-1 text-3xs font-black px-2 py-0.5 rounded-full mt-0.5 ${SHOP_ITEM_MAP[cosmetics.title_badge].titleColor ?? "bg-white/80 text-[var(--ds-text-secondary)]"}`}>
                                  {SHOP_ITEM_MAP[cosmetics.title_badge].emoji} {t(SHOP_ITEM_MAP[cosmetics.title_badge].nameKey)}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 mt-0.5 text-3xs font-black px-2 py-0.5 rounded-full bg-[var(--ds-brand-subtle)] text-[var(--ds-brand-primary)] border border-[var(--ds-brand-primary)]/20">
                                  ✨ {getLevelLabel(level)} · Level {level}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Mini stats row */}
                          <div className="flex items-center gap-3 mt-2.5">
                            <div className="flex items-center gap-1">
                              <span className={`text-base ${streakCount === 0 ? "grayscale opacity-40" : ""}`}>🔥</span>
                              <span className="font-baloo font-black text-orange-600 text-sml">{streakCount}</span>
                              <span className="font-nunito text-3xs text-[var(--ds-text-tertiary)]">streak</span>
                            </div>
                            <div className="w-px h-4 bg-[var(--ds-border-primary)]/60 rounded-full" />
                            <div className="flex items-center gap-1">
                              <span className="text-base">⭐</span>
                              <span className="font-baloo font-black text-amber-600 text-sml">{totalStars}</span>
                              <span className="font-nunito text-3xs text-[var(--ds-text-tertiary)]">stars</span>
                            </div>
                          </div>
                        </div>

                        {/* Nav items */}
                        <div className="py-1.5">
                          {([
                            { Icon: User,     label: "My Profile",    href: "/user-profile",          iconBg: "bg-blue-100",   iconColor: "text-blue-600"   },
                            { Icon: Trophy,   label: "My Treasure",   href: "/treasure",              iconBg: "bg-amber-100",  iconColor: "text-amber-600"  },
                            { Icon: Crown,    label: "Masterpiece",   href: "/masterpiece",           iconBg: "bg-yellow-100", iconColor: "text-yellow-600" },
                            { Icon: Settings, label: "Settings",      href: "/user-profile/settings", iconBg: "bg-gray-100",   iconColor: "text-gray-500"   },
                          ] as { Icon: React.ElementType; label: string; href: string; iconBg: string; iconColor: string }[]).map(item => (
                            <a
                              key={item.href}
                              href={item.href}
                              onClick={() => setShowProfileMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--ds-surface-card-hover)] transition group"
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg} transition group-hover:scale-105`}>
                                <item.Icon className={`w-3.5 h-3.5 ${item.iconColor}`} strokeWidth={2} />
                              </div>
                              <span className="font-nunito text-[var(--ds-text-primary)] text-sml font-bold">{item.label}</span>
                            </a>
                          ))}
                        </div>

                        {/* Language selector */}
                        <div className="border-t border-[var(--ds-border-primary)]/60 px-4 py-2.5">
                          <p className="text-3xs font-black text-[var(--ds-text-tertiary)] uppercase tracking-wide mb-1.5">Language</p>
                          <div className="flex gap-1.5">
                            {LANGS.map(l => (
                              <button
                                key={l.code}
                                onClick={() => { setShowProfileMenu(false); setPendingLanguage(l.code); }}
                                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-brand-primary)] focus-visible:ring-offset-1 ${
                                  l.code === language
                                    ? "border-[var(--ds-brand-primary)] bg-[var(--ds-brand-subtle)]"
                                    : "border-[var(--ds-border-primary)] hover:bg-[var(--ds-surface-card-hover)]"
                                }`}
                              >
                                <Flag lang={l.code} className="w-6 h-4 rounded-sm" />
                                <span className={`text-4xs font-black uppercase tracking-wide ${l.code === language ? "text-[var(--ds-brand-primary)]" : "text-[var(--ds-text-secondary)]"}`}>{l.code}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-[var(--ds-border-primary)]/60">
                          <button
                            onClick={() => { setShowProfileMenu(false); setShowLogout(true); }}
                            className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-red-50 transition group"
                          >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-red-50 group-hover:bg-red-100 transition">
                              <LogOut className="w-3.5 h-3.5 text-red-400" strokeWidth={2} />
                            </div>
                            <span className="font-nunito text-red-500 text-sml font-bold">Log out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

              </div>{/* end right cluster */}
            </div>

            {/* Mobile search overlay */}
            {searchOpen && (
              <div className={`md:hidden absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center h-16 px-4 gap-3 border-b border-[var(--ds-border-primary)] shadow-sm`}>
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-1.5 rounded-xl text-[var(--ds-text-secondary)] hover:bg-[var(--ds-surface-card-hover)] transition shrink-0"
                  aria-label="Close search"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
                    setSearchOpen(false);
                    if (q) void (window.location.href = `/stories?q=${encodeURIComponent(q)}`);
                  }}
                  className="flex-1 flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ds-text-tertiary)]" />
                    <input
                      name="q"
                      type="text"
                      autoFocus
                      placeholder="Search stories, activities…"
                      className="w-full h-10 bg-[var(--ds-surface-input)] border border-[var(--ds-border-primary)] rounded-2xl pl-9 pr-4 text-sml font-nunito text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-brand-primary)]/30 focus:border-[var(--ds-brand-primary)]/60 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-10 h-10 flex items-center justify-center rounded-xl transition shrink-0 active:scale-95"
                    style={{ backgroundColor: "var(--ds-brand-primary)" }}
                  >
                    <Search className="w-4 h-4 text-white" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        <div id="main-content" className="flex-1 flex flex-col w-full max-w-[1800px] mx-auto px-4 py-4 pb-[88px] sm:px-5 sm:py-5 lg:px-6 lg:py-6 lg:pb-8">
          {children}
        </div>
      </div>

      {/* Persistent bottom navigation — mobile only (lg:hidden inside the component) */}
      <BottomNavBar />

      <InstallPrompt />
      <UpdateToast visible={updateReady && !updateDismissed} onDismiss={() => setUpdateDismissed(true)} />

      <LogoutModal isOpen={showLogout} onClose={() => setShowLogout(false)} />

      {/* Copyright footer — desktop only, stays below content */}
      <div className="hidden lg:block text-center py-2 border-t border-ds-border bg-ds-card/50">
        <p className="font-nunito text-3xs text-[var(--ds-text-tertiary)]">© 2026 Nimipiko Studio LTD. All rights reserved.</p>
      </div>

      <LanguageSwitchDialog
        pendingLanguage={pendingLanguage}
        currentLanguage={language}
        childName={activeChild?.name}
        switching={switchingLanguage}
        onConfirm={confirmLanguageSwitch}
        onCancel={() => setPendingLanguage(null)}
      />
    </div>
    </MotionConfig>
  );
}
