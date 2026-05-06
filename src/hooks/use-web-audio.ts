"use client";

import { useCallback } from "react";

export function useWebAudio() {
  // Synthetic soft click via Web Audio API — no audio file required
  const playClick = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }, []);

  // Rising buzz for epic anticipation phase (200Hz → 900Hz over 500ms)
  const playCrescendo = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.52);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.55);
    } catch {}
  }, []);

  // Two-ping coin sound for minor boost — no file required
  const playCoin = useCallback(() => {
    try {
      const ctx = new AudioContext();
      [880, 1100].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.28);
      });
    } catch {}
  }, []);

  // File-based playback (swallows NotAllowedError silently)
  const playSound = useCallback((src: string, volume = 1.0) => {
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  return { playClick, playCrescendo, playCoin, playSound };
}
