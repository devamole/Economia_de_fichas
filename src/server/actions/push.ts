"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type NotificationPrefs = {
  task_completions: boolean;
  reward_redemptions: boolean;
};

export async function savePushSubscription(sub: PushSubscriptionJSON) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        profile_id: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
      { onConflict: "endpoint" },
    );

  if (error) return { error: error.message };
  return {};
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("profile_id", user.id)
    .eq("endpoint", endpoint);

  return {};
}

export async function updateNotificationPrefs(prefs: Partial<NotificationPrefs>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_prefs")
    .eq("id", user.id)
    .single();

  const current: NotificationPrefs = (profile?.notification_prefs as NotificationPrefs) ?? {
    task_completions: true,
    reward_redemptions: true,
  };

  const { error } = await supabase
    .from("profiles")
    .update({ notification_prefs: { ...current, ...prefs } })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/parent/dashboard");
  return {};
}
