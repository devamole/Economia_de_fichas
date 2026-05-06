"use client";

import { motion } from "framer-motion";
import { getUserLevel, getNextLevelThreshold, LEVEL_THRESHOLDS } from "@/types";

interface Props {
  totalPoints: number;
}

export function LevelProgressBar({ totalPoints }: Props) {
  const level = getUserLevel(totalPoints);
  const isMax = level >= LEVEL_THRESHOLDS.length;
  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = getNextLevelThreshold(totalPoints);

  const pct = isMax
    ? 100
    : nextThreshold
    ? Math.round(((totalPoints - (currentThreshold ?? 0)) / (nextThreshold - (currentThreshold ?? 0))) * 100)
    : 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-foreground">Nivel {level}</span>
        {isMax ? (
          <span className="font-bold text-amber-500">MAX ✨</span>
        ) : (
          <span className="text-muted-foreground">
            Siguiente: {nextThreshold ? nextThreshold - totalPoints : 0} pts
          </span>
        )}
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isMax
              ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-[length:200%_100%]"
              : "bg-gradient-to-r from-violet-500 to-fuchsia-500"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
      </div>
    </div>
  );
}
