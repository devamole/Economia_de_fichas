import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChildrenClient } from "./children-client";

export default async function ChildrenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const { data: family } = await supabase
    .from("families")
    .select("name, family_code")
    .eq("id", profile.family_id)
    .single();

  const { data: children } = await supabase
    .from("profiles")
    .select("id, display_name, emoji, points_balance")
    .eq("family_id", profile.family_id)
    .eq("role", "child")
    .order("display_name");

  return (
    <main className="flex flex-col flex-1 gap-4 p-4 pt-6">
      <h1 className="font-display text-2xl font-bold">Hijos</h1>
      {family && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Código de familia</p>
          <p className="font-display text-3xl font-bold tracking-widest text-primary mt-1">
            {family.family_code}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Comparte este código con tus hijos para que accedan a la app.
          </p>
        </div>
      )}
      <ChildrenClient children={children ?? []} />
    </main>
  );
}
