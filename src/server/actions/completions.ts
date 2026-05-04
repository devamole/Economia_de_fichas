"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type CompletionResult =
  | { completion_id: string; points_awarded: number | null; status: string }
  | { error: string };

async function notifyParents(familyId: string, title: string, body: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  try {
    const supabase = await createClient();
    const { data: parents } = await supabase
      .from("profiles")
      .select("id")
      .eq("family_id", familyId)
      .eq("role", "parent");

    if (!parents) return;

    await Promise.allSettled(
      parents.map((p) =>
        fetch(`${appUrl}/api/push/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: p.id, title, body, url: "/parent/approvals" }),
        }),
      ),
    );
  } catch {}
}

export async function completeTask(
  taskId: string,
  completionDate: string,
): Promise<CompletionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data, error } = await supabase.rpc("complete_task", {
    p_task_id: taskId,
    p_completed_by: user.id,
    p_completion_date: completionDate,
  });

  if (error) {
    if (error.message.includes("unique")) {
      return { error: "Ya completaste esta tarea hoy." };
    }
    return { error: error.message };
  }

  const result = data as CompletionResult;

  // Notify parents if approval needed
  if (!("error" in result) && result.status === "pending") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id, display_name")
      .eq("id", user.id)
      .single();
    if (profile) {
      const { data: task } = await supabase
        .from("tasks")
        .select("title")
        .eq("id", taskId)
        .single();
      if (task) {
        notifyParents(
          profile.family_id,
          "Tarea completada 📝",
          `${profile.display_name} completó "${task.title}"`,
        );
      }
    }
  }

  revalidatePath("/child/today");
  return result;
}

export async function approveCompletion(completionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.rpc("approve_completion", {
    p_completion_id: completionId,
    p_reviewer_id: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/parent/approvals");
  return {};
}

export async function rejectCompletion(completionId: string, note?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.rpc("reject_completion", {
    p_completion_id: completionId,
    p_reviewer_id: user.id,
    p_note: note ?? undefined,
  });

  if (error) return { error: error.message };
  revalidatePath("/parent/approvals");
  return {};
}
