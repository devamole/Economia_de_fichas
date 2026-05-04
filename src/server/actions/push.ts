"use server";

import { createClient } from "@/lib/supabase/server";

type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
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
      { onConflict: "profile_id,endpoint" },
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
