"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

export default function CreateDailyMissionPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    day_number: "",
    title: "",
    mission_time: "morning",
    activity_title: "",
    objectives: "",
    description: "",
    piko_victory: "",
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
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

  const uploadFile = async (file: File, type: "video" | "audio") => {
    const fileExt = file.name.split(".").pop();
    const fileName = `missions/${type}-${Date.now()}.${fileExt}`;
  
    console.log(`Uploading ${type}:`, fileName);
  
    const { data, error } = await supabase.storage
      .from("mission-media") // 🔴 Ensure your bucket name is correct
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
  
    if (error) {
      console.error(`Upload error (${type}):`, JSON.stringify(error, null, 2));
      alert(`Failed to upload ${type}. Check Supabase storage settings.`);
      return null;
    }
  
    console.log(`${type} uploaded. Getting public URL.`);
  
    const { data: publicUrlData, error: urlError } = supabase.storage
      .from("mission-media")
      .getPublicUrl(fileName);
  
    if (urlError || !publicUrlData) {
      console.error(`Public URL error (${type}):`, JSON.stringify(urlError, null, 2));
      alert(`Failed to get public URL for ${type}.`);
      return null;
    }
  
    console.log(`${type} public URL:`, publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    let videoUrl = "";
    let audioUrl = "";
  
    // ✅ Upload video if selected
    if (videoFile) {
      const uploadedVideoUrl = await uploadFile(videoFile, "video");
      if (uploadedVideoUrl) {
        console.log("Uploaded video URL:", uploadedVideoUrl);
        videoUrl = uploadedVideoUrl;
      } else {
        console.error("Video upload failed.");
      }
    }
  
    // ✅ Upload audio if selected
    if (audioFile) {
      const uploadedAudioUrl = await uploadFile(audioFile, "audio");
      if (uploadedAudioUrl) {
        console.log("Uploaded audio URL:", uploadedAudioUrl);
        audioUrl = uploadedAudioUrl;
      } else {
        console.error("Audio upload failed.");
      }
    }
  
    console.log("Inserting mission with video:", videoUrl, "audio:", audioUrl);
  
    // ✅ Insert into database with video_url and audio_url included
    const { error } = await supabase.from("daily_missions").insert({
      day_number: parseInt(formData.day_number),
      title: formData.title,
      mission_time: formData.mission_time,
      activity_title: formData.activity_title,
      objectives: [formData.objectives],
      description: formData.description,
      piko_victory: formData.piko_victory,
      video_url: videoUrl || null, // ✅ ensure null if empty
      audio_url: audioUrl || null,
    });
  
    setLoading(false);
  
    if (error) {
      console.error("Insert error:", error);
      alert("Failed to create mission. Check console for details.");
    } else {
      alert("Mission created successfully!");
      router.push("/admin/daily_missions");
    }
  };
  
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create Daily Mission</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="day_number"
          type="number"
          placeholder="Day Number"
          value={formData.day_number}
          onChange={handleChange}
          required
        />
        <Input
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <Input
          name="activity_title"
          placeholder="Activity Title"
          value={formData.activity_title}
          onChange={handleChange}
          required
        />
        <Textarea
          name="objectives"
          placeholder="Objectives (comma separated)"
          value={formData.objectives}
          onChange={handleChange}
        />
        <Textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />
        <Input
          name="piko_victory"
          placeholder="Piko Victory"
          value={formData.piko_victory}
          onChange={handleChange}
        />

        <div>
          <label className="block font-semibold mb-1">Upload Video</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => handleFileChange(e, setVideoFile, setVideoPreview)}
          />
          {videoPreview && (
            <video
              src={videoPreview}
              controls
              className="mt-2 rounded shadow-lg"
              width="100%"
            />
          )}
        </div>

        <div>
          <label className="block font-semibold mb-1">Upload Audio</label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => handleFileChange(e, setAudioFile, setAudioPreview)}
          />
          {audioPreview && (
            <audio
              src={audioPreview}
              controls
              className="mt-2 w-full"
            />
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? "Creating..." : "Create Mission"}
        </Button>
      </form>
    </div>
  );
}
