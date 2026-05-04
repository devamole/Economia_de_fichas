"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type CompletionResult =
  | { completion_id: string; points_awarded: number | null; status: string }
  | { error: string };

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

  revalidatePath("/child/today");
  return data as CompletionResult;
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
