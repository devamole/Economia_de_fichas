import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { toZonedTime } from "date-fns-tz";
import { TasksClient } from "./tasks-client";

export default async function TasksPage() {
  const [t, supabase] = await Promise.all([getTranslations("tasks"), createClient()]);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, families(timezone)")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const timezone = (profile.families as { timezone: string } | null)?.timezone ?? "America/Bogota";
  const todayStr = toZonedTime(new Date(), timezone).toISOString().slice(0, 10);

  const [{ data: tasks }, { data: kids }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("family_id", profile.family_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, display_name, emoji")
      .eq("family_id", profile.family_id)
      .eq("role", "child"),
  ]);

  return (
    <TasksClient
      initialTasks={tasks ?? []}
      kids={kids ?? []}
      title={t("title")}
      emptyActive={t("emptyActive")}
      emptyInactive={t("emptyInactive")}
      todayStr={todayStr}
    />
  );
}
