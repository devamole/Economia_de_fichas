import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { toZonedTime } from "date-fns-tz";
import { CalendarClient, type ProfileForCalendar } from "./calendar-client";

export default async function ChildCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, families(timezone)")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const timezone = (profile.families as { timezone: string } | null)?.timezone ?? "America/Bogota";
  const todayStr = toZonedTime(new Date(), timezone).toISOString().slice(0, 10);

  const [{ data: tasks }, { data: completions }] = await Promise.all([
    supabase.from("tasks").select("*").eq("assigned_to", user.id).eq("active", true),
    supabase
      .from("task_completions")
      .select("task_id, completion_date, points_awarded")
      .eq("completed_by", user.id),
  ]);

  return (
    <CalendarClient
      profile={profile as unknown as ProfileForCalendar}
      tasks={tasks ?? []}
      completions={completions ?? []}
      todayStr={todayStr}
    />
  );
}
