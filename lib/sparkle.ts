import confetti from "canvas-confetti";

export const launchConfetti = () => {
  confetti({
    particleCount: 40,
    spread: 60,
    origin: { y: 0.6 },
  });
};
