import confetti from "canvas-confetti";

export const launchMagic = () => {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  confetti({
    particleCount: 40,
    spread: 60,
    origin: { y: 0.6 },
  });
};