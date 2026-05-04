import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ApprovalsClient } from "./approvals-client";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const [{ data: taskCompletions }, { data: redemptions }] = await Promise.all([
    supabase
      .from("task_completions")
      .select("*, tasks(title, emoji, points), profiles!completed_by(display_name, emoji)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("reward_redemptions")
      .select("*, rewards(name, emoji, cost_points), profiles!redeemed_by(display_name, emoji)")
      .eq("status", "pending")
      .order("requested_at", { ascending: true }),
  ]);

  return (
    <main className="flex flex-col flex-1 gap-4 p-4 pt-6">
      <h1 className="font-display text-2xl font-bold">Aprobar</h1>
      <ApprovalsClient
        completions={taskCompletions ?? []}
        redemptions={redemptions ?? []}
      />
    </main>
  );
}
