import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

export default async function ChildProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, emoji, points_balance, families(name, family_code)")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const family = Array.isArray(profile.families) ? profile.families[0] : profile.families;

  return (
    <main className="flex flex-col flex-1 gap-6 p-4 pt-6 items-center text-center">
      <div className="flex flex-col items-center gap-3 pt-8">
        <span className="text-8xl">{profile.emoji ?? "🧒"}</span>
        <h1 className="font-display text-2xl font-bold">{profile.display_name}</h1>
        <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
          <span className="text-2xl font-bold text-primary">{profile.points_balance}</span>
          <span className="text-sm text-muted-foreground">puntos</span>
        </div>
      </div>

      {family && (
        <div className="w-full rounded-2xl border border-border bg-card p-4 text-left">
          <p className="text-xs text-muted-foreground">Familia</p>
          <p className="font-semibold">{family.name}</p>
          <p className="text-xs text-muted-foreground mt-2">Código</p>
          <p className="font-display text-xl font-bold tracking-widest text-primary">{family.family_code}</p>
        </div>
      )}

      <form action={signOut} className="w-full mt-auto">
        <Button type="submit" variant="outline" className="w-full rounded-xl h-12">
          Cerrar sesión
        </Button>
      </form>
    </main>
  );
}
