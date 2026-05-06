"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { flushQueue, PermanentError } from "./queue";
import { syncFromRemote } from "./sync";
import { completeTask } from "@/server/actions/completions";
import { redeemReward } from "@/server/actions/rewards";

export function useOfflineSync() {
  useEffect(() => {
    async function sync() {
      const { flushed, errors } = await flushQueue({
        async completeTask({ taskId, completionDate }) {
          if (!taskId || !completionDate) throw new PermanentError("Missing payload");
          const result = await completeTask(taskId, completionDate);
          if ("error" in result) {
            const permanent =
              result.error.includes("Ya completaste") ||
              result.error.includes("No autenticado");
            if (permanent) throw new PermanentError(result.error);
            throw new Error(result.error);
          }
        },
        async redeemReward({ rewardId }) {
          if (!rewardId) throw new PermanentError("Missing payload");
          const result = await redeemReward(rewardId);
          if ("error" in result) {
            const permanent =
              result.error.includes("No tienes suficientes") ||
              result.error.includes("no está disponible") ||
              result.error.includes("No autenticado");
            if (permanent) throw new PermanentError(result.error);
            throw new Error(result.error);
          }
        },
      });

      if (flushed > 0) {
        toast.success(`${flushed} acción${flushed > 1 ? "es" : ""} sincronizada${flushed > 1 ? "s" : ""} ✅`);
      }
      if (errors > 0) {
        toast.error(`${errors} acción${errors > 1 ? "es" : ""} no pudo${errors > 1 ? "eron" : ""} sincronizarse`);
      }

      try {
        await syncFromRemote();
      } catch {
        // Sync is best-effort — don't surface errors to the user
      }
    }

    window.addEventListener("online", sync);
    if (navigator.onLine) sync();

    return () => window.removeEventListener("online", sync);
  }, []);
}
