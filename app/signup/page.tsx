"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import supabase from "@/lib/supabaseClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [avatar, setAvatar] = useState("👧");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !age || !password) return alert("Fill all fields!");
    const newId = uuidv4();

    const { error } = await supabase.from("users").insert({
      id: newId,
      name,
      age,
      avatar,
      level: 1,
      points: 0,
      streak: 0,
      friends: 0,
    });

    if (error) {
      alert("Signup failed: " + error.message);
    } else {
      localStorage.setItem("user_id", newId);
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-between">
      <Header />
      <main className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg text-center space-y-6">
        <h1 className="text-3xl font-bold text-purple-600">🎉 Create Your Profile</h1>

        <input
          className="w-full p-3 border rounded-lg text-lg"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="number"
          className="w-full p-3 border rounded-lg text-lg"
          placeholder="Your Age"
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
        />

        <select
          className="w-full p-3 border rounded-lg text-lg"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
        >
          {["👧", "👦", "🧒", "👶", "🧑‍🎓"].map((emoji) => (
            <option key={emoji} value={emoji}>
              {emoji}
            </option>
          ))}
        </select>

        <input
          className="w-full p-3 border rounded-lg text-lg"
          placeholder="Choose a fun password"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full p-3 rounded-full bg-purple-500 text-white font-bold text-lg"
          onClick={handleSignup}
        >
          🚀 Let's Go!
        </button>

        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-purple-600 underline cursor-pointer"
          >
            Log in
          </span>
        </p>
      </main>
      <Footer />
    </div>
  );
}
