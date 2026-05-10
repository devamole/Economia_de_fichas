"use client";

import { useState, useOptimistic, useRef, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Clock, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { completeTask } from "@/server/actions/completions";
import { useCelebrate } from "@/components/celebrate";
import { enqueue } from "@/lib/offline/queue";
import { db } from "@/lib/offline/db";
import { useOfflineTasks } from "@/hooks/use-offline-tasks";
import { StreakBadge } from "@/components/streak-badge";
import { DailyProgressBar } from "@/components/daily-progress-bar";
import { PointsCounter } from "@/components/points-counter";
import { OyeeCelebration } from "@/components/oyee-celebration";
import { showAchievementToast } from "@/components/achievement-toast";
import { useWebAudio } from "@/hooks/use-web-audio";
import type { Task, TaskCompletion, Profile, CompletionResultSuccess } from "@/types";

// Fields added by migration 0007 (optional until db:types is re-run)
type ProfileWithEngagement = Profile & {
  current_streak?: number | null;
  streak_shield_used_at?: string | null;
  families: { timezone: string } | null;
};

interface Props {
  profile: ProfileWithEngagement;
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

function isShieldAvailable(shieldUsedAt: string | null | undefined, todayStr: string): boolean {
  if (!shieldUsedAt) return true;
  const days = Math.floor(
    (new Date(todayStr).getTime() - new Date(shieldUsedAt).getTime()) / 86_400_000,
  );
  return days >= 30;
}

export function TodayClient({ profile, tasks, completedIds: initialCompleted, completions, todayStr }: Props) {
  const t = useTranslations("today");
  const celebrate = useCelebrate();
  const { playCoin } = useWebAudio();

  // Offline tasks from Dexie — gives us pendingCompletedIds across reloads
  const todayDate = useMemo(() => new Date(todayStr + "T00:00:00"), [todayStr]);
  const { pendingCompletedIds } = useOfflineTasks(todayDate, todayStr);

  // Merge server-confirmed and locally-pending completions
  const mergedInitial = useMemo(
    () => new Set([...initialCompleted, ...pendingCompletedIds]),
    [initialCompleted, pendingCompletedIds],
  );

  const [optimisticCompleted, addOptimistic] = useOptimistic(
    mergedInitial,
    (state: Set<string>, taskId: string) => new Set([...state, taskId]),
  );

  const [points, setPoints] = useState(profile.points_balance);
  const [streak, setStreak] = useState(profile.current_streak ?? 0);
  const [completedCount, setCompletedCount] = useState(initialCompleted.size);
  const [oyeeEvent, setOyeeEvent] = useState<{ points: number; basePoints: number } | null>(null);
  const [nearMissTaskId, setNearMissTaskId] = useState<string | null>(null);
  const [minorBoostKey, setMinorBoostKey] = useState(0);
  const [showMinorFlash, setShowMinorFlash] = useState(false);
  const nearMissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shieldAvailable = isShieldAvailable(profile.streak_shield_used_at, todayStr);

  function triggerBaseCompletion(showNearMiss: boolean, taskId: string) {
    celebrate();
    if (showNearMiss) {
      if (nearMissTimer.current) clearTimeout(nearMissTimer.current);
      setNearMissTaskId(taskId);
      nearMissTimer.current = setTimeout(() => setNearMissTaskId(null), 1800);
    }
  }

  function triggerMinorBoost(pointsAwarded: number) {
    celebrate();
    playCoin();
    navigator.vibrate?.([30, 50, 30]);
    setShowMinorFlash(true);
    setMinorBoostKey((k) => k + 1);
    setTimeout(() => setShowMinorFlash(false), 700);
    toast.success(`⚡ +${pointsAwarded} pts — ¡Bonus de plata!`, {
      style: { background: "#94a3b8", color: "#fff", fontWeight: 700 },
      duration: 2500,
    });
  }

  async function handleComplete(task: Task) {
    if (optimisticCompleted.has(task.id)) return;
    addOptimistic(task.id);

    if (!navigator.onLine) {
      await enqueue("completeTask", { taskId: task.id, completionDate: todayStr });
      // Write to Dexie so the pending badge persists across reloads
      await db.task_completions.put({
        id: `offline-${task.id}-${todayStr}`,
        task_id: task.id,
        completed_by: profile.id,
        completion_date: todayStr,
        created_at: new Date().toISOString(),
        status: "pending",
        points_awarded: task.points,
        boost_type: null,
        note: null,
        reviewed_at: null,
        reviewed_by: null,
        pending_sync: true,
      });
      celebrate();
      toast("Sin conexión — se sincronizará cuando vuelvas online 📡");
      setCompletedCount((c) => c + 1);
      return;
    }

    const result = await completeTask(task.id, todayStr);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    const r = result as CompletionResultSuccess;
    setPoints((p) => p + r.points_awarded);
    setStreak(r.new_streak);
    setCompletedCount((c) => c + 1);

    // eslint-disable-next-line react-hooks/purity
    const showNearMiss = r.boost_type === "none" && Math.random() < 0.2;

    if (r.boost_type === "epic") {
      setOyeeEvent({ points: r.points_awarded, basePoints: r.base_points });
    } else if (r.boost_type === "minor") {
      triggerMinorBoost(r.points_awarded);
    } else {
      triggerBaseCompletion(showNearMiss, task.id);
      const isPending = r.status === "pending";
      toast.success(
        isPending ? `+${r.points_awarded} puntos ⏳` : `+${r.points_awarded} puntos 🔥`,
        {
          description: isPending ? "Pendiente de aprobación del adulto" : undefined,
          duration: 3000,
          style: { background: "#7c3aed", color: "#fff", fontWeight: 700 },
        },
      );
    }

    r.new_achievements?.forEach((key) => showAchievementToast(key));

    if (r.shield_activated) {
      toast("🛡️ ¡Escudo activado automáticamente! Tu racha continúa.", { duration: 3500 });
    }
  }

  const groups = ["morning", "afternoon", "night", "anytime"] as const;
  const grouped = Object.fromEntries(
    groups.map((g) => [g, tasks.filter((t) => timeGroup(t.due_time) === g)]),
  ) as Record<(typeof groups)[number], Task[]>;

  const pending = tasks.filter((t) => !optimisticCompleted.has(t.id));
  const completed = tasks.filter((t) => optimisticCompleted.has(t.id));

  return (
    <main className="flex flex-col flex-1 gap-0 pb-4">
      {/* Minor boost silver flash */}
      <AnimatePresence>
        {showMinorFlash && (
          <m.div
            key={minorBoostKey}
            className="fixed inset-0 z-40 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, rgba(148,163,184,0.55) 0%, transparent 70%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* Epic OYEE overlay */}
      {oyeeEvent && (
        <OyeeCelebration
          points={oyeeEvent.points}
          basePoints={oyeeEvent.basePoints}
          onComplete={() => setOyeeEvent(null)}
        />
      )}

      {/* Hero header */}
      <div className="px-5 pt-8 pb-3 bg-gradient-to-b from-[#7c3aed]/10 to-transparent">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-muted-foreground text-sm">{t("greeting", { name: profile.display_name })}</p>
            <div className="mt-1">
              <PointsCounter points={points} />
            </div>
          </div>
          <div className="pt-1">
            <StreakBadge
              streak={streak}
              shieldAvailable={shieldAvailable}
              todayStr={todayStr}
            />
          </div>
        </div>

        {tasks.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {pending.length === 0
              ? "¡Todo listo por hoy! 🎉"
              : `${pending.length} ${pending.length === 1 ? "tarea pendiente" : "tareas pendientes"}`}
          </p>
        )}
      </div>

      {/* Daily progress bar */}
      <DailyProgressBar completed={completedCount} total={tasks.length} />

      <div className="flex-1 px-4 space-y-6">
        {tasks.length === 0 ? (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center gap-3"
          >
            <span className="text-5xl">🚀</span>
            <p className="text-muted-foreground">{t("noTasks")}</p>
          </m.div>
        ) : (
          <>
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
                        showNearMiss={nearMissTaskId === task.id}
                        onComplete={() => handleComplete(task)}
                      />
                    ))}
                  </AnimatePresence>
                </section>
              );
            })}

            {completed.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  Completados ✅
                </h2>
                {completed.map((task) => {
                  const comp = completions.find((c) => c.task_id === task.id);
                  const isPending = pendingCompletedIds.has(task.id);
                  return (
                    <TaskItem
                      key={task.id}
                      task={task}
                      done
                      pendingSync={isPending}
                      pointsAwarded={comp?.points_awarded ?? (isPending ? task.points : null)}
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
  showNearMiss = false,
  pendingSync = false,
}: {
  task: Task;
  done: boolean;
  onComplete?: () => void;
  pointsAwarded?: number | null;
  showNearMiss?: boolean;
  pendingSync?: boolean;
}) {
  return (
    <m.div
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
            {done && pointsAwarded ? `+${pointsAwarded} pts` : `${task.points} pts`}
          </span>
          {pendingSync && (
            <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
              <RefreshCw className="size-3" />
              pendiente
            </span>
          )}
        </div>
      </div>

      {done ? (
        <m.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          {pendingSync ? (
            <RefreshCw className="size-8 text-amber-500 shrink-0 animate-spin" />
          ) : (
            <CheckCircle2 className="size-8 text-success-emerald shrink-0" />
          )}
        </m.div>
      ) : (
        <div className="relative shrink-0">
          <m.button
            onClick={onComplete}
            animate={
              showNearMiss
                ? {
                    boxShadow: [
                      "0 0 0px 0px rgba(251,191,36,0)",
                      "0 0 12px 4px rgba(251,191,36,0.8)",
                      "0 0 0px 0px rgba(251,191,36,0)",
                    ],
                  }
                : { boxShadow: "0 0 0px 0px rgba(251,191,36,0)" }
            }
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="size-9 flex items-center justify-center rounded-full border-2 border-border hover:border-primary hover:bg-primary/10 active:scale-90 transition-all"
            aria-label={`Completar: ${task.title}`}
          >
            <Circle className="size-5 text-muted-foreground" />
          </m.button>

          {/* Near-miss ephemeral text */}
          <AnimatePresence>
            {showNearMiss && (
              <m.span
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-amber-500 pointer-events-none"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.25 }}
              >
                ¡Casi! Sigue así
              </m.span>
            )}
          </AnimatePresence>
        </div>
      )}
    </m.div>
  );
}
