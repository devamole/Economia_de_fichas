import Dexie, { type Table } from "dexie";

export type MutationType = "completeTask" | "redeemReward";
export type MutationStatus = "pending" | "syncing" | "done" | "error";

export interface PendingMutation {
  id?: number;
  type: MutationType;
  payload: Record<string, string>;
  createdAt: number;
  status: MutationStatus;
  errorMsg?: string;
  retries: number;
}

class OfflineDB extends Dexie {
  pendingMutations!: Table<PendingMutation, number>;

  constructor() {
    super("fichas_offline");
    this.version(1).stores({
      pendingMutations: "++id, type, status, createdAt",
    });
  }
}

export const db = new OfflineDB();
