"use client";

import React, { useState, useEffect, ChangeEvent } from "react";

interface EditProfileModalProps {
  currentName: string;
  currentBio: string;
  currentAvatarPreview: string | null;
  onAvatarFileChange: (file: File) => void;
  onClose: () => void;
  onSave: (name: string, bio: string, avatarFile?: File) => void;
  uploading: boolean;
  uploadError: string | null;
  emojiList: string[];
}

export default function EditProfileModal({
  currentName,
  currentBio,
  currentAvatarPreview,
  onAvatarFileChange,
  onClose,
  onSave,
  uploading,
  uploadError,
  emojiList,
}: EditProfileModalProps) {
  const [name, setName] = useState(currentName);
  const [bio, setBio] = useState(currentBio);
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);

  useEffect(() => {
    setName(currentName);
    setBio(currentBio);
  }, [currentName, currentBio]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      onAvatarFileChange(e.target.files[0]);
    }
  };

  const addEmoji = (emoji: string) => {
    setBio((b) => b + emoji);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editProfileTitle"
    >
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-lg">
        <h2 id="editProfileTitle" className="text-2xl font-bold mb-4 text-pink-600">
          Edit Profile
        </h2>

        <label className="block mb-2 font-semibold">
          Name
          <input
            type="text"
            className="w-full border rounded p-2 mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={uploading}
          />
        </label>

        <label className="block mb-2 font-semibold">
          Bio
          <textarea
            className="w-full border rounded p-2 mt-1"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={uploading}
          />
        </label>

        {/* Emoji Picker */}
        <div className="mb-4">
          <p className="font-semibold mb-1">Add Emoji</p>
          <div className="flex flex-wrap gap-2">
            {emojiList.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="text-2xl hover:scale-110 transition"
                aria-label={`Add emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <label className="block mb-4 font-semibold">
          Upload New Avatar
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="mt-1"
          />
        </label>

        {currentAvatarPreview && (
          <img
            src={currentAvatarPreview}
            alt="Avatar preview"
            className="w-24 h-24 rounded-full mb-4"
          />
        )}

        {uploadError && <p className="text-red-600 mb-2">{uploadError}</p>}

        <div className="flex justify-end space-x-4">
          <button
            className="bg-gray-300 rounded px-4 py-2 hover:bg-gray-400"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            className="bg-pink-500 text-white rounded px-4 py-2 hover:bg-pink-600"
            onClick={() => onSave(name.trim() || "New Learner", bio.trim() || "Every mission makes me stronger! 💪", avatarFile)}
            disabled={uploading}
          >
            {uploading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
