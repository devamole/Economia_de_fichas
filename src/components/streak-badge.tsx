"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { activateStreakShield } from "@/server/actions/streak";

interface Props {
  streak: number;
  shieldAvailable: boolean;
  todayStr: string;
}

export function StreakBadge({ streak, shieldAvailable, todayStr }: Props) {
  async function handleShield() {
    const result = await activateStreakShield(todayStr);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("¡Escudo activado! Tu racha está a salvo hoy 🛡️");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={streak}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
            streak > 0
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {streak > 0 ? (
            <>🔥 {streak} {streak === 1 ? "día" : "días"}</>
          ) : (
            "Sin racha"
          )}
        </motion.div>
      </AnimatePresence>

      {shieldAvailable && streak > 0 && (
        <button
          onClick={handleShield}
          title="Usar escudo de racha (1 día libre)"
          className="flex items-center justify-center size-7 rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-800/50 transition-colors"
        >
          <Shield className="size-4" />
        </button>
      )}
    </div>
  );
}
