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
    if (points !== prevRef.current) {
      const diff = points - prevRef.current;
      if (diff > 0) {
        setDelta(diff);
        setDeltaKey((k) => k + 1);
        const t = setTimeout(() => setDelta(null), 1000);
        return () => clearTimeout(t);
      }
      prevRef.current = points;
    }
  }, [points]);

  useEffect(() => {
    prevRef.current = points;
  }, [points]);

  return (
    <div className="relative inline-flex items-baseline gap-2">
      <m.span
        key={points}
        initial={{ scale: 0.85, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="font-display text-5xl font-bold tabular"
      >
        {points}
      </m.span>
      <span className="text-xl text-muted-foreground font-normal">pts</span>

      <AnimatePresence>
        {delta !== null && (
          <m.span
            key={deltaKey}
            className="absolute -top-2 left-0 text-lg font-bold text-emerald-500 pointer-events-none select-none"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            +{delta}
          </m.span>
        )}
      </AnimatePresence>
    </div>
  );
}
