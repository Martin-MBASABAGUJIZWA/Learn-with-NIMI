"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, MotionConfig, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Plane } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import { useThemeMotion } from "@/hooks/useThemeMotion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/AppThemeProvider";
import { getThemeAssets } from "@/lib/design-system/assetRegistry";

// Ambient dots — colour comes from --ds-text-brand (gold on airways, green on default)
const DOTS = [
  { top: "8%",  left: "6%",   d: 0    },
  { top: "14%", left: "22%",  d: 0.4  },
  { top: "7%",  left: "55%",  d: 0.8  },
  { top: "11%", right: "18%", d: 1.2  },
  { top: "19%", left: "38%",  d: 0.2  },
  { top: "24%", right: "8%",  d: 0.6  },
  { top: "32%", left: "9%",   d: 1.0  },
  { top: "38%", left: "30%",  d: 0.3  },
  { top: "44%", right: "24%", d: 0.9  },
  { top: "55%", left: "5%",   d: 0.5  },
  { top: "62%", right: "6%",  d: 1.1  },
  { top: "72%", left: "20%",  d: 0.7  },
] as const;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--ds-surface-card)]" />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { themeId, theme } = useAppTheme();
  const assets = getThemeAssets(themeId);

  const rawNext = searchParams?.get("next") ?? "";
  const nextPath = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/home";

  const m = useThemeMotion();
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [message,      setMessage]      = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace(nextPath);
    });
  }, [router, nextPath]);

  const login = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) { setError(loginError.message); return; }
      setMessage(t("loginSuccess"));
      router.replace(nextPath);
    } catch {
      setError(t("loginError"));
    } finally {
      setLoading(false);
    }
  };

  // Input focus/blur: swap border to brand colour
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--ds-state-focus)";
    e.target.style.boxShadow   = "0 0 0 3px var(--ds-brand-soft)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--ds-border-primary)";
    e.target.style.boxShadow   = "none";
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* Page — bg comes from --ds-surface-page (dark navy on airways) */}
      <div
        className={`min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-gradient-to-br ${theme.gradients.pageBg}`}
      >

        {/* Ambient dots */}
        <div className="absolute inset-0 pointer-events-none select-none">
          {DOTS.map((d, i) => (
            <motion.div key={i}
              className="absolute w-[3px] h-[3px] rounded-full bg-[var(--ds-text-brand)]"
              style={{ top: d.top, ...(("left" in d) ? { left: d.left } : { right: (d as { right: string }).right }) }}
              animate={{ opacity: [0.15, 0.70, 0.15] }}
              transition={{ duration: 2.8 + (i % 4) * 0.5, repeat: Infinity, ease: "easeInOut", delay: d.d }} />
          ))}
        </div>

        {/* ── Left hero panel ───────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col justify-between px-6 py-8 lg:w-[46%] lg:py-14 lg:px-12">

          {/* Wordmark */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--ds-brand-soft)]"
                style={{ border: "1px solid var(--ds-border-brand)" }}>
                <Plane className="w-4 h-4 text-[var(--ds-text-brand)]" />
              </div>
              <div>
                <p className="font-black tracking-[0.24em] text-[10px] uppercase text-[var(--ds-text-brand)]">
                  Nimipiko Airways
                </p>
                <p className="text-[var(--ds-text-secondary)] text-[9px] font-nunito tracking-widest uppercase">
                  Learning Terminal · KGL
                </p>
              </div>
            </div>

            {/* Departure info card — desktop only */}
            <div className="mt-6 hidden lg:block">
              <div className="rounded-2xl p-4 space-y-1 bg-[var(--ds-brand-soft)]"
                style={{ border: "1px solid var(--ds-border-brand)" }}>
                <div className="flex items-center justify-between">
                  {[
                    { label: "Flight", value: "NMP101", color: "text-[var(--ds-text-brand)]" },
                    { label: "Gate",   value: "ADV · 01", color: "text-[var(--ds-text-brand)]" },
                    { label: "Status", value: "OUVERT",  color: "text-[var(--ds-brand-primary)]" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <p className="text-[9px] font-black tracking-[0.22em] uppercase text-[var(--ds-text-brand)]">{label}</p>
                      <p className={`font-baloo font-black text-base leading-none ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="h-[1px] bg-[var(--ds-border-brand)]" />
                <p className="text-[var(--ds-text-secondary)] font-nunito text-[11px]">
                  KIGALI (KGL) → THE WORLD OF STORIES
                </p>
              </div>
            </div>
          </div>

          {/* Headline + Nimi */}
          <div className="mt-8 lg:mt-0 lg:flex-1 flex flex-col justify-center items-center lg:items-start gap-5">
            <div className="lg:text-left text-center">
              <h1 className="font-baloo font-black text-[var(--ds-text-primary)] leading-tight text-3xl sm:text-4xl lg:text-5xl">
                Welcome back,<br />
                <span className="text-[var(--ds-text-brand)]">Captain! ✈️</span>
              </h1>
              <p className="text-[var(--ds-text-secondary)] font-nunito mt-2 text-sm">
                Your little explorers are ready for take-off.
              </p>
            </div>

            {/* Nimi + speech bubble */}
            <div className="flex items-end gap-3">
              <motion.img
                src={assets.nimiCircle} alt="NIMI"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover flex-shrink-0"
                style={{ border: "3px solid var(--ds-border-brand)", boxShadow: "0 0 24px var(--ds-brand-soft)" }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} />
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 120, damping: 14 }}
                className="rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[180px]"
                style={{ background: "var(--ds-surface-nav)", border: "1px solid var(--ds-border-brand)" }}>
                <p className="font-nunito font-bold text-[var(--ds-text-brand)] text-[13px] leading-snug">
                  Let&apos;s create something amazing today! ✨
                </p>
              </motion.div>
            </div>
          </div>

          {/* Mobile flight info strip */}
          <div className="mt-6 lg:hidden flex items-center justify-between px-1">
            <div>
              <p className="text-[8px] font-black tracking-[0.22em] uppercase text-[var(--ds-text-brand)]">Flight</p>
              <p className="font-baloo font-black text-[var(--ds-text-primary)] text-sm">NMP101</p>
            </div>
            <div className="flex-1 mx-4 border-t border-dashed border-[var(--ds-border-strong)]/40" />
            <Plane className="w-4 h-4 text-[var(--ds-text-secondary)]" />
            <div className="flex-1 mx-4 border-t border-dashed border-[var(--ds-border-strong)]/40" />
            <div className="text-right">
              <p className="text-[8px] font-black tracking-[0.22em] uppercase text-[var(--ds-text-brand)]">Gate</p>
              <p className="font-baloo font-black text-[var(--ds-text-primary)] text-sm">ADV · 01</p>
            </div>
          </div>
        </div>

        {/* ── Right: boarding-pass form card ───────────────────────── */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 lg:py-14 lg:pr-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.1 }}
            className="w-full max-w-md"
          >
            {/* Boarding-pass ticket card */}
            <div className="bg-[var(--ds-surface-card)] overflow-hidden rounded-[20px]"
              style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}>

              {/* Card header (dark nav-bg gradient) */}
              <div className="px-6 py-4 flex items-center justify-between"
                style={{ background: "linear-gradient(135deg, var(--ds-nav-bg) 0%, var(--ds-surface-nav) 100%)" }}>
                <div>
                  <p className="font-black tracking-[0.22em] text-[9px] uppercase text-[var(--ds-text-brand)]">
                    Nimipiko Airways
                  </p>
                  <p className="font-baloo font-black text-[var(--ds-text-primary)] text-base leading-tight">
                    Parent / Guardian Login ✈️
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black tracking-[0.18em] uppercase text-[var(--ds-text-secondary)]">Seat</p>
                  <p className="font-baloo font-black text-[var(--ds-text-primary)] text-sm">12A · WIN</p>
                </div>
              </div>

              {/* Torn-ticket perforation */}
              <div className="relative h-5 flex items-center overflow-hidden bg-[var(--ds-surface-card-hover)]">
                <div className="absolute -left-3 w-6 h-6 rounded-full bg-[var(--ds-nav-bg)]" />
                <div className="flex-1 mx-4 border-t-2 border-dashed border-[var(--ds-border-strong)]" />
                <div className="absolute -right-3 w-6 h-6 rounded-full bg-[var(--ds-nav-bg)]" />
              </div>

              {/* Form body */}
              <div className="px-6 py-5 space-y-4 bg-[var(--ds-surface-card-hover)]">

                <AnimatePresence mode="wait">
                  {(error || message) && (
                    <motion.div key={error || message}
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-center ${
                        error ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-[var(--ds-brand-subtle)] text-[var(--ds-text-brand)] border border-[var(--ds-border-brand)]"
                      }`}>
                      {error || message}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div>
                  <label htmlFor="login-email"
                    className="block font-black text-[9px] uppercase tracking-[0.22em] mb-1.5 text-[var(--ds-text-brand)]">
                    Your Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ds-text-tertiary)]" />
                    <input id="login-email" type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && login()}
                      placeholder={t("loginPlaceholderEmail")}
                      disabled={loading}
                      onFocus={onFocus} onBlur={onBlur}
                      className="w-full pl-9 pr-4 py-2.5 text-sm font-semibold text-[var(--ds-text-primary)] bg-[var(--ds-surface-card)] border-2 border-[var(--ds-border-primary)] rounded-xl focus:outline-none transition placeholder:text-[var(--ds-text-tertiary)]" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="login-password"
                    className="block font-black text-[9px] uppercase tracking-[0.22em] mb-1.5 text-[var(--ds-text-brand)]">
                    Boarding Code
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ds-text-tertiary)]" />
                    <input id="login-password" type={showPassword ? "text" : "password"} value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && login()}
                      placeholder={t("loginPlaceholderPassword")}
                      disabled={loading}
                      onFocus={onFocus} onBlur={onBlur}
                      className="w-full pl-9 pr-10 py-2.5 text-sm font-semibold text-[var(--ds-text-primary)] bg-[var(--ds-surface-card)] border-2 border-[var(--ds-border-primary)] rounded-xl focus:outline-none transition placeholder:text-[var(--ds-text-tertiary)]" />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ds-text-tertiary)] hover:text-[var(--ds-text-secondary)] transition">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember / forgot */}
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 font-semibold text-[var(--ds-text-secondary)] cursor-pointer select-none">
                    <input type="checkbox" checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-[var(--ds-brand-primary)]" />
                    Remember me
                  </label>
                  <Link href="/forgot-password"
                    className="font-bold text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition">
                    Forgot Password?
                  </Link>
                </div>

                {/* CTA — brand gradient, nav-bg text (dark on airways gold, white on default green) */}
                <motion.button
                  onClick={login} disabled={loading} whileTap={m.buttonPress}
                  className="w-full font-baloo font-black text-[15px] py-3.5 flex items-center justify-center gap-2 rounded-[14px] transition disabled:opacity-60"
                  style={{
                    background:  `linear-gradient(135deg, var(--ds-brand-primary) 0%, var(--ds-brand-hover) 100%)`,
                    color:       "var(--ds-nav-bg)",
                    boxShadow:   "var(--ds-shadow-cta)",
                  }}>
                  {loading ? (
                    <motion.span animate={{ rotate: [0, 360] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>✈️</motion.span>
                  ) : (
                    <><Plane className="w-4 h-4" /> Board Now</>
                  )}
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--ds-border-strong)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-text-tertiary)]">or</span>
                  <div className="flex-1 h-px bg-[var(--ds-border-strong)]" />
                </div>

                <p className="text-center text-xs text-[var(--ds-text-secondary)] font-nunito">
                  New here?{" "}
                  <Link href="/signuppage"
                    className="font-black text-[var(--ds-text-brand)] hover:opacity-80 transition">
                    Sign up for your boarding pass →
                  </Link>
                </p>
              </div>

              {/* Barcode strip */}
              <div className="px-6 pb-5 pt-1 flex items-center gap-3 bg-[var(--ds-surface-card-hover)]">
                <div className="flex gap-[2px] items-end flex-1">
                  {Array.from({ length: 38 }, (_, i) => (
                    <div key={i} className="flex-1 bg-[var(--ds-nav-bg)] rounded-sm opacity-80"
                      style={{ height: `${[10,16,8,20,12,18,8,14,20,10,16,8,18,12,20,10,14,18,8,16,12,20,10,16,8,20,14,10,18,12,16,8,20,10,14,18,8,16][i]}px` }} />
                  ))}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-[7px] font-bold leading-none text-[var(--ds-nav-bg)] opacity-50">NMP-101-KGL</p>
                  <p className="font-mono text-[7px] leading-none text-[var(--ds-nav-bg)] opacity-50">
                    {new Date().toISOString().slice(0, 10).replace(/-/g, "")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}
