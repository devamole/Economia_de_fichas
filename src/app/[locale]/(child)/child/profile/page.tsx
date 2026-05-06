import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { LevelProgressBar } from "@/components/level-progress-bar";
import { BADGE_DEFINITIONS } from "@/lib/achievements";
import type { BadgeKey } from "@/types";

export default async function ChildProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, emoji, points_balance, total_points_earned, families(name, family_code)")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const { data: rawAchievements } = await supabase
    .from("user_achievements")
    .select("badge_key")
    .eq("profile_id", user.id);

  const unlockedKeys = new Set((rawAchievements ?? []).map((a) => a.badge_key));
  const totalPoints = (profile as { total_points_earned?: number }).total_points_earned ?? 0;

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

      {/* Level progress bar */}
      <div className="w-full rounded-2xl border border-border bg-card p-4 text-left">
        <p className="text-xs text-muted-foreground mb-3">Progreso de nivel</p>
        <LevelProgressBar totalPoints={totalPoints} />
        <p className="text-xs text-muted-foreground mt-2">{totalPoints} pts totales ganados</p>
      </div>

      {/* Achievements grid */}
      <div className="w-full rounded-2xl border border-border bg-card p-4 text-left">
        <p className="text-xs text-muted-foreground mb-3">Logros</p>
        <div className="grid grid-cols-3 gap-3">
          {BADGE_DEFINITIONS.map((badge) => {
            const unlocked = unlockedKeys.has(badge.key as BadgeKey);
            return (
              <div
                key={badge.key}
                className={`flex flex-col items-center gap-1 rounded-xl p-3 text-center transition-all ${
                  unlocked
                    ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800"
                    : "bg-muted/40 border border-border opacity-50"
                }`}
              >
                <span className={`text-3xl ${unlocked ? "" : "grayscale"}`}>{badge.emoji}</span>
                <p className={`text-[10px] font-semibold leading-tight ${unlocked ? "text-amber-900 dark:text-amber-200" : "text-muted-foreground"}`}>
                  {badge.title}
                </p>
                {!unlocked && <span className="text-[10px] text-muted-foreground">🔒</span>}
              </div>
            );
          })}
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
