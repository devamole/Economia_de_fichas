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

// ── Engagement features ───────────────────────────────────────────────────────

export type BoostType = "none" | "minor" | "epic";

export type BadgeKey =
  | "first_task"
  | "streak_3"
  | "streak_7"
  | "streak_30"
  | "first_epic"
  | "king_of_boost";

export interface Achievement {
  badge_key: BadgeKey;
  unlocked_at: string;
}

export interface CompletionResultSuccess {
  completion_id: string;
  points_awarded: number;
  base_points: number;
  boost_type: BoostType;
  boost_points: number;
  status: string;
  new_streak: number;
  shield_activated: boolean;
  new_achievements: BadgeKey[];
}

export type CompletionResult = CompletionResultSuccess | { error: string };

// Level system: index = level - 1, value = minimum total_points_earned
export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500, 4000] as const;

export function getUserLevel(totalPoints: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalPoints >= (LEVEL_THRESHOLDS[i] as number)) level = i + 1;
    else break;
  }
  return level;
}

export function getNextLevelThreshold(totalPoints: number): number | null {
  const level = getUserLevel(totalPoints);
  return level < LEVEL_THRESHOLDS.length ? (LEVEL_THRESHOLDS[level] as number) : null;
}
