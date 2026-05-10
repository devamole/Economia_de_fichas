"use client";

import { useState, useOptimistic, useRef, useMemo, startTransition } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Clock, RefreshCw, CheckCircle2 } from "lucide-react";
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
  anytime: "Cuando quieras",
} as const;

const GROUP_EMOJI = {
  morning: "☀️",
  afternoon: "🌤️",
  night: "🌙",
  anytime: "⚡",
} as const;

const GROUP_COLORS = {
  morning:   { accent: "#F59E0B", bg: "#FFF9E6" },
  afternoon: { accent: "#0EA5E9", bg: "#E0F2FE" },
  night:     { accent: "#A855F7", bg: "#F3E8FF" },
  anytime:   { accent: "#F97316", bg: "#FFF0E8" },
} as const;

type Group = keyof typeof GROUP_LABELS;

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

  const todayDate = useMemo(() => new Date(todayStr + "T00:00:00"), [todayStr]);
  const { pendingCompletedIds } = useOfflineTasks(todayDate, todayStr);

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

  function handleComplete(task: Task) {
    if (optimisticCompleted.has(task.id)) return;

    startTransition(async () => {
      addOptimistic(task.id);

      if (!navigator.onLine) {
        await enqueue("completeTask", { taskId: task.id, completionDate: todayStr });
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

      let result: Awaited<ReturnType<typeof completeTask>>;
      try {
        result = await completeTask(task.id, todayStr);
      } catch {
        toast.error("No se pudo conectar. Inténtalo de nuevo.");
        return;
      }

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      const r = result as CompletionResultSuccess;
      setPoints((p) => p + r.points_awarded);
      setStreak(r.new_streak);
      setCompletedCount((c) => c + 1);

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
            style: { background: "#f59e0b", color: "#fff", fontWeight: 700 },
          },
        );
      }

      r.new_achievements?.forEach((key) => showAchievementToast(key));

      if (r.shield_activated) {
        toast("🛡️ ¡Escudo activado automáticamente! Tu racha continúa.", { duration: 3500 });
      }
    });
  }

  const groups = ["morning", "afternoon", "night", "anytime"] as const;
  const grouped = Object.fromEntries(
    groups.map((g) => [g, tasks.filter((t) => timeGroup(t.due_time) === g)]),
  ) as Record<Group, Task[]>;

  const pending = tasks.filter((t) => !optimisticCompleted.has(t.id));
  const completed = tasks.filter((t) => optimisticCompleted.has(t.id));

  return (
    <main className="child-page flex flex-col flex-1 gap-0 pb-4 overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="animate-blob-a absolute -top-20 -left-20 size-64 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="animate-blob-b absolute top-32 -right-16 size-56 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="animate-blob-c absolute bottom-60 -left-10 size-48 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="animate-blob-d absolute -bottom-10 right-10 size-52 rounded-full bg-lime-300/20 blur-3xl" />
      </div>

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
      <div className="relative z-10 px-5 pt-8 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-fredoka text-base font-medium text-amber-700/80">
              {t("greeting", { name: profile.display_name })}
            </p>
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
          <p className="font-fredoka text-sm font-medium text-amber-600/70 mt-2">
            {pending.length === 0
              ? "¡Todas las misiones completadas! 🎉"
              : `${pending.length} ${pending.length === 1 ? "misión pendiente" : "misiones pendientes"} 🗺️`}
          </p>
        )}
      </div>

      {/* Daily progress bar */}
      <div className="relative z-10">
        <DailyProgressBar completed={completedCount} total={tasks.length} />
      </div>

      <div className="relative z-10 flex-1 px-4 space-y-6 pb-2">
        {tasks.length === 0 ? (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center gap-4"
          >
            <span className="text-7xl">🚀</span>
            <p className="font-fredoka text-xl font-semibold text-amber-700/70">{t("noTasks")}</p>
          </m.div>
        ) : (
          <>
            {groups.map((group) => {
              const groupTasks = grouped[group].filter((t) => !optimisticCompleted.has(t.id));
              if (groupTasks.length === 0) return null;
              const { accent } = GROUP_COLORS[group];
              return (
                <section key={group} className="space-y-3">
                  {/* Colorful section header */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none">{GROUP_EMOJI[group]}</span>
                    <span
                      className="font-fredoka text-lg font-semibold leading-none"
                      style={{ color: accent }}
                    >
                      {GROUP_LABELS[group]}
                    </span>
                    <div className="flex-1 h-0.5 rounded-full" style={{ background: accent + "40" }} />
                  </div>
                  <AnimatePresence initial={false}>
                    {groupTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        group={group}
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
              <section className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl leading-none">✅</span>
                  <span className="font-fredoka text-lg font-semibold leading-none text-emerald-600">
                    Completadas
                  </span>
                  <div className="flex-1 h-0.5 rounded-full bg-emerald-200" />
                </div>
                {completed.map((task) => {
                  const comp = completions.find((c) => c.task_id === task.id);
                  const isPending = pendingCompletedIds.has(task.id);
                  return (
                    <TaskItem
                      key={task.id}
                      task={task}
                      group={timeGroup(task.due_time)}
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
  group,
  done,
  onComplete,
  pointsAwarded,
  showNearMiss = false,
  pendingSync = false,
}: {
  task: Task;
  group: Group;
  done: boolean;
  onComplete?: () => void;
  pointsAwarded?: number | null;
  showNearMiss?: boolean;
  pendingSync?: boolean;
}) {
  const { accent, bg } = GROUP_COLORS[group];

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: done ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm"
      style={{ borderLeft: `5px solid ${done ? "#10b981" : accent}` }}
    >
      {/* Emoji bubble */}
      <div
        className="relative shrink-0 size-14 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: done ? "#ecfdf5" : bg }}
      >
        {task.emoji ?? "⭐"}
        {done && (
          <span
            className="animate-stamp absolute inset-0 flex items-center justify-center rounded-2xl text-xl font-black text-emerald-600"
            style={{ background: "rgba(236,253,245,0.85)" }}
          >
            ✓
          </span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-fredoka text-base font-semibold leading-tight ${
            done ? "line-through text-gray-400" : "text-gray-800"
          }`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.due_time && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="size-3" />
              {task.due_time.slice(0, 5)}
            </span>
          )}
          <span className="text-xs font-bold text-amber-500">
            ⭐ {done && pointsAwarded ? `+${pointsAwarded}` : task.points} pts
          </span>
          {pendingSync && (
            <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
              <RefreshCw className="size-3" />
              sync
            </span>
          )}
        </div>
      </div>

      {/* Action button */}
      {done ? (
        <m.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="shrink-0"
        >
          {pendingSync ? (
            <RefreshCw className="size-8 text-amber-400 animate-spin" />
          ) : (
            <CheckCircle2 className="size-9 text-emerald-500" />
          )}
        </m.div>
      ) : (
        <div className="relative shrink-0">
          <m.button
            onClick={onComplete}
            whileTap={{ scale: 0.82 }}
            animate={
              showNearMiss
                ? {
                    boxShadow: [
                      "0 0 0px 0px rgba(251,191,36,0)",
                      "0 0 16px 6px rgba(251,191,36,0.75)",
                      "0 0 0px 0px rgba(251,191,36,0)",
                    ],
                  }
                : { boxShadow: "0 0 0px 0px rgba(251,191,36,0)" }
            }
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="size-14 rounded-2xl flex items-center justify-center border-2 transition-colors active:brightness-95"
            style={{ background: bg, borderColor: accent }}
            aria-label={`Completar: ${task.title}`}
          >
            <span className="text-2xl" style={{ color: accent }}>○</span>
          </m.button>

          <AnimatePresence>
            {showNearMiss && (
              <m.span
                className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-fredoka text-xs font-semibold text-amber-500 pointer-events-none"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.25 }}
              >
                ¡Casi! 💪
              </m.span>
            )}
          </AnimatePresence>
        </div>
      )}
    </m.div>
  );
}
