import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { toZonedTime } from "date-fns-tz";
import { TaskCalendar } from "@/components/task-calendar";

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

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("assigned_to", user.id)
    .eq("active", true);

  const { data: completions } = await supabase
    .from("task_completions")
    .select("task_id, completion_date")
    .eq("completed_by", user.id);

  return (
    <main className="flex flex-col flex-1 gap-4 p-4 pt-6">
      <h1 className="font-display text-2xl font-bold">Calendario</h1>
      <TaskCalendar
        tasks={tasks ?? []}
        completions={completions ?? []}
        isParent={false}
      />
    </main>
  );
}
