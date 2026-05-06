"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function activateStreakShield(
  date: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data, error } = await supabase.rpc("activate_streak_shield", {
    p_profile_id: user.id,
    p_date: date,
  });

  if (error) return { error: error.message };

  const result = data as { ok: boolean; error?: string };
  if (!result.ok) return { error: result.error ?? "No disponible" };

  revalidatePath("/child/today");
  return { ok: true };
}
