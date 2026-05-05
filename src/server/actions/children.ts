"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createChildSchema } from "@/lib/schemas/auth";

type FamilyProfile = { id: string; display_name: string; emoji: string | null; role: string };
type FamilyLookup = { id: string; name: string; profiles: FamilyProfile[] | null };

// ── Get profiles by family code (public lookup, no auth needed) ───────────────

export async function getProfilesByFamilyCode(familyCode: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("lookup_family_by_code", { p_code: familyCode });

  if (error || !data) return { error: "Código de familia no encontrado." };

  return { family: data as FamilyLookup };
}

// ── Sign-in a kid with PIN ────────────────────────────────────────────────────

export async function signInChild(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const familyCode = (formData.get("familyCode") as string) ?? "";
  const profileId = (formData.get("profileId") as string) ?? "";
  const pin = (formData.get("pin") as string) ?? "";

  const supabase = await createClient();

  const syntheticEmail = `child-${profileId}@app.local`;
  const { error } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: pin,
  });

  if (error) {
    return { error: "PIN incorrecto. Inténtalo de nuevo." };
  }

  return {};
}

// ── Create a child profile via Edge Function ──────────────────────────────────

export async function createChild(_prev: unknown, formData: FormData) {
  const raw = {
    displayName: formData.get("displayName"),
    emoji: formData.get("emoji"),
    pin: formData.get("pin"),
  };

  const parsed = createChildSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { displayName, emoji, pin } = parsed.data;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Perfil no encontrado." };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Sesión expirada." };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const res = await fetch(`${supabaseUrl}/functions/v1/create-child`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      displayName,
      emoji: emoji ?? "🧒",
      pin,
      familyId: profile.family_id,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: (body as { error?: string }).error ?? "Error al crear el niño." };
  }

  revalidatePath("/parent/children");
  return {};
}
