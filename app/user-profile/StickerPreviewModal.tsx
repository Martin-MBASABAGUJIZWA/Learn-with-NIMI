"use client";

import React from "react";

interface Sticker {
  id: string;
  name: string;
  imageUrl: string;
}

interface StickerPreviewModalProps {
  sticker: Sticker;
  onClose: () => void;
}

export default function StickerPreviewModal({ sticker, onClose }: StickerPreviewModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stickerTitle"
      onClick={onClose}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="bg-white rounded-xl p-6 max-w-xs w-full text-center shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="stickerTitle" className="text-2xl font-bold mb-4 text-pink-600">
          {sticker.name}
        </h2>
        <img
          src={sticker.imageUrl}
          alt={sticker.name}
          className="mx-auto w-40 h-40 mb-4"
        />
        <a
          href={sticker.imageUrl}
          download={sticker.name.replace(/\s+/g, "_").toLowerCase() + ".png"}
          className="inline-block bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 font-semibold"
        >
          Download Sticker
        </a>
        <button
          onClick={onClose}
          className="block mt-4 text-gray-600 hover:text-gray-800"
          aria-label="Close sticker preview"
        >
          Close ✖️
        </button>
      </div>
    </div>
  );
}
