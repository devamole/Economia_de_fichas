"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { taskSchema } from "@/lib/schemas/task";

type ActionResult = { error?: string };

function parseTaskForm(formData: FormData) {
  const recurrenceDays = formData
    .getAll("recurrenceDays")
    .map((d) => Number(d))
    .filter((n) => !isNaN(n));

  return taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    assignedTo: formData.get("assignedTo"),
    points: formData.get("points"),
    emoji: formData.get("emoji"),
    recurrenceType: formData.get("recurrenceType"),
    recurrenceDays: recurrenceDays.length ? recurrenceDays : undefined,
    dueTime: formData.get("dueTime") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    requiresApproval: formData.get("requiresApproval") === "true",
  });
}

export async function createTask(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseTaskForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Perfil no encontrado." };

  const {
    assignedTo, recurrenceType, recurrenceDays, dueTime,
    startDate, endDate, requiresApproval, ...rest
  } = parsed.data;

  const { error } = await supabase.from("tasks").insert({
    ...rest,
    assigned_to: assignedTo,
    recurrence_type: recurrenceType,
    recurrence_days: recurrenceDays ?? null,
    due_time: dueTime || null,
    start_date: startDate,
    end_date: endDate || null,
    requires_approval: requiresApproval,
    family_id: profile.family_id,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/parent/tasks");
  return {};
}

export async function updateTask(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  if (!id) return { error: "ID requerido." };

  const parsed = parseTaskForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const {
    assignedTo, recurrenceType, recurrenceDays, dueTime,
    startDate, endDate, requiresApproval, ...rest
  } = parsed.data;

  const { error } = await supabase
    .from("tasks")
    .update({
      ...rest,
      assigned_to: assignedTo,
      recurrence_type: recurrenceType,
      recurrence_days: recurrenceDays ?? null,
      due_time: dueTime || null,
      start_date: startDate,
      end_date: endDate || null,
      requires_approval: requiresApproval,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/parent/tasks");
  return {};
}

export async function deactivateTask(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ active: false })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/parent/tasks");
  return {};
}

export async function activateTask(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ active: true })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/parent/tasks");
  return {};
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/parent/tasks");
  return {};
}
