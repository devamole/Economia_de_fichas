"use client";

import { useCallback } from "react";
import confetti from "canvas-confetti";

export function useCelebrate() {
  const celebrate = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#7c3aed", "#4f46e5", "#84cc16", "#10b981", "#f59e0b"],
      scalar: 0.9,
      gravity: 1.2,
      ticks: 180,
    });

    // Soft haptic vibration where supported
    if ("vibrate" in navigator) {
      navigator.vibrate([30, 20, 60]);
    }
  }, []);

  return celebrate;
}
