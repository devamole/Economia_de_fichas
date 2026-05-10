"use client";

import { useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";

interface Props {
  completed: number;
  total: number;
}

const MILESTONES = [25, 50, 75];

export function DailyProgressBar({ completed, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const prevPctRef = useRef(pct);
  const [sparks, setSparks] = useState<{ id: number; pct: number }[]>([]);
  const sparkIdRef = useRef(0);

  useEffect(() => {
    const prev = prevPctRef.current;
    prevPctRef.current = pct;
    const crossed = MILESTONES.filter((m) => prev < m && pct >= m);
    if (crossed.length === 0) return;

    const newSparks = crossed.map((m) => ({ id: ++sparkIdRef.current, pct: m }));
    setSparks((s) => [...s, ...newSparks]);
    const ids = newSparks.map((spark) =>
      setTimeout(() => setSparks((s) => s.filter((x) => x.id !== spark.id)), 1000),
    );
    return () => { for (const id of ids) clearTimeout(id); };
  }, [pct]);

  if (total === 0) return null;

  const isPulsing = pct >= 80 && pct < 100;
  const isDone = pct >= 100;

  return (
    <div className="px-5 pb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="font-fredoka text-base font-semibold text-amber-700/80">
          {isDone
            ? "🎉 ¡Todo completado!"
            : isPulsing
            ? "💪 ¡Casi lo logras!"
            : `${completed} de ${total} misiones`}
        </span>
        <span className="font-fredoka text-sm font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
          {pct}%
        </span>
      </div>

      <div className="relative h-5 rounded-full bg-amber-100/80 overflow-visible shadow-inner">
        <m.div
          className="h-full rounded-full origin-left"
          style={{
            background: isDone
              ? "linear-gradient(90deg, #34d399 0%, #10b981 100%)"
              : "linear-gradient(90deg, #fdd835 0%, #fb923c 45%, #a855f7 100%)",
          }}
          animate={{
            width: `${pct}%`,
            opacity: isPulsing ? [1, 0.72, 1] : 1,
          }}
          transition={{
            width: { type: "spring", stiffness: 120, damping: 20 },
            opacity: isPulsing
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0 },
          }}
        />

        {/* Milestone sparks */}
        <AnimatePresence>
          {sparks.map((spark) => (
            <m.span
              key={spark.id}
              className="absolute top-1/2 -translate-y-1/2 text-xl pointer-events-none select-none"
              style={{ left: `${spark.pct}%` }}
              initial={{ opacity: 1, y: -14, scale: 0.5 }}
              animate={{ opacity: 0, y: -44, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              ✨
            </m.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
