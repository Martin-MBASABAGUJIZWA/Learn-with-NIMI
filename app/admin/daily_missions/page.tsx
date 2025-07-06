"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DailyMissionsPage() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMissionTitle, setNewMissionTitle] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchMissions = async () => {
      const { data, error } = await supabase.from("daily_missions").select("*");
      if (error) console.error("Error fetching missions:", error);
      else setMissions(data);
      setLoading(false);
    };
    fetchMissions();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this mission?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("daily_missions").delete().eq("id", id);
    if (!error) {
      setMissions(missions.filter((m) => m.id !== id));
    } else {
      console.error("Delete failed:", error);
      alert("Failed to delete mission.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionTitle.trim()) {
      alert("Please enter a title");
      return;
    }

    const { data, error } = await supabase.from("daily_missions").insert({
      day_number: missions.length + 1,
      title: newMissionTitle,
      mission_time: "morning",
      activity_title: "Default Activity",
      objectives: ["Sample objective"],
      description: "Sample description",
      piko_victory: "Sample victory",
    }).select();

    if (error) {
      console.error("Create mission error:", error);
      alert("Failed to create mission.");
    } else {
      setMissions([...missions, ...data]);
      setNewMissionTitle("");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Daily Missions</h1>
        <Button
          onClick={() => router.push("/admin/daily_missions/create")}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Add Mission
        </Button>
      </div>

      {/* Inline quick add form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={newMissionTitle}
          onChange={(e) => setNewMissionTitle(e.target.value)}
          placeholder="New Mission Title"
          className="flex-1"
        />
        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
          Quick Add
        </Button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : missions.length === 0 ? (
        <p>No missions found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {missions.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4 space-y-2">
                <h2 className="font-semibold">
                  Day {m.day_number}: {m.title}
                </h2>
                <p className="text-sm">Time: {m.mission_time}</p>
                <p className="text-sm">Activity: {m.activity_title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {m.description}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => router.push(`/admin/daily_missions/${m.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleDelete(m.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
