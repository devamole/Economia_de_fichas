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

  const [{ data: rewards }, { data: family }] = await Promise.all([
    supabase
      .from("rewards")
      .select("*")
      .eq("family_id", profile.family_id)
      .neq("type", "money_exchange")
      .order("created_at", { ascending: false }),
    supabase
      .from("families")
      .select("money_exchange_rate, money_currency, money_exchange_enabled")
      .eq("id", profile.family_id)
      .single(),
  ]);

  return (
    <main className="flex flex-col flex-1 gap-4 p-4 pt-6">
      <h1 className="font-display text-2xl font-semibold">Recompensas</h1>
      <RewardsClient
        rewards={rewards ?? []}
        moneyExchangeConfig={{
          rate: family?.money_exchange_rate ?? null,
          currency: family?.money_currency ?? null,
          enabled: family?.money_exchange_enabled ?? false,
        }}
      />
    </main>
  );
}
