"use client";

import { useState, useEffect } from "react";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null | undefined>(undefined); // undefined = loading
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Extract token from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const access_token = params.get("access_token");
    setToken(access_token);
  }, []);

  const resetPassword = async () => {
    if (!password) {
      setError("Please enter a new password! 🔒");
      return;
    }
    if (!token) {
      setError("Missing token ❌");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const { error: supabaseError } = await supabase.auth.updateUser({
      password,
      access_token: token,
    });

    if (supabaseError) {
      setError("Failed to reset password: " + supabaseError.message + " ❌");
    } else {
      setMessage("Password reset successfully! 🎉 You can now log in.");
      setTimeout(() => router.push("/loginpage"), 2000);
    }

    setLoading(false);
  };

  if (token === undefined) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-500 text-lg animate-pulse">Loading… ⏳</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-red-600 text-lg">Invalid or missing token ❌</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-purple-700 animate-pulse">
          Reset Your Password 🔑
        </h2>

        {error && (
          <p className="text-red-600 bg-red-100 p-2 rounded text-center">{error}</p>
        )}
        {message && (
          <p className="text-green-600 bg-green-100 p-2 rounded text-center">{message}</p>
        )}

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400 pr-10"
            autoFocus
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button
          onClick={resetPassword}
          disabled={loading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Remember your password?{" "}
          <a href="/loginpage" className="text-purple-600 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
