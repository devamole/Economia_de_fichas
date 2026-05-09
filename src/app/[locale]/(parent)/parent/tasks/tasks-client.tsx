"use client";

import { useMemo, useOptimistic, useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, PowerOff, Power, Trash2, Clock } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskForm } from "@/components/task-form";
import { getNextTaskOccurrence } from "@/lib/recurrence";
import { deactivateTask, activateTask, deleteTask } from "@/server/actions/tasks";
import type { Task, Profile } from "@/types";

interface Props {
  initialTasks: Task[];
  kids: Pick<Profile, "id" | "display_name" | "emoji">[];
  title: string;
  emptyActive: string;
  emptyInactive: string;
  todayStr: string;
}

type TaskSection = {
  key: string;
  label: string;
  tasks: Task[];
};

export function TasksClient({
  initialTasks,
  kids,
  title,
  emptyActive,
  emptyInactive,
  todayStr,
}: Props) {
  const [tasks, setTasksOptimistic] = useOptimistic(initialTasks);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const locale = useLocale();

  const activeTasks = tasks.filter((t) => t.active);
  const inactiveTasks = tasks.filter((t) => !t.active);
  const today = useMemo(() => parseISO(todayStr), [todayStr]);
  const { upcomingSections, unscheduledTasks } = useMemo(
    () => groupTasksByNextOccurrence(activeTasks, today, locale),
    [activeTasks, today, locale],
  );

  function openNew() {
    setEditingTask(null);
    setSheetOpen(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setSheetOpen(true);
  }

  async function handleDeactivate(task: Task) {
    setTasksOptimistic(tasks.map((t) => (t.id === task.id ? { ...t, active: false } : t)));
    await deactivateTask(task.id);
  }

  async function handleActivate(task: Task) {
    setTasksOptimistic(tasks.map((t) => (t.id === task.id ? { ...t, active: true } : t)));
    await activateTask(task.id);
  }

  async function handleDelete(task: Task) {
    setTasksOptimistic(tasks.filter((t) => t.id !== task.id));
    await deleteTask(task.id);
  }

  const RECURRENCE_LABEL: Record<string, string> = {
    once: "Una vez",
    daily: "Diario",
    weekly: "Semanal",
    custom: "Personalizado",
  };

  return (
    <main className="flex flex-col flex-1 gap-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <Button
          onClick={openNew}
          size="icon"
          className="size-11 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] shadow-lg"
        >
          <Plus className="size-5" />
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="w-full rounded-2xl">
          <TabsTrigger value="active" className="flex-1 rounded-xl">
            Activos ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex-1 rounded-xl">
            Inactivos ({inactiveTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-3">
          {activeTasks.length === 0 ? (
            <EmptyState message={emptyActive} />
          ) : (
            <div className="space-y-5">
              {upcomingSections.map((section) => (
                <section key={section.key} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-semibold text-foreground/85">{section.label}</h2>
                    <span className="text-xs text-muted-foreground">{section.tasks.length} tareas</span>
                  </div>
                  <AnimatePresence initial={false}>
                    {section.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        kids={kids}
                        recurrenceLabel={RECURRENCE_LABEL[task.recurrence_type] ?? task.recurrence_type}
                        onEdit={() => openEdit(task)}
                        onDeactivate={() => handleDeactivate(task)}
                        onDelete={() => handleDelete(task)}
                      />
                    ))}
                  </AnimatePresence>
                </section>
              ))}

              {unscheduledTasks.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-semibold text-foreground/85">
                      {locale === "es" ? "Sin próxima fecha" : "No upcoming date"}
                    </h2>
                    <span className="text-xs text-muted-foreground">{unscheduledTasks.length} tareas</span>
                  </div>
                  <AnimatePresence initial={false}>
                    {unscheduledTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        kids={kids}
                        recurrenceLabel={RECURRENCE_LABEL[task.recurrence_type] ?? task.recurrence_type}
                        onEdit={() => openEdit(task)}
                        onDeactivate={() => handleDeactivate(task)}
                        onDelete={() => handleDelete(task)}
                      />
                    ))}
                  </AnimatePresence>
                </section>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="mt-4 space-y-3">
          {inactiveTasks.length === 0 ? (
            <EmptyState message={emptyInactive} />
          ) : (
            <AnimatePresence initial={false}>
              {inactiveTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  kids={kids}
                  recurrenceLabel={RECURRENCE_LABEL[task.recurrence_type] ?? task.recurrence_type}
                  onEdit={() => openEdit(task)}
                  onActivate={() => handleActivate(task)}
                  onDelete={() => handleDelete(task)}
                  inactive
                />
              ))}
            </AnimatePresence>
          )}
        </TabsContent>
      </Tabs>

      <TaskForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        task={editingTask}
        kids={kids}
      />
    </main>
  );
}

function groupTasksByNextOccurrence(tasks: Task[], today: Date, locale: string): {
  upcomingSections: TaskSection[];
  unscheduledTasks: Task[];
} {
  const sections = new Map<string, TaskSection>();
  const unscheduledTasks: Task[] = [];

  for (const task of tasks) {
    const nextOccurrence = getNextTaskOccurrence(task, today);

    if (!nextOccurrence) {
      unscheduledTasks.push(task);
      continue;
    }

    const key = format(nextOccurrence, "yyyy-MM-dd");
    const existing = sections.get(key);

    if (existing) {
      existing.tasks.push(task);
      continue;
    }

    sections.set(key, {
      key,
      label: formatSectionLabel(nextOccurrence, today, locale),
      tasks: [task],
    });
  }

  const sortTasks = (left: Task, right: Task) => {
    if (left.due_time && right.due_time) return left.due_time.localeCompare(right.due_time);
    if (left.due_time) return -1;
    if (right.due_time) return 1;
    return left.title.localeCompare(right.title, locale);
  };

  const upcomingSections = Array.from(sections.values())
    .sort((left, right) => left.key.localeCompare(right.key))
    .map((section) => ({
      ...section,
      tasks: [...section.tasks].sort(sortTasks),
    }));

  return {
    upcomingSections,
    unscheduledTasks: [...unscheduledTasks].sort(sortTasks),
  };
}

function formatSectionLabel(date: Date, today: Date, locale: string): string {
  const dateLabel = format(date, "dd/MM");

  if (isSameDay(date, today)) {
    return `${locale === "es" ? "Hoy" : "Today"} - ${dateLabel}`;
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(date, tomorrow)) {
    return `${locale === "es" ? "Mañana" : "Tomorrow"} - ${dateLabel}`;
  }

  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} - ${dateLabel}`;
}

// ── Task card ─────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  kids,
  recurrenceLabel,
  onEdit,
  onDeactivate,
  onActivate,
  onDelete,
  inactive = false,
}: {
  task: Task;
  kids: Pick<Profile, "id" | "display_name" | "emoji">[];
  recurrenceLabel: string;
  onEdit: () => void;
  onDeactivate?: () => void;
  onActivate?: () => void;
  onDelete: () => void;
  inactive?: boolean;
}) {
  const assignedKid = kids.find((k) => k.id === task.assigned_to);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`rounded-2xl border border-border bg-card p-4 ${inactive ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl mt-0.5">{task.emoji ?? "✅"}</span>

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{task.title}</p>
          <div className="flex flex-wrap gap-2 mt-1.5">
            <Chip color="purple">{task.points} pts</Chip>
            <Chip color="gray">{recurrenceLabel}</Chip>
            {task.due_time && (
              <Chip color="gray">
                <Clock className="size-3 inline mr-0.5" />
                {task.due_time.slice(0, 5)}
              </Chip>
            )}
            {assignedKid && (
              <Chip color="gray">
                {assignedKid.emoji} {assignedKid.display_name}
              </Chip>
            )}
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <IconBtn onClick={onEdit} label="Editar">
            <Pencil className="size-4" />
          </IconBtn>
          {inactive ? (
            <IconBtn onClick={onActivate} label="Activar">
              <Power className="size-4" />
            </IconBtn>
          ) : (
            <IconBtn onClick={onDeactivate} label="Desactivar">
              <PowerOff className="size-4" />
            </IconBtn>
          )}
          <IconBtn onClick={onDelete} label="Eliminar" danger>
            <Trash2 className="size-4" />
          </IconBtn>
        </div>
      </div>
    </motion.div>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: "purple" | "gray" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        color === "purple"
          ? "bg-primary/15 text-primary"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`size-8 flex items-center justify-center rounded-xl transition-colors ${
        danger
          ? "hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
          : "hover:bg-muted text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground"
    >
      <p className="text-base">{message}</p>
    </motion.div>
  );
}
