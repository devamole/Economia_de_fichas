"use client";

import { useEffect, useRef, useMemo } from "react";
import { m, useMotionValue, useTransform, animate as fmAnimate } from "framer-motion";
import confetti from "canvas-confetti";
import { useWebAudio } from "@/hooks/use-web-audio";

const MESSAGES = [
  "¡Misión cumplida! 🚀",
  "¡Imparable! ⚡",
  "¡Crack total! 🔥",
  "¡Eres una máquina! 💪",
  "¡Sin parar! 🎯",
  "¡Brutal! 🌟",
  "¡Lo estás petando! 🏆",
  "¡Sigue así! 💫",
  "¡Tú puedes con todo! ⭐",
];

interface Props {
  points: number;
  taskTitle: string;
  isPending: boolean;
  onComplete: () => void;
}

export function TaskCompletionCelebration({ points, taskTitle, isPending, onComplete }: Props) {
  const { playCompletion } = useWebAudio();
  const motionPoints = useMotionValue(0);
  const displayPoints = useTransform(motionPoints, (v) => Math.round(v));
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const message = useMemo(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)], []);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(() => onCompleteRef.current(), 1600);
      return () => clearTimeout(t);
    }

    playCompletion();
    navigator.vibrate?.([40, 15, 80, 10, 40]);

    // Main burst — purple + gold particles from center
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.55, x: 0.5 },
      colors: ["#7c3aed", "#a78bfa", "#c4b5fd", "#fbbf24", "#10b981", "#fff"],
      startVelocity: 40,
      gravity: 1.1,
      scalar: 0.9,
      ticks: 230,
    });

    // Side gold bursts 250ms later
    const sideT = setTimeout(() => {
      confetti({
        particleCount: 28,
        angle: 58,
        spread: 48,
        origin: { x: 0.12, y: 0.62 },
        colors: ["#fbbf24", "#fde68a", "#f59e0b"],
        startVelocity: 28,
        gravity: 1.2,
        scalar: 0.72,
      });
      confetti({
        particleCount: 28,
        angle: 122,
        spread: 48,
        origin: { x: 0.88, y: 0.62 },
        colors: ["#fbbf24", "#fde68a", "#f59e0b"],
        startVelocity: 28,
        gravity: 1.2,
        scalar: 0.72,
      });
    }, 240);

    // Points counter kicks in after card is fully open
    const counterT = setTimeout(() => {
      fmAnimate(motionPoints, points, { duration: 0.65, ease: "easeOut" });
    }, 370);

    // Auto dismiss
    const exitT = setTimeout(() => onCompleteRef.current(), 2050);

    return () => {
      clearTimeout(sideT);
      clearTimeout(counterT);
      clearTimeout(exitT);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (reducedMotion) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85">
        <div className="mx-5 rounded-[2rem] bg-purple-950 p-8 text-center ring-1 ring-purple-500/30">
          <p className="font-fredoka text-5xl font-black text-amber-300">+{points}</p>
          <p className="mt-1 font-fredoka text-xl font-semibold text-amber-400/60">puntos</p>
          <p className="mt-3 text-sm text-white/50">{taskTitle}</p>
        </div>
      </div>
    );
  }

  return (
    <m.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at 50% 52%, rgba(76,29,149,0.93) 0%, rgba(8,4,25,0.95) 100%)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.28 } }}
      transition={{ duration: 0.16 }}
      onClick={() => onCompleteRef.current()}
    >
      {/* Outer shell — Doppelrand / double-bezel */}
      <m.div
        className="relative z-10 mx-5"
        initial={{ scale: 0.76, y: 32, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.88, y: -18, opacity: 0, transition: { duration: 0.26, ease: [0.32, 0, 0.67, 0] } }}
        transition={{ type: "spring", stiffness: 430, damping: 26, mass: 0.72 }}
        style={{
          padding: "5px",
          borderRadius: "2.5rem",
          background:
            "linear-gradient(135deg, rgba(167,139,250,0.42) 0%, rgba(79,70,229,0.14) 55%, rgba(255,255,255,0.05) 100%)",
          border: "1px solid rgba(167,139,250,0.22)",
          boxShadow: [
            "0 0 100px -12px rgba(124,58,237,0.65)",
            "0 48px 96px -24px rgba(0,0,0,0.55)",
            "inset 0 1px 0 rgba(255,255,255,0.12)",
          ].join(", "),
        }}
      >
        {/* Inner core */}
        <div
          style={{
            borderRadius: "calc(2.5rem - 5px)",
            background: "linear-gradient(168deg, rgba(22,11,58,0.97) 0%, rgba(10,5,32,0.99) 100%)",
            padding: "2.25rem 1.75rem 1.75rem",
            minWidth: "260px",
            maxWidth: "300px",
            textAlign: "center",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Ambient glow orb behind checkmark */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,58,237,0.32) 0%, transparent 68%)",
              top: -24,
              left: "50%",
              transform: "translateX(-50%)",
              filter: "blur(28px)",
              pointerEvents: "none",
            }}
          />

          {/* Check circle */}
          <m.div
            className="relative mx-auto mb-5 flex items-center justify-center"
            initial={{ scale: 0, rotate: -50 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 540, damping: 22, delay: 0.04 }}
            style={{
              width: 82,
              height: 82,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              boxShadow: [
                "0 0 36px -4px rgba(124,58,237,0.85)",
                "0 8px 28px -6px rgba(0,0,0,0.45)",
                "inset 0 1px 1px rgba(255,255,255,0.22)",
              ].join(", "),
            }}
          >
            {/* Self-drawing SVG checkmark */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
              <m.path
                d="M8 20L16.5 29.5L32 11"
                stroke="white"
                strokeWidth="3.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.38, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>

            {/* Expanding ring pulse when checkmark completes */}
            <m.div
              style={{ position: "absolute", inset: 0, borderRadius: "50%" }}
              initial={{ boxShadow: "0 0 0 0px rgba(124,58,237,0.7)" }}
              animate={{ boxShadow: "0 0 0 26px rgba(124,58,237,0)" }}
              transition={{ duration: 0.78, delay: 0.55, ease: "easeOut" }}
            />

            {/* Second slower ring for depth */}
            <m.div
              style={{ position: "absolute", inset: 0, borderRadius: "50%" }}
              initial={{ boxShadow: "0 0 0 0px rgba(167,139,250,0.45)" }}
              animate={{ boxShadow: "0 0 0 40px rgba(167,139,250,0)" }}
              transition={{ duration: 1.1, delay: 0.6, ease: "easeOut" }}
            />
          </m.div>

          {/* Giant points counter */}
          <m.div
            className="mb-3"
            initial={{ scale: 0.52, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.24 }}
          >
            <m.p
              className="font-fredoka font-black leading-none"
              style={{
                fontSize: "4.5rem",
                letterSpacing: "-0.02em",
                color: "#fbbf24",
                filter: "drop-shadow(0 0 18px rgba(251,191,36,0.55)) drop-shadow(0 2px 8px rgba(0,0,0,0.4))",
                lineHeight: 1,
              }}
            >
              +<m.span>{displayPoints}</m.span>
            </m.p>
            <m.p
              className="font-fredoka font-bold uppercase"
              style={{
                fontSize: "0.95rem",
                letterSpacing: "0.13em",
                color: "rgba(253,230,138,0.58)",
                marginTop: "4px",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.42, duration: 0.28 }}
            >
              {isPending ? "puntos ⏳" : "puntos 🔥"}
            </m.p>
          </m.div>

          {/* Task title */}
          <m.p
            style={{
              color: "rgba(196,181,253,0.52)",
              fontSize: "0.8rem",
              fontWeight: 500,
              marginBottom: "1.2rem",
              lineHeight: 1.45,
            }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.43, duration: 0.28 }}
          >
            {taskTitle}
          </m.p>

          {/* Motivational pill badge */}
          <m.div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(124,58,237,0.2)",
              border: "1px solid rgba(167,139,250,0.3)",
              borderRadius: "9999px",
              padding: "0.38rem 1.1rem",
            }}
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 22, delay: 0.52 }}
          >
            <span
              className="font-fredoka font-bold"
              style={{ fontSize: "0.95rem", color: "#c4b5fd" }}
            >
              {message}
            </span>
          </m.div>

          {/* Tap to continue hint */}
          <m.p
            style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: "0.68rem",
              marginTop: "1rem",
              letterSpacing: "0.05em",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.82, duration: 0.4 }}
          >
            Toca para continuar
          </m.p>
        </div>
      </m.div>
    </m.div>
  );
}
