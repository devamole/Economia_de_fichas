"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rewardSchema } from "@/lib/schemas/reward";

type ActionResult = { error?: string };
type RedeemResult = { redemption_id: string; cost_points: number; status: string } | { error: string };

async function notifyParentsAboutRedemption(
  familyId: string,
  kidName: string,
  rewardName: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  try {
    const supabase = await createClient();
    const { data: parents } = await supabase
      .from("profiles")
      .select("id, notification_prefs")
      .eq("family_id", familyId)
      .eq("role", "parent");

    if (!parents) return;

    const eligible = parents.filter(
      (p) => (p.notification_prefs as { reward_redemptions?: boolean })?.reward_redemptions !== false,
    );

    await Promise.allSettled(
      eligible.map((p) =>
        fetch(`${appUrl}/api/push/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: p.id,
            title: "Recompensa solicitada 🎁",
            body: `${kidName} quiere canjear "${rewardName}"`,
            url: "/parent/approvals",
          }),
        }),
      ),
    );
  } catch {}
}

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
      notifyParentsAboutRedemption(profile.family_id, profile.display_name, reward.name);
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
