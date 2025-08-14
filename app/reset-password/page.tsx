"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import  supabase  from "@/lib/supabaseClient";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // When the page loads, try to exchange the token for a session
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      supabase.auth
        .exchangeCodeForSession(hash)
        .then(({ error }) => {
          if (error) {
            setMessage(`❌ Invalid or expired link.`);
          }
        });
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage("✅ Password updated successfully. Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Reset Password</h1>
      <form onSubmit={handleResetPassword} className="space-y-4">
        <input
          type="password"
          required
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
