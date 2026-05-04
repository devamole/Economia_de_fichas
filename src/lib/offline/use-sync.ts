"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { flushQueue } from "./queue";
import { completeTask } from "@/server/actions/completions";
import { redeemReward } from "@/server/actions/rewards";

export function useOfflineSync() {
  useEffect(() => {
    async function sync() {
      const { flushed, errors } = await flushQueue({
        async completeTask({ taskId, completionDate }) {
          if (!taskId || !completionDate) throw new Error("Missing payload");
          const result = await completeTask(taskId, completionDate);
          if ("error" in result) throw new Error(result.error);
        },
        async redeemReward({ rewardId }) {
          if (!rewardId) throw new Error("Missing payload");
          const result = await redeemReward(rewardId);
          if ("error" in result) throw new Error(result.error);
        },
      });

      if (flushed > 0) {
        toast.success(`${flushed} acción${flushed > 1 ? "es" : ""} sincronizada${flushed > 1 ? "s" : ""} ✅`);
      }
      if (errors > 0) {
        toast.error(`${errors} acción${errors > 1 ? "es" : ""} no pudieron sincronizarse`);
      }
    }

    window.addEventListener("online", sync);

    // Flush on mount in case we're already online with pending mutations
    if (navigator.onLine) sync();

    return () => window.removeEventListener("online", sync);
  }, []);
}
