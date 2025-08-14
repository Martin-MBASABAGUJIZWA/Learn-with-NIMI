import { useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://nimi-learn.onrender.com/reset-password",
    });

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage("✅ Password reset email sent! Please check your inbox.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <h1 className="text-xl font-bold">Forgot Password</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="border p-2 rounded w-full"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}
