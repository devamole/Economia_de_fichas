"use client";

import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { animate } from "animejs";

interface Props {
  points: number;
}

export function PointsCounter({ points }: Props) {
  const [displayPoints, setDisplayPoints] = useState(points);
  const [delta, setDelta] = useState<number | null>(null);
  const [deltaKey, setDeltaKey] = useState(0);
  const prevRef = useRef(points);

  useEffect(() => {
    const diff = points - prevRef.current;
    const from = prevRef.current;
    prevRef.current = points;

    if (diff > 0) {
      setDelta(diff);
      setDeltaKey((k) => k + 1);
      const t = setTimeout(() => setDelta(null), 1200);

      const obj = { value: from };
      animate(obj, {
        value: points,
        duration: 700,
        ease: "outExpo",
        onUpdate() {
          setDisplayPoints(Math.round(obj.value));
        },
      });

      return () => clearTimeout(t);
    } else {
      setDisplayPoints(points);
    }
  }, [points]);

  return (
    <div
      className="relative inline-flex items-center gap-2 rounded-2xl px-3 py-1.5"
      style={{
        background: "linear-gradient(135deg, #fef9e7, #fef3c7)",
        border: "1px solid rgba(245,158,11,0.25)",
        boxShadow:
          "0 4px 16px -4px rgba(245,158,11,0.3), inset 0 1px 1px rgba(255,255,255,0.9)",
      }}
    >
      <span
        className="text-2xl leading-none"
        style={{ filter: "drop-shadow(0 0 6px rgba(251,191,36,0.75))" }}
      >
        ⭐
      </span>
      <div className="relative">
        <m.span
          initial={{ scale: 0.85, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="font-fredoka text-3xl font-semibold text-amber-700 tabular leading-none"
        >
          {displayPoints}
        </m.span>

        <AnimatePresence>
          {delta !== null && (
            <m.span
              key={deltaKey}
              className="absolute -top-1 -right-6 font-fredoka text-lg font-bold text-emerald-500 pointer-events-none select-none"
              initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              animate={{ opacity: 0, y: -44, x: 14, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.1,
                ease: "easeOut",
                x: { ease: [0.2, 0.8, 0.9, 1.0] },
                opacity: { delay: 0.5, duration: 0.6 },
              }}
            >
              +{delta}
            </m.span>
          )}
        </AnimatePresence>
      </div>
      <span className="font-fredoka text-sm font-medium text-amber-600/70 leading-none">pts</span>
    </div>
  );
}
