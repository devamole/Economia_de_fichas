import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileClient } from "./profile-client";

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

  const [{ data: rawAchievements }, { data: pendingCompletions }] = await Promise.all([
    supabase
      .from("user_achievements")
      .select("badge_key")
      .eq("profile_id", user.id),
    supabase
      .from("task_completions")
      .select("points_awarded")
      .eq("completed_by", user.id)
      .eq("status", "pending"),
  ]);

  const totalPoints = (profile as { total_points_earned?: number }).total_points_earned ?? 0;
  const pendingPoints = (pendingCompletions ?? []).reduce((sum, r) => sum + (r.points_awarded ?? 0), 0);
  const availablePoints = Math.max(0, profile.points_balance - pendingPoints);
  const family = Array.isArray(profile.families) ? profile.families[0] : profile.families;

  return (
    <ProfileClient
      displayName={profile.display_name}
      emoji={profile.emoji ?? "🧒"}
      availablePoints={availablePoints}
      pendingPoints={pendingPoints}
      totalPoints={totalPoints}
      unlockedKeys={(rawAchievements ?? []).map((a) => a.badge_key)}
      family={family ? { name: family.name, family_code: family.family_code } : null}
    />
  );
}
