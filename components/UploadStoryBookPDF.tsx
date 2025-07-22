// components/UploadStorybookPDF.tsx
"use client";
import { useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function UploadStorybookPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage("");

    const today = new Date().toISOString().split("T")[0]; // e.g., 2025-07-08
    const filePath = `storybook/${today}.pdf`;

    const { error } = await supabase.storage
      .from("storybook")
      .upload(filePath, file, { upsert: true });

    if (error) {
      setMessage("❌ Upload failed: " + error.message);
    } else {
      setMessage("✅ Uploaded successfully for " + today);
    }

    setUploading(false);
  };

  return (
    <div className="p-4 border rounded-xl shadow-md bg-white w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">📤 Upload Today’s Storybook</h2>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-2"
      />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {uploading ? "Uploading..." : "Upload PDF"}
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}
