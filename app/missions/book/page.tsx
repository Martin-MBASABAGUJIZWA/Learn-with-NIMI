"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, Calendar } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNavigation from "@/components/BottomNavigation";

interface Summary {
  id: string;
  date: string;
  mission_ids: string[];
  completed_count: number;
  notes: string;
}

export default function MissionBookPage() {
  const { user } = useUser();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchSummaries = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("missions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) console.error(error);
      else setSummaries(data || []);
      setLoading(false);
    };
    fetchSummaries();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 to-purple-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 flex-grow">
        <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-purple-600" /> My Mission Book
        </h1>

        {loading ? (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p>Loading summaries…</p>
          </div>
        ) : summaries.length === 0 ? (
          <p className="text-center text-gray-500">No mission summaries yet.</p>
        ) : (
          <div className="space-y-6">
            {summaries.map((summary) => (
              <Card key={summary.id} className="bg-white shadow-md rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Calendar className="w-5 h-5" />{" "}
                    {new Date(summary.date).toDateString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2">
                    <strong>{summary.completed_count}</strong> missions completed.
                  </p>
                  <p className="italic text-gray-700">{summary.notes}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNavigation />
      <Footer />
    </div>
  );
}
