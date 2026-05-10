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
      setTimeout(() => setSparks((s) => s.filter((x) => x.id !== spark.id)), 900),
    );
    return () => { for (const id of ids) clearTimeout(id); };
  }, [pct]);

  if (total === 0) return null;

  const isPulsing = pct >= 80 && pct < 100;
  const isDone = pct >= 100;

  return (
    <div className="px-5 pb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-muted-foreground">
          {isDone ? "¡Todo listo por hoy! 🎉" : isPulsing ? "¡Te falta poquito! 💪" : `Hoy: ${completed}/${total} tareas`}
        </span>
        <span className="text-xs font-bold text-primary">{pct}%</span>
      </div>

      <div className="relative h-2.5 rounded-full bg-muted overflow-visible">
        <m.div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 origin-left"
          animate={{
            width: `${pct}%`,
            opacity: isPulsing ? [1, 0.65, 1] : 1,
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
              className="absolute top-1/2 -translate-y-1/2 text-yellow-400 text-xs pointer-events-none select-none"
              style={{ left: `${spark.pct}%` }}
              initial={{ opacity: 1, y: -8, scale: 0.8 }}
              animate={{ opacity: 0, y: -24, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              ✨
            </m.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
