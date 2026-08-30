"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const DISMISS_KEY = "nimi_install_dismissed_at";
const DISMISS_DAYS = 14;
const SHOW_AFTER_MS = 120_000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

function recentlyDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const at = localStorage.getItem(DISMISS_KEY);
  if (!at) return false;
  const elapsedDays = (Date.now() - Number(at)) / (1000 * 60 * 60 * 24);
  return elapsedDays < DISMISS_DAYS;
}

export default function InstallPrompt() {
  const { t } = useLanguage();
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;
    setIos(isIOS());

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferredEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    const timer = setTimeout(() => {
      if (isStandalone() || recentlyDismissed()) return;
      setVisible(true);
    }, SHOW_AFTER_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(timer);
    };
  }, []);

  if (!visible || (!deferredEvent && !ios)) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-5 right-4 z-50 flex items-center gap-3 px-4 py-2.5 sm:w-72"
      style={{
        borderRadius: "var(--leaf-r)",
        background: "var(--ds-surface-card)",
        border: "1px solid var(--ds-border-primary)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      }}>
      <Download className="w-4 h-4 shrink-0 text-[var(--ds-brand-primary)]" />
      <div className="flex-1 min-w-0">
        <p className="font-baloo font-black text-[var(--ds-text-primary)] text-xs leading-tight">{t("installPromptTitle")}</p>
        {ios ? (
          <p className="text-[var(--ds-text-tertiary)] text-3xs leading-snug mt-0.5">{t("iosInstallInstructions")}</p>
        ) : (
          <button onClick={install}
            className="text-[var(--ds-brand-primary)] font-bold text-3xs hover:underline mt-0.5">
            {t("installBtn")}
          </button>
        )}
      </div>
      <button onClick={dismiss} aria-label="Dismiss"
        className="shrink-0 text-[var(--ds-text-tertiary)] hover:text-[var(--ds-text-primary)] transition">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
