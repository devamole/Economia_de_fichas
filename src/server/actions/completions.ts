"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyFamilyParents } from "@/lib/push-notify";
import type { CompletionResult } from "@/types";

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
        notifyFamilyParents(
          profile.family_id,
          "task_completions",
          {
            title: "Tarea completada 📝",
            body: `${profile.display_name} completó "${task.title}"`,
            url: "/parent/approvals",
          },
        );
      }
    }
  }

  revalidatePath("/child/today");
  revalidatePath("/child/profile");
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
