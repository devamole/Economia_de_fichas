import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TaskCalendar } from "@/components/task-calendar";

export default async function ParentCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("family_id", profile.family_id);

  const { data: kids } = await supabase
    .from("profiles")
    .select("id, display_name, emoji")
    .eq("family_id", profile.family_id)
    .eq("role", "child");

  const { data: completions } = await supabase
    .from("task_completions")
    .select("task_id, completion_date");

  return (
    <main className="flex flex-col flex-1 gap-4 p-4 pt-6">
      <h1 className="font-display text-2xl font-bold">Calendario</h1>
      <TaskCalendar
        tasks={tasks ?? []}
        completions={completions ?? []}
        kids={kids ?? []}
        isParent
      />
    </main>
  );
}
