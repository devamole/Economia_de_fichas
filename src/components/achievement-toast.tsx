"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { getBadge } from "@/lib/achievements";
import type { BadgeKey } from "@/types";

export function showAchievementToast(badgeKey: BadgeKey) {
  const badge = getBadge(badgeKey);
  toast.custom(
    () => (
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950 px-4 py-3 shadow-lg w-full max-w-sm"
      >
        <span className="text-3xl shrink-0">{badge.emoji}</span>
        <div className="min-w-0">
          <p className="font-bold text-amber-900 dark:text-amber-100 text-sm">Logro desbloqueado 🎖️</p>
          <p className="text-amber-800 dark:text-amber-200 text-sm font-semibold truncate">{badge.title}</p>
          <p className="text-amber-700 dark:text-amber-300 text-xs">{badge.description}</p>
        </div>
      </motion.div>
    ),
    { duration: 4500 },
  );
}
