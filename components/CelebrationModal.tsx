// components/CelebrationModal.tsx
import React from "react";

type CelebrationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
};

export default function CelebrationModal({ isOpen, onClose, message }: CelebrationModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}>
      <div style={{
        background: "white",
        padding: "2rem",
        borderRadius: "12px",
        textAlign: "center",
        maxWidth: "90vw",
      }}>
        <h2>🎉 Congratulations! 🎉</h2>
        <p>{message || "You completed the mission!"}</p>
        <button onClick={onClose} style={{ marginTop: "1rem" }}>Close</button>
      </div>
    </div>
  );
}
