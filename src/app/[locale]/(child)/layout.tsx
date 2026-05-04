import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";

export default async function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { role: string } | null;
  if (!profile || profile.role !== "child") {
    redirect("/parent/tasks");
  }

  return (
    <div className="flex flex-col min-h-screen pb-[calc(64px+env(safe-area-inset-bottom))]">
      {children}
      <BottomNav role="child" />
    </div>
  );
}
