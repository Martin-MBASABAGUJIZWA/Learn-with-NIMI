"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sendReset = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage(`❌ Oops! ${error.message}`);
    } else {
      setMessage(`✅ Check your email! We sent a reset link to ${email} 📧`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6 transform hover:scale-[1.02] transition-transform duration-300">
        <h2 className="text-3xl font-bold text-center text-purple-700 animate-pulse">
          Forgot your password? 🔑
        </h2>
        {message && (
          <p className="text-center text-sm p-2 rounded bg-purple-100 text-purple-700">
            {message}
          </p>
        )}
        <input
          type="email"
          placeholder="Enter your email 📧"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400"
        />
        <button
          onClick={sendReset}
          disabled={loading || !email}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending reset link..." : "Send Reset Link ✉️"}
        </button>
        <p className="text-center text-sm text-gray-500">
          Remembered your password?{" "}
          <a href="/loginpage" className="text-purple-600 hover:underline">
            Log in 😎
          </a>
        </p>
      </div>
    </div>
  );
}
