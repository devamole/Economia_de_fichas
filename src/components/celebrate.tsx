"use client";

import { useCallback } from "react";
import confetti from "canvas-confetti";
import { useWebAudio } from "@/hooks/use-web-audio";

export function useCelebrate() {
  const { playClick } = useWebAudio();

  const celebrate = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    confetti({
      particleCount: 40,
      spread: 55,
      origin: { y: 0.7 },
      colors: ["#7c3aed", "#4f46e5", "#84cc16", "#10b981", "#f59e0b"],
      scalar: 0.9,
      gravity: 1.2,
      ticks: 160,
    });

    // Spec §2.1: single 15ms haptic pulse
    navigator.vibrate?.(15);

    // Soft click sound (synthetic, no audio file needed)
    playClick();
  }, [playClick]);

  return celebrate;
}
