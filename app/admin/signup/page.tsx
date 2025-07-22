"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import supabase from "@/lib/supabaseClient";

export default function AdminSignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password) return alert("Fill all fields!");
    const newId = uuidv4();

    const { error } = await supabase.from("admins").insert({
      id: newId,
      name,
      email,
      password,
      role: "admin",
    });

    if (error) {
      alert("Signup failed: " + error.message);
    } else {
      localStorage.setItem("admin_id", newId);
      router.push("/admin");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Admin Signup</h1>
      <input
        className="border p-2 w-full rounded"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
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
        onClick={handleSignup}
      >
        Create Admin
      </button>
    </div>
  );
}
