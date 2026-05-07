import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/service";
import type { NotificationPrefs } from "@/server/actions/push";

function getWebPush() {
  webpush.setVapidDetails(
    "mailto:noreply@fichas.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  return webpush;
}

interface NotifyOptions {
  title: string;
  body: string;
  url?: string;
}

export async function notifyProfiles(
  profileIds: string[],
  prefKey: keyof NotificationPrefs,
  options: NotifyOptions,
) {
  if (!profileIds.length) return;

  const supabase = createServiceClient();

  // Service role bypasses RLS — we can read any profile's subscriptions.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, notification_prefs")
    .in("id", profileIds);

  const eligible = (profiles ?? []).filter(
    (p) => (p.notification_prefs as NotificationPrefs | null)?.[prefKey] !== false,
  );

  if (!eligible.length) return;

  const eligibleIds = eligible.map((p) => p.id);

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("profile_id", eligibleIds);

  if (!subs?.length) return;

  const wp = getWebPush();
  const payload = JSON.stringify({ title: options.title, body: options.body, url: options.url });
  const staleIds: string[] = [];

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await wp.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) staleIds.push(s.id);
      }
    }),
  );

  if (staleIds.length) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }
}

export async function notifyFamilyParents(
  familyId: string,
  prefKey: keyof NotificationPrefs,
  options: NotifyOptions,
) {
  const supabase = createServiceClient();

  const { data: parents } = await supabase
    .from("profiles")
    .select("id")
    .eq("family_id", familyId)
    .eq("role", "parent");

  if (!parents?.length) return;
  await notifyProfiles(parents.map((p) => p.id), prefKey, options);
}
