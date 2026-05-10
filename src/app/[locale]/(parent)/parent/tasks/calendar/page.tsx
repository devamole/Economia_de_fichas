import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { toZonedTime } from "date-fns-tz";
import { ParentCalendarClient } from "./calendar-client";

export default async function ParentCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, families(timezone)")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const timezone = (profile.families as { timezone: string } | null)?.timezone ?? "America/Bogota";
  const todayStr = toZonedTime(new Date(), timezone).toISOString().slice(0, 10);

  const [{ data: tasks }, { data: kids }, { data: completions }] = await Promise.all([
    supabase.from("tasks").select("*").eq("family_id", profile.family_id),
    supabase.from("profiles").select("id, display_name, emoji").eq("family_id", profile.family_id).eq("role", "child"),
    supabase.from("task_completions").select("task_id, completion_date"),
  ]);

  return (
    <main className="flex flex-col flex-1 gap-4 p-4 pt-6">
      <h1 className="font-display text-2xl font-semibold">Calendario</h1>
      <ParentCalendarClient
        tasks={tasks ?? []}
        completions={completions ?? []}
        kids={kids ?? []}
        todayStr={todayStr}
      />
    </main>
  );
}
