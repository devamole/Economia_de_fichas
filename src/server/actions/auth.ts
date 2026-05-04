"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { signUpSchema, loginSchema } from "@/lib/schemas/auth";

// ── Sign-up (parent) ─────────────────────────────────────────────────────────

export async function signUpParent(_prev: unknown, formData: FormData) {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
    familyName: formData.get("familyName"),
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { email, password, displayName, familyName } = parsed.data;
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, family_name: familyName },
    },
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Error al crear la cuenta." };
  }

  // Create family + parent profile atomically via DB function.
  const { error: fnError } = await supabase.rpc("create_family_with_parent", {
    p_user_id: authData.user.id,
    p_family_name: familyName,
    p_display_name: displayName,
    p_locale: "es",
  });

  if (fnError) {
    return { error: "Error al configurar la familia. " + fnError.message };
  }

  redirect("/es/parent/dashboard");
}

// ── Sign-in (parent) ─────────────────────────────────────────────────────────

export async function signInParent(_prev: unknown, formData: FormData) {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect("/es/parent/dashboard");
}

// ── Sign-out ──────────────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/es/login");
}
