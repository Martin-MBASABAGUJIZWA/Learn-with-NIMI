"use client";

import React, { useEffect, useState } from "react";

export default function NimiChat({
  open,
  onClose,
  message,
  voiceEnabled = true,
  avatar,
}: {
  open: boolean;
  onClose: () => void;
  message?: string;
  voiceEnabled?: boolean;
  avatar?: React.ReactNode;
}) {
  const [chat, setChat] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (message) {
      sendToAI(message);
    }
  }, [message]);

  const sendToAI = async (question: string) => {
    setChat((prev) => [...prev, "You: " + question]);
    const res = await fetch("/api/nimi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setChat((prev) => [...prev, "Nimi: " + data.answer]);

    if (voiceEnabled && typeof window !== "undefined") {
      const utter = new SpeechSynthesisUtterance(data.answer);
      window.speechSynthesis.speak(utter);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-xl shadow-xl w-80">
      <div className="flex justify-between items-center mb-2">
        {avatar}
        <button onClick={onClose}>×</button>
      </div>
      <div className="h-48 overflow-y-auto mb-2 space-y-1 text-sm">
        {chat.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded"
          onClick={() => {
            sendToAI(input);
            setInput("");
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
