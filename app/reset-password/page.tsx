"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Supabase handles access_token from URL automatically in the session
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage("✅ Password updated successfully! Redirecting...");
      setTimeout(() => router.push("/login"), 2000);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleUpdatePassword} className="space-y-4">
      <h1 className="text-xl font-bold">Reset Password</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        className="border p-2 rounded w-full"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}
