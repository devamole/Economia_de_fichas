"use client";

import { useCallback, useEffect } from "react";

// Shared AudioContext across all hook instances — created once, resumed on first interaction
let _ctx: AudioContext | null = null;
const _buffers = new Map<string, AudioBuffer>();

function getCtx(): AudioContext {
  if (!_ctx || _ctx.state === "closed") {
    _ctx = new AudioContext();
  }
  return _ctx;
}

// Decode an audio file and cache its buffer. Multiple simultaneous calls are safe.
async function fetchBuffer(src: string): Promise<AudioBuffer | null> {
  if (_buffers.has(src)) return _buffers.get(src)!;
  try {
    const ab = await fetch(src).then((r) => r.arrayBuffer());
    const buf = await getCtx().decodeAudioData(ab);
    _buffers.set(src, buf);
    return buf;
  } catch {
    return null;
  }
}

export function useWebAudio() {
  // Resume the shared context on the first user interaction so that sounds
  // triggered after an async operation (server call) can play without restriction.
  useEffect(() => {
    const unlock = () => {
      if (!_ctx) {
        _ctx = new AudioContext();
      } else if (_ctx.state === "suspended") {
        _ctx.resume();
      }
    };
    document.addEventListener("click", unlock, { once: true, capture: true });
    document.addEventListener("touchstart", unlock, { once: true, capture: true });
    return () => {
      document.removeEventListener("click", unlock, { capture: true });
      document.removeEventListener("touchstart", unlock, { capture: true });
    };
  }, []);

  const playClick = useCallback(() => {
    try {
      const ctx = getCtx();
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

  const playCrescendo = useCallback(() => {
    try {
      const ctx = getCtx();
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

  const playCoin = useCallback(() => {
    try {
      const ctx = getCtx();
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

  // Play an audio file via Web Audio decode pipeline (no autoplay restriction)
  const playSound = useCallback(async (src: string, volume = 1.0) => {
    try {
      const audioCtx = getCtx();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      const buffer = await fetchBuffer(src);
      if (!buffer) return;
      const source = audioCtx.createBufferSource();
      const gain = audioCtx.createGain();
      gain.gain.value = volume;
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(audioCtx.destination);
      source.start();
    } catch {}
  }, []);

  return { playClick, playCrescendo, playCoin, playSound };
}
