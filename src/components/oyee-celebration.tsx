"use client";

import { useEffect, useReducer, useRef } from "react";
import { m, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import confetti from "canvas-confetti";
import { useWebAudio } from "@/hooks/use-web-audio";

type Phase = "anticipate" | "explode" | "exhibit" | "done";

function phaseReducer(_: Phase, next: Phase): Phase {
  return next;
}

const OYEE_LETTERS = [
  { id: "o0", letter: "O" },
  { id: "y1", letter: "Y" },
  { id: "e2", letter: "E" },
  { id: "e3", letter: "E" },
  { id: "e4", letter: "E" },
  { id: "e5", letter: "E" },
  { id: "e6", letter: "E" },
];

interface Props {
  points: number;
  basePoints: number;
  onComplete: () => void;
}

export function OyeeCelebration({ points, basePoints, onComplete }: Props) {
  const [phase, dispatch] = useReducer(phaseReducer, "anticipate" as Phase);
  const { playCrescendo, playSound } = useWebAudio();
  const motionCount = useMotionValue(basePoints);
  const displayCount = useTransform(motionCount, (v) => Math.round(v));
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Reduced-motion: show static screen for 2s then finish
  useEffect(() => {
    if (!reducedMotion) return;
    const t = setTimeout(() => onCompleteRef.current(), 2000);
    return () => clearTimeout(t);
  }, [reducedMotion]);

  // Phase 1 → Phase 2 (anticipate → explode) after 500ms
  useEffect(() => {
    if (reducedMotion || phase !== "anticipate") return;
    playCrescendo();
    navigator.vibrate?.([15]);
    const t = setTimeout(() => dispatch("explode"), 500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reducedMotion]);

  // Phase 2 side-effects + transition → exhibit after 2000ms
  useEffect(() => {
    if (phase !== "explode") return;
    playSound("/sounds/epic-boom.mp3", 0.8);
    navigator.vibrate?.([50, 30, 50, 30, 100, 50, 100]);
    confetti({
      particleCount: 160,
      spread: 80,
      origin: { x: 0.5, y: 0.55 },
      colors: ["#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#10b981"],
      startVelocity: 45,
      gravity: 1.1,
      scalar: 1.1,
    });
    const sparkle = setTimeout(() =>
      confetti({
        particleCount: 80,
        spread: 120,
        origin: { x: 0.5, y: 0.5 },
        colors: ["#fde68a", "#fff", "#a78bfa"],
        startVelocity: 30,
        gravity: 0.9,
      }), 300,
    );
    const t = setTimeout(() => dispatch("exhibit"), 2000);
    return () => { clearTimeout(sparkle); clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Phase 3: animate counter, then finish after 1200ms
  useEffect(() => {
    if (phase !== "exhibit") return;
    animate(motionCount, points, { duration: 0.8, ease: "easeOut" });
    const t = setTimeout(() => {
      dispatch("done");
      onCompleteRef.current();
    }, 1200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (reducedMotion) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-center gap-4">
        <p className="text-white text-2xl font-bold">¡OYEE lo lograste!</p>
        <p className="text-yellow-400 text-4xl font-black">+{points} pts</p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <m.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={phase === "exhibit" ? onComplete : undefined}
        >
          {/* Backdrop */}
          <m.div
            className="absolute inset-0 bg-zinc-950"
            animate={{ opacity: phase === "anticipate" ? 0.2 : 0.88 }}
            transition={{ duration: 0.3 }}
          />

          {/* Phase 1 — golden aura ring */}
          {phase === "anticipate" && (
            <m.div
              className="absolute size-32 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 0px 0px gold",
                  "0 0 40px 20px gold",
                  "0 0 60px 30px #ff6b00",
                  "0 0 40px 20px gold",
                ],
              }}
              transition={{ duration: 0.5, ease: "easeIn" }}
            />
          )}

          {/* White flash */}
          {phase === "explode" && (
            <m.div
              className="absolute inset-0 bg-white pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0] }}
              transition={{ duration: 0.18, times: [0, 0.3, 1] }}
            />
          )}

          {/* OYEE text */}
          <AnimatePresence>
            {(phase === "explode" || phase === "exhibit") && (
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="flex">
                  {OYEE_LETTERS.map(({ id, letter }, i) => (
                    <m.span
                      key={id}
                      className="font-black text-6xl text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]"
                      initial={{ opacity: 0, y: 40, scale: 0.5 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        delay: i * 0.08,
                        type: "spring",
                        stiffness: 500,
                        damping: 18,
                      }}
                    >
                      {letter}
                    </m.span>
                  ))}
                </div>

                <m.p
                  className="text-white font-black text-3xl tracking-tight drop-shadow-lg"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: [0, 1.3, 1], opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5, type: "spring" }}
                >
                  ¡LO LOGRASTE!
                </m.p>

                {/* Exhibit phase */}
                {phase === "exhibit" && (
                  <>
                    <m.p
                      className="text-yellow-300 font-black text-6xl drop-shadow-lg"
                      initial={{ y: -60, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    >
                      <m.span>{displayCount}</m.span>
                      <span className="text-3xl ml-1">pts</span>
                    </m.p>

                    <m.p
                      className="text-white text-lg font-semibold"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 1.1, times: [0, 0.15, 0.7, 1] }}
                    >
                      ¡Eres imparable! 🚀
                    </m.p>

                    <m.p
                      className="text-white/60 text-sm mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      Toca para continuar
                    </m.p>
                  </>
                )}
              </div>
            )}
          </AnimatePresence>
        </m.div>
      )}
    </AnimatePresence>
  );
}
