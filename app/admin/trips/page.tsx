"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Trip {
  id: number;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  guide_name: string | null;
  image_url: string | null;
  video_url: string | null;
}

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [newTrip, setNewTrip] = useState<Partial<Trip>>({
    title: "",
    description: "",
    date: "",
    location: "",
    guide_name: "",
    image_url: null,
    video_url: null,
  });
  const router = useRouter();

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .order("date", { ascending: true });
    if (error) alert("Error fetching trips: " + error.message);
    else setTrips(data || []);
    setLoading(false);
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("trip-media")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      alert(`Upload failed: ${uploadError.message}`);
      return null;
    }

    const { data: publicUrlData, error: urlError } = supabase.storage
      .from("trip-media")
      .getPublicUrl(filePath);

    if (urlError || !publicUrlData.publicUrl) {
      alert("Failed to get public URL");
      return null;
    }

    return publicUrlData.publicUrl;
  };

  const handleAddTrip = async () => {
    if (!newTrip.title || !newTrip.date) {
      alert("Title and Date are required");
      return;
    }

    const { data, error } = await supabase.from("trips").insert([newTrip]);
    if (error) {
      alert("Error adding trip: " + error.message);
    } else {
      setNewTrip({
        title: "",
        description: "",
        date: "",
        location: "",
        guide_name: "",
        image_url: null,
        video_url: null,
      });
      fetchTrips();
    }
  };

  const startEdit = (trip: Trip) => setEditingTrip(trip);
  const cancelEdit = () => setEditingTrip(null);

  const saveEdit = async () => {
    if (!editingTrip || !editingTrip.title || !editingTrip.date) {
      alert("Title and Date are required");
      return;
    }
    const { error } = await supabase
      .from("trips")
      .update(editingTrip)
      .eq("id", editingTrip.id);

    if (error) alert("Error updating trip: " + error.message);
    else {
      setEditingTrip(null);
      fetchTrips();
    }
  };

  const deleteTrip = async (id: number) => {
    if (!confirm("Delete this trip?")) return;
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) alert("Error deleting trip: " + error.message);
    else fetchTrips();
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-[#5e548e]" />
      </div>
    );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-[#5e548e] mb-4">Admin Trips</h1>

      {/* Add New Trip */}
      <Card className="p-6 bg-white rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-4">Add New Trip</h2>
        {["Title *", "Description", "Date", "Location", "Guide Name"].map((label, idx) => (
          <input
            key={idx}
            type={label === "Date" ? "date" : "text"}
            placeholder={label}
            className="w-full p-2 mb-3 border rounded"
            value={newTrip[label.toLowerCase().replace(" *", "").replace(" ", "_")] || ""}
            onChange={(e) =>
              setNewTrip((prev) => ({
                ...prev,
                [label.toLowerCase().replace(" *", "").replace(" ", "_")]: e.target.value,
              }))
            }
          />
        ))}
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const url = await uploadFile(file, "images");
              if (url) setNewTrip((prev) => ({ ...prev, image_url: url }));
            }
          }}
          className="mb-3"
        />
        {newTrip.image_url && <img src={newTrip.image_url} className="max-w-xs mb-3 rounded" />}

        <input
          type="file"
          accept="video/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const url = await uploadFile(file, "videos");
              if (url) setNewTrip((prev) => ({ ...prev, video_url: url }));
            }
          }}
          className="mb-3"
        />
        {newTrip.video_url && (
          <video src={newTrip.video_url} controls className="max-w-xs mb-3 rounded" />
        )}

        <button
          onClick={handleAddTrip}
          className="bg-[#5e548e] text-white px-6 py-2 rounded hover:bg-[#3f3560] transition"
        >
          Add Trip
        </button>
      </Card>

      {/* List Trips */}
      <div className="space-y-6">
        {trips.map((trip) =>
          editingTrip && editingTrip.id === trip.id ? (
            <Card key={trip.id} className="p-6 bg-white rounded-xl shadow">
              <h2 className="text-xl font-semibold mb-4">Edit Trip #{trip.id}</h2>
              {["Title *", "Description", "Date", "Location", "Guide Name"].map((label, idx) => (
                <input
                  key={idx}
                  type={label === "Date" ? "date" : "text"}
                  placeholder={label}
                  className="w-full p-2 mb-3 border rounded"
                  value={
                    editingTrip[label.toLowerCase().replace(" *", "").replace(" ", "_")] || ""
                  }
                  onChange={(e) =>
                    setEditingTrip((prev) =>
                      prev
                        ? {
                            ...prev,
                            [label
                              .toLowerCase()
                              .replace(" *", "")
                              .replace(" ", "_")]: e.target.value,
                          }
                        : null
                    )
                  }
                />
              ))}
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadFile(file, "images");
                    if (url)
                      setEditingTrip((prev) => (prev ? { ...prev, image_url: url } : null));
                  }
                }}
                className="mb-3"
              />
              {editingTrip.image_url && (
                <img src={editingTrip.image_url} className="max-w-xs mb-3 rounded" />
              )}

              <input
                type="file"
                accept="video/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadFile(file, "videos");
                    if (url)
                      setEditingTrip((prev) => (prev ? { ...prev, video_url: url } : null));
                  }
                }}
                className="mb-3"
              />
              {editingTrip.video_url && (
                <video src={editingTrip.video_url} controls className="max-w-xs mb-3 rounded" />
              )}

              <div className="flex gap-4">
                <button
                  onClick={saveEdit}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </Card>
          ) : (
            <Card key={trip.id} className="p-6 bg-white rounded-xl shadow">
              <h2 className="text-xl font-semibold mb-2">{trip.title}</h2>
              <p className="mb-1">{trip.description}</p>
              <p className="mb-1"><strong>Date:</strong> {trip.date}</p>
              <p className="mb-1"><strong>Location:</strong> {trip.location || "N/A"}</p>
              <p className="mb-1"><strong>Guide:</strong> {trip.guide_name || "N/A"}</p>
              {trip.image_url && (
                <img src={trip.image_url} className="max-w-xs mb-3 rounded" />
              )}
              {trip.video_url && (
                <video src={trip.video_url} controls className="max-w-xs mb-3 rounded" />
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => startEdit(trip)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTrip(trip.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
