"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function KidNameLogin() {
  const [kidName, setKidName] = useState("");
  const [matches, setMatches] = useState<{ id: string; name: string; avatar_url: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!kidName.trim()) {
      setErrorMsg("Please enter your name to start.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setMatches([]);

    // Query students table with case-insensitive match
    const { data, error } = await supabase
      .from("students")
      .select("id, name, avatar_url") // ensure avatar_url exists in your table
      .ilike("name", kidName.trim())
      .limit(5);

    setLoading(false);

    if (error) {
      setErrorMsg("Error checking name. Please try again.");
      return;
    }

    if (!data || data.length === 0) {
      setErrorMsg("Name not found. Please check your spelling or ask your parent.");
      return;
    }

    if (data.length === 1) {
      // Unique match – proceed immediately
      localStorage.setItem("student_id", data[0].id);
      router.push("/");
      return;
    }

    // Multiple matches – show avatar picker
    setMatches(data);
  };

  const handleSelectKid = (kid: { id: string; name: string }) => {
    localStorage.setItem("student_id", kid.id);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-between">
      <Header />
      <main className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg text-center space-y-6">
        <h1 className="text-3xl font-bold text-blue-600">👧🏾 Enter Your Name</h1>

        <input
          type="text"
          className="w-full p-3 border rounded-lg text-lg"
          placeholder="Type your name here"
          value={kidName}
          onChange={(e) => {
            setKidName(e.target.value);
            setErrorMsg("");
          }}
          aria-label="Kid name input"
          disabled={loading || matches.length > 0}
        />

        {errorMsg && (
          <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
        )}

        {loading && <p className="text-gray-600">Checking...</p>}

        {!loading && matches.length === 0 && (
          <button
            className="w-full p-3 rounded-full bg-blue-500 text-white font-bold text-lg"
            onClick={handleLogin}
          >
            🚀 Let's Start!
          </button>
        )}

        {matches.length > 1 && (
          <div className="space-y-4">
            <p className="text-gray-700 font-medium">We found multiple kids with that name. Which one is you?</p>
            <div className="grid grid-cols-2 gap-4">
              {matches.map((kid) => (
                <div
                  key={kid.id}
                  onClick={() => handleSelectKid(kid)}
                  className="flex flex-col items-center p-4 bg-blue-100 rounded-xl cursor-pointer hover:bg-blue-200"
                >
                  <img
                    src={kid.avatar_url || "/default-avatar.png"}
                    alt={kid.name}
                    className="w-20 h-20 rounded-full object-cover mb-2"
                  />
                  <span className="text-lg font-semibold">{kid.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
