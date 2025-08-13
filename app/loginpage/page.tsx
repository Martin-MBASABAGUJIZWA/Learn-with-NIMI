"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import  supabase  from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    setLoading(true);
    setError("");

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
      // Fetch user profile
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

      router.push("/parent-profile");
    } else {
      setError("Login failed: no user returned");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />
      <button onClick={login} disabled={loading} style={{ width: "100%", padding: 10 }}>
        {loading ? "Logging in..." : "Login"}
      </button>
      <p style={{ marginTop: 10 }}>
        Don't have an account? <a href="/signuppage">Sign up</a>
      </p>
    </div>
  );
}
