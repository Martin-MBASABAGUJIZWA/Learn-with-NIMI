"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import  supabase  from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signup = async () => {
    setLoading(true);
    setError("");

    // Sign up with Supabase Auth
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
      // Insert into your users table
      const { error: insertError } = await supabase.from("users").insert({
        auth_user_id: data.user.id,
        email,
        name,
      });

      if (insertError) {
        setError("Failed to save user profile: " + insertError.message);
        setLoading(false);
        return;
      }

      // Save session info (optional)
      localStorage.setItem("parentAuth", "logged-in");
      localStorage.setItem(
        "parentProfileV2",
        JSON.stringify({ auth_user_id: data.user.id, email, name })
      );

      router.push("/parent-profile");
    } else {
      setError("Signup failed: no user returned");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Sign Up</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />
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
      <button onClick={signup} disabled={loading} style={{ width: "100%", padding: 10 }}>
        {loading ? "Signing up..." : "Sign Up"}
      </button>
      <p style={{ marginTop: 10 }}>
        Already have an account? <a href="/loginpage">Log in</a>
      </p>
    </div>
  );
}
