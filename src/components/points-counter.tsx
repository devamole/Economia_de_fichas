"use client";

import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";

interface Props {
  points: number;
}

export function PointsCounter({ points }: Props) {
  const [delta, setDelta] = useState<number | null>(null);
  const [deltaKey, setDeltaKey] = useState(0);
  const prevRef = useRef(points);

  useEffect(() => {
    const diff = points - prevRef.current;
    prevRef.current = points;
    if (diff > 0) {
      setDelta(diff);
      setDeltaKey((k) => k + 1);
      const t = setTimeout(() => setDelta(null), 1100);
      return () => clearTimeout(t);
    }
  }, [points]);

  return (
    <div className="relative inline-flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-3 py-1.5 shadow-sm">
      <span className="text-xl leading-none">⭐</span>
      <div className="relative">
        <m.span
          key={points}
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="font-fredoka text-3xl font-semibold text-amber-700 tabular leading-none"
        >
          {points}
        </m.span>

        <AnimatePresence>
          {delta !== null && (
            <m.span
              key={deltaKey}
              className="absolute -top-1 -right-8 font-fredoka text-base font-bold text-emerald-500 pointer-events-none select-none"
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -36, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
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
