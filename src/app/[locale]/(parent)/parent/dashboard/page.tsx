import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PushSubscribeButton } from "@/components/push-subscribe";

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, display_name")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const [
    { count: taskCount },
    { count: pendingCount },
    { data: children },
  ] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true })
      .eq("family_id", profile.family_id).eq("active", true),
    supabase.from("task_completions").select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("profiles").select("display_name, emoji, points_balance")
      .eq("family_id", profile.family_id).eq("role", "child"),
  ]);

  return (
    <main className="flex flex-col flex-1 gap-6 p-4 pt-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Hola, {profile.display_name} 👋</h1>
        <p className="text-sm text-muted-foreground">Panel de control</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Tareas activas" value={taskCount ?? 0} href="/parent/tasks" />
        <StatCard label="Pendientes de aprobar" value={pendingCount ?? 0} href="/parent/approvals" />
      </div>

      {/* Kids ranking */}
      {children && children.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Ranking</h2>
          <div className="space-y-2">
            {children
              .sort((a, b) => b.points_balance - a.points_balance)
              .map((child, i) => (
                <div key={child.display_name} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <span className="text-lg font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
                  <span className="text-2xl">{child.emoji ?? "🧒"}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{child.display_name}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{child.points_balance} pts</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Notifications */}
      <section className="space-y-2">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Ajustes</h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          <PushSubscribeButton />
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
      <p className="text-3xl font-bold font-display">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </Link>
  );
}
