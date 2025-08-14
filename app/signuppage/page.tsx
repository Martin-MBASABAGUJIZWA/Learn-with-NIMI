"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signup = async () => {
    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ name })
        .eq("auth_user_id", data.user.id);

      if (updateError) {
        setError("Failed to save user profile: " + updateError.message);
        setLoading(false);
        return;
      }

      localStorage.setItem("parentAuth", "logged-in");
      localStorage.setItem(
        "parentProfileV2",
        JSON.stringify({ auth_user_id: data.user.id, email, name })
      );

      router.push("/parents");
    } else {
      setError("Signup failed: no user returned");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6 transform hover:scale-[1.02] transition-transform duration-300">
        <h2 className="text-3xl font-bold text-center text-purple-700 animate-pulse">
          Welcome to Nimi!
        </h2>
        {error && (
          <p className="text-red-600 bg-red-100 p-2 rounded text-center">{error}</p>
        )}
        <div className="space-y-4 relative">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400"
          />
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
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        <button
          onClick={signup}
          disabled={loading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/loginpage" className="text-purple-600 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
