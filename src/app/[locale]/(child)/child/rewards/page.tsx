import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChildRewardsClient } from "./child-rewards-client";

export default async function ChildRewardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, points_balance, display_name, emoji")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const { data: rewards } = await supabase
    .from("rewards")
    .select("*")
    .eq("family_id", profile.family_id)
    .eq("active", true)
    .order("cost_points", { ascending: true });

  const { data: redemptions } = await supabase
    .from("reward_redemptions")
    .select("*, rewards(name, emoji)")
    .eq("redeemed_by", user.id)
    .order("requested_at", { ascending: false })
    .limit(10);

  return (
    <main className="flex flex-col flex-1 gap-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Recompensas</h1>
        <div className="flex items-center gap-1 bg-primary/10 rounded-full px-3 py-1">
          <span className="text-sm font-bold text-primary">{profile.points_balance} pts</span>
        </div>
      </div>

      <ChildRewardsClient
        rewards={rewards ?? []}
        redemptions={redemptions ?? []}
        pointsBalance={profile.points_balance}
      />
    </main>
  );
}
