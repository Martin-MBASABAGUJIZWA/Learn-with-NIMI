"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCheck } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/AppThemeProvider";
import { getThemeAssets } from "@/lib/design-system/assetRegistry";
import { getComponentVariant } from "@/lib/design-system/componentVariants";
import { useMotion } from "@/hooks/useMotion";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  url: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  achievement: "🏆",
  reminder: "📖",
  challenge: "⭐",
  story: "📚",
  info: "💜",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCountChange: (count: number) => void;
}

export default function NotificationPanel({ isOpen, onClose, onCountChange }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { themeId } = useAppTheme();
  const assets = getThemeAssets(themeId);
  const cv = getComponentVariant(themeId);
  const m = useMotion();

  const load = async (active: boolean) => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!active) return;
    if (data) {
      setNotifications(data);
      onCountChange(data.filter(n => !n.read).length);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    void load(active);
    return () => { active = false; };
  }, [isOpen]);

  useEffect(() => {
    let active = true;
    void load(active);
    return () => { active = false; };
  }, []);

  // H25: use functional state update so onCountChange sees fresh data
  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      onCountChange(next.filter(n => !n.read).length);
      return next;
    });
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read).map(n => n.id);
    if (unread.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", unread);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    onCountChange(0);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            {...m.drawerAnimation}
            className={`
              fixed inset-x-0 top-16 max-h-[80vh] rounded-none
              sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[360px] sm:max-h-none
              ${cv.panelStyle.background} ${cv.panelStyle.border} ${cv.panelStyle.shadow}
              z-50 overflow-hidden
            `}
            style={{ borderRadius: 'var(--leaf-r)' }}
          >
            {/* World panel texture */}
            <Image src={assets.storyCard.background} alt="" aria-hidden="true" fill
              className="object-cover pointer-events-none opacity-[0.05]" />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-ds-border">
                <div>
                  <p className="rounded-full border border-[var(--ds-border-brand)]/20 bg-[var(--ds-surface-card)]/80 px-2.5 py-1 text-3xs font-black uppercase tracking-[0.24em] text-[var(--ds-brand-primary)] shadow-sm inline-block">
                    Updates
                  </p>
                  <h3 className="font-baloo font-black text-[var(--ds-text-primary)] text-lg mt-1">Notifications</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllRead}
                    className="rounded-full border border-[var(--ds-border-brand)]/20 bg-[var(--ds-surface-card)]/80 px-2.5 py-1 text-[var(--ds-text-secondary)] hover:text-[var(--ds-brand-primary)] text-2xs font-nunito font-bold flex items-center gap-1 transition shadow-sm"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-full border border-[var(--ds-border-brand)]/20 bg-[var(--ds-surface-card)]/80 hover:bg-[var(--ds-brand-soft)] flex items-center justify-center text-[var(--ds-text-secondary)] transition shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[calc(80vh-56px)] sm:max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="w-6 h-6 border-2 border-[var(--ds-progress-fill)] border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <span className="text-3xl">🔔</span>
                    <p className="font-nunito text-[var(--ds-text-secondary)] text-sm font-bold mt-2">No notifications yet</p>
                    <p className="font-nunito text-[var(--ds-text-secondary)] text-xs mt-1">We&apos;ll let you know when something happens!</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`w-full text-left px-4 py-3 flex gap-3 transition border-b border-ds-border ${
                        n.read ? "opacity-60" : "hover:bg-[var(--ds-brand-subtle)]"
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? "💜"}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-nunito text-sml font-bold leading-tight ${n.read ? "text-[var(--ds-text-tertiary)]" : "text-[var(--ds-text-primary)]"}`}>
                          {n.title}
                        </p>
                        <p className="font-nunito text-[var(--ds-text-secondary)] text-xs mt-0.5 leading-snug">{n.body}</p>
                        <p className="font-nunito text-[var(--ds-text-tertiary)] text-3xs mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.read && <div className="w-2.5 h-2.5 bg-[var(--ds-brand-primary)] rounded-full shrink-0 mt-1.5" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
