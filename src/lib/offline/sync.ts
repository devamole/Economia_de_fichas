"use client";

import { createClient } from "@/lib/supabase/client";
import { db } from "./db";
import type { Task, TaskCompletion, Reward, RewardRedemption, Profile } from "@/types";

export async function syncFromRemote(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (!profileRow) return;

  const familyId = profileRow.family_id;
  const minus30 = new Date();
  minus30.setDate(minus30.getDate() - 30);
  const dateFloor = minus30.toISOString().slice(0, 10);

  const [tasksRes, completionsRes, rewardsRes, redemptionsRes, profilesRes] = await Promise.all([
    supabase.from("tasks").select("*").eq("assigned_to", user.id).eq("active", true),
    supabase
      .from("task_completions")
      .select("*")
      .eq("completed_by", user.id)
      .gte("completion_date", dateFloor),
    supabase.from("rewards").select("*").eq("family_id", familyId).eq("active", true),
    supabase
      .from("reward_redemptions")
      .select("*")
      .eq("redeemed_by", user.id)
      .gte("requested_at", minus30.toISOString()),
    supabase.from("profiles").select("*").eq("family_id", familyId),
  ]);

  await db.transaction(
    "rw",
    [db.tasks, db.task_completions, db.rewards, db.reward_redemptions, db.profiles, db.meta],
    async () => {
      // Tasks — LWW by updated_at; remove deactivated tasks
      if (tasksRes.data) {
        const remoteIds = new Set(tasksRes.data.map((t) => t.id));
        const localTasks = await db.tasks.where("assigned_to").equals(user.id).toArray();
        const toDelete = localTasks.filter((t) => !remoteIds.has(t.id)).map((t) => t.id);
        if (toDelete.length > 0) await db.tasks.bulkDelete(toDelete);

        for (const remote of tasksRes.data as Task[]) {
          const local = await db.tasks.get(remote.id);
          if (!local || new Date(remote.updated_at) >= new Date(local.updated_at)) {
            await db.tasks.put(remote);
          } else {
            console.log("[sync] conflict: kept local task", remote.id, "(local updated_at newer)");
          }
        }
      }

      // Task completions — never overwrite pending_sync rows; clean up confirmed offline rows
      if (completionsRes.data) {
        const remoteCompletions = completionsRes.data as TaskCompletion[];

        // Build map of task_id:completion_date → remote completion
        const remoteByTaskDate = new Map(
          remoteCompletions.map((c) => [`${c.task_id}:${c.completion_date}`, c]),
        );

        // Find local pending_sync rows that the server confirmed → delete offline placeholders
        const allLocal = await db.task_completions.toArray();
        const pendingSyncLocal = allLocal.filter((c) => c.pending_sync);
        for (const local of pendingSyncLocal) {
          const key = `${local.task_id}:${local.completion_date}`;
          if (remoteByTaskDate.has(key)) {
            await db.task_completions.delete(local.id);
          }
        }

        // Put remote completions, skipping any still-pending local rows
        const stillPendingKeys = new Set(
          (await db.task_completions.toArray())
            .filter((c) => c.pending_sync)
            .map((c) => `${c.task_id}:${c.completion_date}`),
        );

        for (const remote of remoteCompletions) {
          const key = `${remote.task_id}:${remote.completion_date}`;
          if (stillPendingKeys.has(key)) {
            console.log("[sync] conflict: kept pending_sync completion for", key);
            continue;
          }
          await db.task_completions.put(remote);
        }
      }

      // Rewards — parent-managed, always overwrite; remove deactivated
      if (rewardsRes.data) {
        const remoteIds = new Set(rewardsRes.data.map((r) => r.id));
        const localRewards = await db.rewards.where("family_id").equals(familyId).toArray();
        const toDelete = localRewards.filter((r) => !remoteIds.has(r.id)).map((r) => r.id);
        if (toDelete.length > 0) await db.rewards.bulkDelete(toDelete);
        await db.rewards.bulkPut(rewardsRes.data as Reward[]);
      }

      // Reward redemptions — always overwrite (server is authoritative for status)
      if (redemptionsRes.data) {
        await db.reward_redemptions.bulkPut(redemptionsRes.data as RewardRedemption[]);
      }

      // Profiles — always overwrite (server is authoritative for points/streak)
      if (profilesRes.data) {
        await db.profiles.bulkPut(profilesRes.data as Profile[]);
      }

      await db.meta.put({ key: "last_sync_at", value: new Date().toISOString() });
    },
  );
}
