"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTask, updateTask } from "@/server/actions/tasks";
import type { Task, Profile } from "@/types";

// Common emojis for tasks
const QUICK_EMOJIS = ["✅", "🦷", "📚", "🛏️", "🧹", "🍽️", "🏃", "🎮", "🐕", "🌱"];

const WEEKDAYS = [
  { label: "L", value: 1 },
  { label: "M", value: 2 },
  { label: "X", value: 3 },
  { label: "J", value: 4 },
  { label: "V", value: 5 },
  { label: "S", value: 6 },
  { label: "D", value: 0 },
];

const QUICK_POINTS = [5, 10, 20, 50];

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  kids: Pick<Profile, "id" | "display_name" | "emoji">[];
  onSuccess?: () => void;
}

type State = { error?: string } | null;

export function TaskForm({ open, onOpenChange, task, kids, onSuccess }: TaskFormProps) {
  const t = useTranslations("tasks");
  const isEdit = !!task;
  const action = isEdit ? updateTask : createTask;
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Close sheet on success
  useEffect(() => {
    if (state !== null && !state?.error) {
      onOpenChange(false);
      onSuccess?.();
      formRef.current?.reset();
    }
  }, [state, onOpenChange, onSuccess]);

  const defaultRecurrence = task?.recurrence_type ?? "daily";
  const defaultDays: number[] = (task?.recurrence_days as number[] | null) ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92dvh] overflow-y-auto rounded-t-3xl px-6 pb-8">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-xl">
            {isEdit ? t("editTask") : t("newTask")}
          </SheetTitle>
        </SheetHeader>

        <form ref={formRef} action={formAction} className="space-y-5">
          {isEdit && <input type="hidden" name="id" value={task?.id} />}

          {/* Emoji picker */}
          <div className="space-y-2">
            <Label>{t("emoji")}</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_EMOJIS.map((e) => (
                <label key={e} className="cursor-pointer">
                  <input type="radio" name="emoji" value={e} defaultChecked={task?.emoji === e || (!task && e === "✅")} className="sr-only peer" />
                  <span className="flex size-11 items-center justify-center rounded-2xl border-2 border-transparent text-2xl transition-all peer-checked:border-primary peer-checked:bg-primary/10">
                    {e}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">{t("taskTitle")}</Label>
            <Input
              id="title"
              name="title"
              defaultValue={task?.title}
              required
              minLength={2}
              placeholder="Lavarse los dientes"
              className="rounded-xl h-12"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("description")}</Label>
            <Input
              id="description"
              name="description"
              defaultValue={task?.description ?? ""}
              placeholder="Opcional"
              className="rounded-xl h-12"
            />
          </div>

          {/* Assign to */}
          <div className="space-y-1.5">
            <Label>{t("assignTo")}</Label>
            <Select name="assignedTo" defaultValue={task?.assigned_to ?? kids[0]?.id}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Seleccionar hijo" />
              </SelectTrigger>
              <SelectContent>
                {kids.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.emoji} {k.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Points */}
          <div className="space-y-2">
            <Label htmlFor="points">{t("points")}</Label>
            <div className="flex gap-2">
              {QUICK_POINTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const input = formRef.current?.querySelector<HTMLInputElement>('[name="points"]');
                    if (input) { input.value = String(p); input.dispatchEvent(new Event("input", { bubbles: true })); }
                  }}
                  className="rounded-xl border border-border px-3 py-1.5 text-sm font-semibold hover:bg-primary/10 hover:border-primary transition-colors"
                >
                  +{p}
                </button>
              ))}
              <Input
                id="points"
                name="points"
                type="number"
                min={1}
                max={9999}
                defaultValue={task?.points ?? 10}
                className="rounded-xl h-9 w-20 text-center font-bold tabular"
              />
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label>{t("recurrence")}</Label>
            <Select name="recurrenceType" defaultValue={defaultRecurrence}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">{t("recurrenceOnce")}</SelectItem>
                <SelectItem value="daily">{t("recurrenceDaily")}</SelectItem>
                <SelectItem value="weekly">{t("recurrenceWeekly")}</SelectItem>
                <SelectItem value="custom">{t("recurrenceCustom")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Weekday picker — shown for weekly/custom */}
            <div className="flex gap-2 flex-wrap">
              {WEEKDAYS.map(({ label, value }) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="checkbox"
                    name="recurrenceDays"
                    value={value}
                    defaultChecked={defaultDays.includes(value)}
                    className="sr-only peer"
                  />
                  <span className="flex size-10 items-center justify-center rounded-full border-2 border-border text-sm font-bold transition-all peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Due time */}
          <div className="space-y-1.5">
            <Label htmlFor="dueTime">{t("dueTime")}</Label>
            <Input
              id="dueTime"
              name="dueTime"
              type="time"
              defaultValue={task?.due_time?.slice(0, 5) ?? ""}
              className="rounded-xl h-12"
            />
          </div>

          {/* Start / end dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">{t("startDate")}</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={task?.start_date ?? new Date().toISOString().slice(0, 10)}
                required
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">{t("endDate")}</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={task?.end_date ?? ""}
                className="rounded-xl h-12"
              />
            </div>
          </div>

          {/* Requires approval */}
          <div className="flex items-center justify-between rounded-2xl border border-border p-4">
            <Label htmlFor="requiresApproval" className="cursor-pointer text-sm">
              {t("requiresApproval")}
            </Label>
            <Switch
              id="requiresApproval"
              name="requiresApproval"
              value="true"
              defaultChecked={task?.requires_approval ?? false}
            />
          </div>

          {state?.error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3"
            >
              {state.error}
            </motion.p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:opacity-90"
          >
            {pending ? "Guardando…" : isEdit ? t("editTask") : t("newTask")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
