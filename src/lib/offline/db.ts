import Dexie, { type Table } from "dexie";
import type { Task, TaskCompletion, Reward, RewardRedemption, Profile } from "@/types";

export type MutationType = "completeTask" | "redeemReward";
export type MutationStatus = "pending" | "syncing" | "done" | "error" | "failed";

export interface PendingMutation {
  id?: number;
  type: MutationType;
  payload: Record<string, string>;
  createdAt: number;
  status: MutationStatus;
  errorMsg?: string;
  retries: number;
  nextRetryAt?: number;
}

export type LocalTask = Task;
export type LocalTaskCompletion = TaskCompletion & { pending_sync?: boolean };
export type LocalReward = Reward;
export type LocalRewardRedemption = RewardRedemption;
export type LocalProfile = Profile;
export interface MetaRecord {
  key: string;
  value: string;
}

class OfflineDB extends Dexie {
  pendingMutations!: Table<PendingMutation, number>;
  tasks!: Table<LocalTask, string>;
  task_completions!: Table<LocalTaskCompletion, string>;
  rewards!: Table<LocalReward, string>;
  reward_redemptions!: Table<LocalRewardRedemption, string>;
  profiles!: Table<LocalProfile, string>;
  meta!: Table<MetaRecord, string>;

  constructor() {
    super("fichas_offline");

    this.version(1).stores({
      pendingMutations: "++id, type, status, createdAt",
    });

    this.version(2).stores({
      pendingMutations: "++id, type, status, createdAt, nextRetryAt",
      tasks: "id, family_id, assigned_to",
      task_completions: "id, task_id, completed_by, completion_date",
      rewards: "id, family_id",
      reward_redemptions: "id, reward_id, redeemed_by",
      profiles: "id, family_id",
      meta: "key",
    });
  }
}

export const db = new OfflineDB();
