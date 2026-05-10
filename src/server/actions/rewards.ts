"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rewardSchema } from "@/lib/schemas/reward";
import { moneyExchangeSchema } from "@/lib/schemas/money-exchange";
import { notifyFamilyParents } from "@/lib/push-notify";

type ActionResult = { error?: string };
type RedeemResult = { redemption_id: string; cost_points: number; status: string } | { error: string };
type MoneyRedeemResult =
  | { redemption_id: string; cost_points: number; money_value: number; currency: string; status: string }
  | { error: string };

function parseRewardForm(formData: FormData) {
  return rewardSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    costPoints: formData.get("costPoints"),
    emoji: formData.get("emoji") || undefined,
  });
}

export async function createReward(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseRewardForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Perfil no encontrado." };

  const { name, description, costPoints, emoji } = parsed.data;
  const { error } = await supabase.from("rewards").insert({
    name,
    description: description ?? null,
    cost_points: costPoints,
    emoji: emoji ?? null,
    family_id: profile.family_id,
  });

  if (error) return { error: error.message };
  revalidatePath("/parent/rewards");
  return {};
}

export async function updateReward(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  if (!id) return { error: "ID requerido." };

  const parsed = parseRewardForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { name, description, costPoints, emoji } = parsed.data;
  const { error } = await supabase
    .from("rewards")
    .update({
      name,
      description: description ?? null,
      cost_points: costPoints,
      emoji: emoji ?? null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/parent/rewards");
  return {};
}

export async function toggleRewardActive(id: string, active: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("rewards").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/parent/rewards");
  return {};
}

export async function deleteReward(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("rewards").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/parent/rewards");
  return {};
}

export async function redeemReward(rewardId: string): Promise<RedeemResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data, error } = await supabase.rpc("redeem_reward", {
    p_reward_id: rewardId,
    p_redeemed_by: user.id,
  });

  if (error) {
    if (error.message.includes("Not enough points")) return { error: "No tienes suficientes puntos." };
    if (error.message.includes("not active")) return { error: "Esta recompensa ya no está disponible." };
    return { error: error.message };
  }

  const result = data as RedeemResult;

  if (!("error" in result)) {
    const [{ data: profile }, { data: reward }] = await Promise.all([
      supabase.from("profiles").select("family_id, display_name").eq("id", user.id).single(),
      supabase.from("rewards").select("name").eq("id", rewardId).single(),
    ]);
    if (profile && reward) {
      await notifyFamilyParents(profile.family_id, "reward_redemptions", {
        title: "Recompensa solicitada 🎁",
        body: `${profile.display_name} quiere canjear "${reward.name}"`,
        url: "/parent/approvals",
      });
    }
  }

  revalidatePath("/child/rewards");
  revalidatePath("/child/today");
  return result;
}

export async function approveRedemption(redemptionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.rpc("approve_redemption", {
    p_redemption_id: redemptionId,
    p_reviewer_id: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/parent/approvals");
  return {};
}

export async function rejectRedemption(redemptionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.rpc("reject_redemption", {
    p_redemption_id: redemptionId,
    p_reviewer_id: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/parent/approvals");
  return {};
}

export async function configureMoneyExchange(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = moneyExchangeSchema.safeParse({
    rate: formData.get("rate"),
    currency: formData.get("currency"),
    enabled: formData.get("enabled") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Perfil no encontrado." };

  const { rate, currency, enabled } = parsed.data;

  const { error: familyError } = await supabase
    .from("families")
    .update({
      money_exchange_rate: rate,
      money_currency: currency,
      money_exchange_enabled: enabled,
    })
    .eq("id", profile.family_id);

  if (familyError) return { error: familyError.message };

  // Manage the sentinel reward row
  if (enabled) {
    const { data: existing } = await supabase
      .from("rewards")
      .select("id")
      .eq("family_id", profile.family_id)
      .eq("type", "money_exchange")
      .single();

    if (existing) {
      await supabase.from("rewards").update({ active: true }).eq("id", existing.id);
    } else {
      await supabase.from("rewards").insert({
        family_id: profile.family_id,
        name: "Canje por Dinero",
        emoji: "💰",
        cost_points: 1,
        type: "money_exchange",
        active: true,
      });
    }
  } else {
    await supabase
      .from("rewards")
      .update({ active: false })
      .eq("family_id", profile.family_id)
      .eq("type", "money_exchange");
  }

  revalidatePath("/parent/dashboard");
  revalidatePath("/child/rewards");
  return {};
}

export async function redeemMoneyExchange(pointsToRedeem: number): Promise<MoneyRedeemResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data, error } = await supabase.rpc("redeem_money_exchange", {
    p_redeemed_by: user.id,
    p_points_to_redeem: pointsToRedeem,
  });

  if (error) {
    if (error.message.includes("Not enough points")) return { error: "No tienes suficientes puntos." };
    if (error.message.includes("not enabled")) return { error: "El canje por dinero no está disponible." };
    if (error.message.includes("not configured")) return { error: "El canje por dinero no está configurado." };
    return { error: error.message };
  }

  const result = data as MoneyRedeemResult;

  if (!("error" in result)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id, display_name")
      .eq("id", user.id)
      .single();
    if (profile) {
      await notifyFamilyParents(profile.family_id, "reward_redemptions", {
        title: "Canje por dinero solicitado 💰",
        body: `${profile.display_name} quiere canjear puntos por dinero`,
        url: "/parent/approvals",
      });
    }
  }

  revalidatePath("/child/rewards");
  revalidatePath("/child/today");
  return result;
}
