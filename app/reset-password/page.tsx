"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, MotionConfig } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, RotateCcw } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import AuthBackground from "@/components/auth/AuthBackground";
import { useThemeMotion } from "@/hooks/useThemeMotion";
import { useAppTheme } from "@/contexts/AppThemeProvider";
import { getThemeAssets } from "@/lib/design-system/assetRegistry";

export default function ResetPassword() {
  const router = useRouter();
  const { themeId } = useAppTheme();
  const assets = getThemeAssets(themeId);
  const m = useThemeMotion();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [expired, setExpired] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === '1') setExpired(true);
  }, []);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail) return;
    setResendLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resendEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResendLoading(false);
    if (error) {
      setMessage(error.message);
      setIsError(true);
    } else {
      setResendSent(true);
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setIsError(true);
      setMessage(error.message);
      setPassword("");
      setConfirmPassword("");
    } else {
      setIsError(false);
      setMessage("Password updated successfully! Redirecting to login...");
      setTimeout(() => router.push("/loginpage"), 2000);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">

      <AuthBackground />

      <div className="relative z-10 w-full max-w-md">

        {/* Mascot header */}
        <div className="flex flex-col items-center text-center mb-6">
          <motion.img
            src={assets.nimiAuth} alt="NIMI"
            className="w-20 h-20 rounded-full object-cover border-4 border-yellow-400 shadow-xl mb-3"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} />
          <h1 className="font-black text-3xl sm:text-4xl text-ds-text">
            {expired ? 'Link Expired' : 'New'}{' '}
            <span className="text-[var(--ds-brand-primary)]">{expired ? '' : 'Password'}</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm max-w-xs">
            {expired
              ? 'Your password reset link has expired. Request a new one below.'
              : 'Choose a strong new password to secure your account.'}
          </p>
        </div>

        {/* ── Expired state ── */}
        {expired && (
          <div
            className="bg-white border border-ds-border shadow-ds-card p-6 sm:p-8 space-y-5"
            style={{ borderRadius: 'var(--leaf-r-lg)' }}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-orange-500" />
              </div>
              <p className="text-sm text-gray-600 max-w-xs">
                Reset links expire after <strong>1 hour</strong> for security. Enter your email to get a fresh link.
              </p>
            </div>

            {resendSent ? (
              <div className="leaf p-4 bg-green-50 text-green-700 text-sm font-semibold text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                New link sent! Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleResend} className="space-y-4">
                {message && isError && (
                  <p className="text-red-500 text-sm text-center font-semibold">{message}</p>
                )}
                <div>
                  <label className="font-bold text-ds-text text-sm mb-1.5 block">Your email address</label>
                  <input
                    type="email" required
                    value={resendEmail}
                    onChange={e => setResendEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-ds-border bg-ds-input leaf px-4 py-2.5 text-sm font-semibold text-ds-text focus:outline-none focus:ring-2 focus:ring-[var(--ds-state-focus)] transition placeholder:text-gray-400"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={resendLoading}
                  whileTap={m.buttonPress}
                  className="w-full text-white font-black py-3.5 shadow-md transition disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--nimi-green)', borderRadius: 'var(--leaf-r)' }}
                >
                  <RotateCcw className="w-4 h-4" />
                  {resendLoading ? 'Sending…' : 'Send New Reset Link'}
                </motion.button>
              </form>
            )}

            <p className="text-center text-xs text-gray-400">
              Back to{' '}
              <button onClick={() => router.push('/loginpage')} className="font-bold text-[var(--ds-brand-primary)] hover:underline">
                Login
              </button>
            </p>
          </div>
        )}

        {/* ── Normal reset form ── */}
        {!expired && <form
          onSubmit={handleUpdatePassword}
          className="bg-white border border-ds-border shadow-ds-card p-6 sm:p-8 space-y-4"
          style={{ borderRadius: 'var(--leaf-r-lg)' }}
        >
          <div className="flex flex-col items-center text-center mb-1">
            <div className="w-14 h-14 rounded-full bg-[var(--ds-brand-subtle)] flex items-center justify-center mb-3">
              <Lock className="w-6 h-6 text-[var(--ds-brand-primary)]" />
            </div>
            <h2 className="font-black text-xl text-ds-text">Reset Password</h2>
            <p className="text-gray-500 text-sm mt-1">Enter your new password below.</p>
          </div>

          {message && (
            <div className={`leaf p-2.5 text-center text-sm font-semibold flex items-center justify-center gap-2 ${
              isError ? "bg-red-50 text-red-600" : "bg-[var(--ds-brand-subtle)] text-[var(--ds-brand-primary)]"
            }`}>
              {!isError && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {message}
            </div>
          )}

          {/* New password */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-ds-text text-sm mb-1.5">
              <Lock className="w-4 h-4 text-gray-400" /> New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                disabled={loading}
                className="w-full border border-ds-border bg-ds-input leaf px-4 py-2.5 pr-10 text-sm font-semibold text-ds-text focus:outline-none focus:ring-2 focus:ring-[var(--ds-state-focus)] transition placeholder:text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-ds-text text-sm mb-1.5">
              <Lock className="w-4 h-4 text-gray-400" /> Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={loading}
                className="w-full border border-ds-border bg-ds-input leaf px-4 py-2.5 pr-10 text-sm font-semibold text-ds-text focus:outline-none focus:ring-2 focus:ring-[var(--ds-state-focus)] transition placeholder:text-gray-400" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={m.buttonPress}
            className="w-full text-white font-black py-3.5 shadow-md transition disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--nimi-green)', borderRadius: 'var(--leaf-r)' }}
          >
            <Lock className="w-4 h-4" />
            {loading ? "Updating Password..." : "Update Password"}
          </motion.button>
        </form>}

        {/* Bottom note */}
        {!expired && (
          <div className="flex items-center gap-3 mt-4 bg-white border border-ds-border leaf px-4 py-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[var(--ds-brand-subtle)] flex items-center justify-center flex-shrink-0">
              <Lock className="w-3.5 h-3.5 text-[var(--ds-brand-primary)]" />
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-bold text-ds-text">Secure connection.</span> Your password is encrypted and never stored in plain text.
            </p>
          </div>
        )}
      </div>
    </div>
    </MotionConfig>
  );
}
