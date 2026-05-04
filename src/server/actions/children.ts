"use server";

import { createClient } from "@/lib/supabase/server";
import { createChildSchema } from "@/lib/schemas/auth";

// ── Get profiles by family code (public lookup, no auth needed) ───────────────

export async function getProfilesByFamilyCode(familyCode: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("families")
    .select("id, name, profiles(id, display_name, emoji, role)")
    .eq("family_code", familyCode.toUpperCase())
    .single();

  if (error || !data) return { error: "Código de familia no encontrado." };

  return { family: data };
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

  // Resolve the synthetic email from the profile id.
  const syntheticEmail = `child-${profileId}@app.local`;

  const { error } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: pin,
  });

  if (error) {
    return { error: "PIN incorrecto. Inténtalo de nuevo." };
  }

  // Redirect handled client-side after successful action.
  return {};
}

// ── Create a child profile (called by parent, server-side) ───────────────────

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

  // Get the parent's family id.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profileData } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  const profile = profileData as { family_id: string } | null;
  if (!profile) return { error: "Perfil no encontrado." };

  // Create auth user with synthetic email + PIN as password.
  // This requires service-role in production — for now uses the anon key
  // which means this needs a Supabase Edge Function in Task 1.5 final form.
  // Placeholder: return the data structure for now.
  return {
    pending: true,
    message:
      "Creación de niños requiere la clave de servicio (se completa en Task 1.5).",
    data: { displayName, emoji, familyId: profile.family_id },
  };
}
