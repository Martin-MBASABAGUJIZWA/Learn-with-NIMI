"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return alert("Fill all fields!");

    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) {
      alert("Invalid credentials");
    } else {
      localStorage.setItem("admin_id", data.id);
      router.push("/admin");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Admin Login</h1>
      <input
        className="border p-2 w-full rounded"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2 w-full rounded"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="bg-purple-600 text-white p-2 rounded w-full"
        onClick={handleLogin}
      >
        Log In
      </button>
       <p className="text-sm text-gray-600">
          Don’t have an account?{" "}
          <span
            onClick={() => router.push("/admin/signup")}
            className="text-blue-600 underline cursor-pointer"
          >
            Sign up
          </span>
        </p>
    </div>
  );
}
