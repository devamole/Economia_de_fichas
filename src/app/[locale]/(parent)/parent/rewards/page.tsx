import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RewardsClient } from "./rewards-client";

export default async function RewardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const { data: rewards } = await supabase
    .from("rewards")
    .select("*")
    .eq("family_id", profile.family_id)
    .order("created_at", { ascending: false });

  return (
    <main className="flex flex-col flex-1 gap-4 p-4 pt-6">
      <h1 className="font-display text-2xl font-bold">Recompensas</h1>
      <RewardsClient rewards={rewards ?? []} />
    </main>
  );
}
