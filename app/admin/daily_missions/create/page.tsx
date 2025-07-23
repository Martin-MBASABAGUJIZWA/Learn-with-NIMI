"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

export default function CreateDailyMissionPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    day_number: "",
    day: "",
    date: "",
    title: "",
    mission_time: "morning",
    activity_title: "",
    objectives: "",
    description: "",
    piko_victory: "",
    icon: "",
    material: "",
    points: "",
    theme: "",
    emoji: "",
    activity: "",
    duration: "",
    type: "",
    fun_fact: "",
    translations: "",
    order: "",
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [storybookFile, setStorybookFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [storybookPreview, setStorybookPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    previewSetter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setter(file);
      previewSetter(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, type: string) => {
    const ext = file.name.split(".").pop();
    const path = `missions/${type}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("mission-media").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });
    if (error) {
      console.error(`${type} upload error:`, error);
      alert(`Failed to upload ${type}.`);
      return null;
    }
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const { publicUrl } = supabase.storage.from("mission-media").getPublicUrl(path).data;
  if (!publicUrl) {
    console.error(`${type} public URL not found`);
    alert(`Failed to get ${type} public URL.`);
  }
  const uploadStorybookFile = async (file: File) => {
    const ext = file.name.split(".").pop();
    const today = new Date().toISOString().split("T")[0];
    const path = `storybook/${today}.${ext}`;

    const { error } = await supabase.storage.from("storybook").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

    if (error) {
      console.error("Storybook upload error:", error);
      alert("Failed to upload storybook.");
      return null;
    }

    const { data: publicUrlData, error: urlError } = supabase.storage.from("storybook").getPublicUrl(path);
    if (urlError || !publicUrlData) {
      console.error("Storybook public URL error:", urlError);
      alert("Failed to get storybook public URL.");
      return null;
    }

    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let videoUrl = "";
    let storybookUrl = "";

    if (videoFile) videoUrl = (await uploadFile(videoFile, "video")) || "";
    if (storybookFile) storybookUrl = (await uploadStorybookFile(storybookFile)) || "";

    const insertData = {
      day_number: parseInt(formData.day_number) || null,
      day: formData.day,
      date: formData.date,
      title: formData.title,
      mission_time: formData.mission_time,
      activity_title: formData.activity_title,
      objectives: formData.objectives.split(",").map((s) => s.trim()), // if array in db
      description: formData.description,
      piko_victory: formData.piko_victory,
      video_url: videoUrl || null,
      icon: formData.icon,
      material: formData.material,
      points: formData.points ? parseInt(formData.points) : null,
      theme: formData.theme,
      emoji: formData.emoji,
      activity: formData.activity,
      duration: formData.duration,
      type: formData.type,
      fun_fact: formData.fun_fact,
      translations: formData.translations ? JSON.parse(formData.translations) : {}, // expects JSON
      storybook: storybookUrl || null,
      order: formData.order ? parseInt(formData.order) : null,
    };

    console.log("Inserting daily mission:", insertData);

    const { error } = await supabase.from("daily_missions").insert(insertData);

    setLoading(false);

    if (error) {
      console.error("Create mission error:", error);
      alert("Failed to create mission. Check console.");
    } else {
      alert("Mission created successfully!");
      router.push("/admin/daily_missions");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create Daily Mission</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { name: "day_number", type: "number", placeholder: "Day Number" },
          { name: "day", placeholder: "Day (e.g. Monday)" },
          { name: "date", type: "date", placeholder: "Date" },
          { name: "title", placeholder: "Title" },
          { name: "activity_title", placeholder: "Activity Title" },
          { name: "objectives", placeholder: "Objectives (comma separated)" },
          { name: "description", placeholder: "Description" },
          { name: "piko_victory", placeholder: "Piko Victory" },
          { name: "icon", placeholder: "Icon URL or class" },
          { name: "material", placeholder: "Materials needed" },
          { name: "points", type: "number", placeholder: "Points" },
          { name: "theme", placeholder: "Theme" },
          { name: "emoji", placeholder: "Emoji" },
          { name: "activity", placeholder: "Activity" },
          { name: "duration", placeholder: "Duration" },
          { name: "type", placeholder: "Type" },
          { name: "fun_fact", placeholder: "Fun Fact" },
          { name: "translations", placeholder: "Translations (JSON)" },
          { name: "order", type: "number", placeholder: "Order" },
        ].map((field) => (
          <Input
            key={field.name}
            name={field.name}
            type={field.type || "text"}
            placeholder={field.placeholder}
            value={(formData as any)[field.name]}
            onChange={handleChange}
          />
        ))}

        <div>
          <label className="block font-semibold mb-1">Upload Video</label>
          <input type="file" accept="video/*" onChange={(e) => handleFileChange(e, setVideoFile, setVideoPreview)} />
          {videoPreview && <video src={videoPreview} controls className="mt-2 rounded shadow w-full" />}
        </div>
        <div>
          <label className="block font-semibold mb-1">Upload Storybook PDF</label>
          <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, setStorybookFile, setStorybookPreview)} />
          {storybookPreview && <iframe src={storybookPreview} className="mt-2 w-full h-64 border rounded" />}
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
          {loading ? "Creating..." : "Create Mission"}
        </Button>
      </form>
    </div>
  );
}
