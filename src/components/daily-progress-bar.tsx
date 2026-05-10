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
  const [sparks, setSparks] = useState<{ id: number; pct: number; angle: number }[]>([]);
  const sparkIdRef = useRef(0);

  useEffect(() => {
    const prev = prevPctRef.current;
    prevPctRef.current = pct;
    const crossed = MILESTONES.filter((m) => prev < m && pct >= m);
    if (crossed.length === 0) return;

    const newSparks = crossed.flatMap((m) => [
      { id: ++sparkIdRef.current, pct: m, angle: 0 },
      { id: ++sparkIdRef.current, pct: m, angle: -28 },
      { id: ++sparkIdRef.current, pct: m, angle: 28 },
    ]);
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
        <span
          className="font-fredoka text-sm font-bold px-2.5 py-0.5 rounded-full text-amber-700"
          style={{
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            border: "1px solid rgba(245,158,11,0.35)",
            boxShadow: "0 1px 3px rgba(245,158,11,0.2)",
          }}
        >
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

        {/* Glowing ball at tip */}
        {pct > 0 && (
          <m.div
            className="absolute top-1/2 -translate-y-1/2 size-5 rounded-full pointer-events-none"
            style={{
              background: isDone
                ? "radial-gradient(circle at 35% 35%, #6ee7b7, #10b981)"
                : "radial-gradient(circle at 35% 35%, #fff9c4, #fb923c)",
              boxShadow: isDone
                ? "0 0 10px 3px rgba(16,185,129,0.6)"
                : "0 0 10px 3px rgba(251,146,60,0.65)",
              zIndex: 2,
            }}
            animate={{ left: `calc(${pct}% - 10px)` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        )}

        {/* Milestone sparks */}
        <AnimatePresence>
          {sparks.map((spark) => (
            <m.span
              key={spark.id}
              className="absolute top-1/2 -translate-y-1/2 text-xl pointer-events-none select-none"
              style={{ left: `${spark.pct}%`, originX: "0.5", originY: "1" }}
              initial={{ opacity: 1, y: -14, scale: 0.5, rotate: spark.angle }}
              animate={{ opacity: 0, y: -56, scale: 2.2, rotate: spark.angle * 1.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.95, ease: "easeOut" }}
            >
              ✨
            </m.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
