"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // Success message

  const login = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", data.user.id)
        .single();

      if (profileError) {
        setError("Failed to fetch user profile: " + profileError.message);
        setLoading(false);
        return;
      }

      localStorage.setItem("parentAuth", "logged-in");
      localStorage.setItem("parentProfileV2", JSON.stringify(userProfile));

      router.push("/parents");
    } else {
      setError("Login failed: no user returned");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6 transform hover:scale-[1.02] transition-transform duration-300">
        <h2 className="text-3xl font-bold text-center text-purple-700 animate-pulse">
          Welcome Back!
        </h2>

        {error && (
          <p className="text-red-600 bg-red-100 p-2 rounded text-center">{error}</p>
        )}
        {message && (
          <p className="text-green-600 bg-green-100 p-2 rounded text-center">{message}</p>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400 pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <a
            href="/forgot-password"
            className="text-sm text-purple-600 hover:underline"
          >
            Forgot Password?
          </a>
        </div>

        <button
          onClick={login}
          disabled={loading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <a href="/signuppage" className="text-purple-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
