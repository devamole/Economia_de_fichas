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

  const [
    { data: rewards },
    { data: redemptions },
    { data: family },
    { data: pendingCompletions },
  ] = await Promise.all([
    supabase
      .from("rewards")
      .select("*")
      .eq("family_id", profile.family_id)
      .eq("active", true)
      .neq("type", "money_exchange")
      .order("cost_points", { ascending: true }),
    supabase
      .from("reward_redemptions")
      .select("*, rewards(name, emoji, type)")
      .eq("redeemed_by", user.id)
      .order("requested_at", { ascending: false })
      .limit(10),
    supabase
      .from("families")
      .select("money_exchange_rate, money_currency, money_exchange_enabled")
      .eq("id", profile.family_id)
      .single(),
    supabase
      .from("task_completions")
      .select("points_awarded")
      .eq("completed_by", user.id)
      .eq("status", "pending"),
  ]);

  const pendingPoints = (pendingCompletions ?? []).reduce(
    (sum, r) => sum + (r.points_awarded ?? 0), 0
  );

  const moneyExchangeConfig =
    family?.money_exchange_enabled && family.money_exchange_rate && family.money_currency
      ? {
          rate: family.money_exchange_rate,
          currency: family.money_currency,
          enabled: true as const,
        }
      : null;

  const availablePoints = Math.max(0, profile.points_balance - pendingPoints);

  return (
    <main className="flex flex-col flex-1 gap-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Recompensas</h1>
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1 bg-primary/10 rounded-full px-3 py-1">
            <span className="text-sm font-bold text-primary">{availablePoints} pts</span>
          </div>
          {pendingPoints > 0 && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium pr-1">
              +{pendingPoints} en camino ⏳
            </span>
          )}
        </div>
      </div>

      <ChildRewardsClient
        rewards={rewards ?? []}
        redemptions={redemptions ?? []}
        pointsBalance={profile.points_balance}
        pendingPoints={pendingPoints}
        moneyExchangeConfig={moneyExchangeConfig}
      />
    </main>
  );
}
