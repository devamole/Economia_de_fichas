"use client";

import { useState, useOptimistic } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { completeTask } from "@/server/actions/completions";
import { useCelebrate } from "@/components/celebrate";
import type { Task, TaskCompletion, Profile } from "@/types";

interface Props {
  profile: Profile & { families: { timezone: string } | null };
  tasks: Task[];
  completedIds: Set<string>;
  completions: TaskCompletion[];
  todayStr: string;
}

function timeGroup(due_time: string | null): "morning" | "afternoon" | "night" | "anytime" {
  if (!due_time) return "anytime";
  const h = parseInt(due_time.slice(0, 2));
  if (h < 12) return "morning";
  if (h < 19) return "afternoon";
  return "night";
}

const GROUP_LABELS = {
  morning: "Mañana",
  afternoon: "Tarde",
  night: "Noche",
  anytime: "En cualquier momento",
} as const;

export function TodayClient({ profile, tasks, completedIds: initialCompleted, completions, todayStr }: Props) {
  const t = useTranslations("today");
  const celebrate = useCelebrate();

  const [optimisticCompleted, addOptimistic] = useOptimistic(
    initialCompleted,
    (state: Set<string>, taskId: string) => new Set([...state, taskId]),
  );
  const [points, setPoints] = useState(profile.points_balance);

  async function handleComplete(task: Task) {
    if (optimisticCompleted.has(task.id)) return;

    // Optimistically mark as complete
    addOptimistic(task.id);

    const result = await completeTask(task.id, todayStr);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    // Award points and celebrate
    if (result.points_awarded) {
      setPoints((p) => p + (result.points_awarded ?? 0));
      celebrate();
      toast.success(`+${result.points_awarded} puntos 🔥`, {
        duration: 3000,
        style: { background: "#7c3aed", color: "#fff", fontWeight: 700 },
      });
    } else {
      toast("Tarea enviada para aprobación ✋");
    }
  }

  // Group tasks
  const groups = ["morning", "afternoon", "night", "anytime"] as const;
  const grouped = Object.fromEntries(
    groups.map((g) => [
      g,
      tasks.filter((t) => timeGroup(t.due_time) === g),
    ]),
  ) as Record<typeof groups[number], Task[]>;

  const pending = tasks.filter((t) => !optimisticCompleted.has(t.id));
  const completed = tasks.filter((t) => optimisticCompleted.has(t.id));

  return (
    <main className="flex flex-col flex-1 gap-0 pb-4">
      {/* Hero header */}
      <div className="px-5 pt-8 pb-6 bg-gradient-to-b from-[#7c3aed]/10 to-transparent">
        <p className="text-muted-foreground text-sm">{t("greeting", { name: profile.display_name })}</p>
        <motion.div
          key={points}
          initial={{ scale: 0.9, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="font-display text-5xl font-bold tabular mt-1"
        >
          {points}
          <span className="text-xl ml-2 text-muted-foreground font-normal">pts</span>
        </motion.div>
        {tasks.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {pending.length === 0
              ? "¡Todo listo por hoy! 🎉"
              : `${pending.length} ${pending.length === 1 ? "tarea pendiente" : "tareas pendientes"}`}
          </p>
        )}
      </div>

      <div className="flex-1 px-4 space-y-6">
        {tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center gap-3"
          >
            <span className="text-5xl">🚀</span>
            <p className="text-muted-foreground">{t("noTasks")}</p>
          </motion.div>
        ) : (
          <>
            {/* Pending tasks by time group */}
            {groups.map((group) => {
              const groupTasks = grouped[group].filter((t) => !optimisticCompleted.has(t.id));
              if (groupTasks.length === 0) return null;
              return (
                <section key={group} className="space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                    {GROUP_LABELS[group]}
                  </h2>
                  <AnimatePresence initial={false}>
                    {groupTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        done={false}
                        onComplete={() => handleComplete(task)}
                      />
                    ))}
                  </AnimatePresence>
                </section>
              );
            })}

            {/* Completed tasks */}
            {completed.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  Completados ✅
                </h2>
                {completed.map((task) => {
                  const comp = completions.find((c) => c.task_id === task.id);
                  return (
                    <TaskItem
                      key={task.id}
                      task={task}
                      done
                      pointsAwarded={comp?.points_awarded ?? null}
                    />
                  );
                })}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ── Task item ─────────────────────────────────────────────────────────────────

function TaskItem({
  task,
  done,
  onComplete,
  pointsAwarded,
}: {
  task: Task;
  done: boolean;
  onComplete?: () => void;
  pointsAwarded?: number | null;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: done ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={`flex items-center gap-4 rounded-2xl border p-4 ${
        done ? "border-border bg-muted/40" : "border-border bg-card"
      }`}
    >
      <span className="text-3xl shrink-0">{task.emoji ?? "✅"}</span>

      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate ${done ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {task.due_time && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {task.due_time.slice(0, 5)}
            </span>
          )}
          <span className={`text-xs font-bold ${done ? "text-success-emerald" : "text-primary"}`}>
            {done && pointsAwarded
              ? `+${pointsAwarded} pts`
              : `${task.points} pts`}
          </span>
        </div>
      </div>

      {done ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          <CheckCircle2 className="size-8 text-success-emerald shrink-0" />
        </motion.div>
      ) : (
        <button
          onClick={onComplete}
          className="size-9 flex items-center justify-center rounded-full border-2 border-border hover:border-primary hover:bg-primary/10 active:scale-90 transition-all shrink-0"
          aria-label={`Completar: ${task.title}`}
        >
          <Circle className="size-5 text-muted-foreground" />
        </button>
      )}
    </motion.div>
  );
}
