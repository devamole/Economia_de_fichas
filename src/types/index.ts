import type { Database } from "./database";

type Tables = Database["public"]["Tables"];

export type Family = Tables["families"]["Row"];
export type Profile = Tables["profiles"]["Row"];
export type Task = Tables["tasks"]["Row"];
export type TaskCompletion = Tables["task_completions"]["Row"];
export type Reward = Tables["rewards"]["Row"];
export type RewardRedemption = Tables["reward_redemptions"]["Row"];
export type PushSubscription = Tables["push_subscriptions"]["Row"];
export type ReminderLog = Tables["reminder_log"]["Row"];

// Insert helpers
export type NewTask = Tables["tasks"]["Insert"];
export type NewTaskCompletion = Tables["task_completions"]["Insert"];
export type NewReward = Tables["rewards"]["Insert"];
export type NewRewardRedemption = Tables["reward_redemptions"]["Insert"];

// Derived
export type UserRole = "parent" | "child";
export type CompletionStatus = "pending" | "approved" | "rejected";
export type RedemptionStatus = "pending" | "approved" | "rejected" | "fulfilled";
export type RecurrenceType = "once" | "daily" | "weekly" | "custom";
