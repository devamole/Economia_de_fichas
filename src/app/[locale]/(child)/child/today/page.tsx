import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { toZonedTime } from "date-fns-tz";
import { getTasksForDate } from "@/lib/recurrence";
import { TodayClient } from "./today-client";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile + family timezone
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, families(family_code, name, timezone)")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const family = profile.families as { timezone: string } | null;
  const timezone = family?.timezone ?? "America/Bogota";

  // Compute today's date in family timezone
  const localNow = toZonedTime(new Date(), timezone);
  const todayStr = localNow.toISOString().slice(0, 10);

  const [{ data: allTasks }, { data: completions }] = await Promise.all([
    supabase.from("tasks").select("*").eq("assigned_to", user.id).eq("active", true),
    supabase.from("task_completions").select("*").eq("completed_by", user.id).eq("completion_date", todayStr),
  ]);

  const todaysTasks = getTasksForDate(allTasks ?? [], localNow);
  const completedIds = new Set((completions ?? []).map((c) => c.task_id));

  return (
    <TodayClient
      profile={profile}
      tasks={todaysTasks}
      completedIds={completedIds}
      completions={completions ?? []}
      todayStr={todayStr}
    />
  );
}
