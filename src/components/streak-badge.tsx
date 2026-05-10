"use client";

import { m, AnimatePresence } from "framer-motion";
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
        <m.div
          key={streak}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 font-fredoka text-sm font-semibold ${
            streak > 0
              ? "bg-amber-400 text-white shadow-sm shadow-amber-300/50"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {streak > 0 ? (
            <>
              <span className="animate-flame inline-block leading-none">🔥</span>
              {streak} {streak === 1 ? "día" : "días"}
            </>
          ) : (
            "Sin racha"
          )}
        </m.div>
      </AnimatePresence>

      {shieldAvailable && streak > 0 && (
        <button
          onClick={handleShield}
          title="Usar escudo de racha (1 día libre)"
          className="flex items-center justify-center size-8 rounded-xl bg-sky-100 text-sky-500 hover:bg-sky-200 transition-colors shadow-sm"
        >
          <Shield className="size-4" />
        </button>
      )}
    </div>
  );
}
