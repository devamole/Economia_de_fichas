"use client";

import { useState, useMemo, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { getTasksForDate } from "@/lib/recurrence";
import { StreakBadge } from "@/components/streak-badge";
import { PointsCounter } from "@/components/points-counter";
import type { Task, Profile } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type CompletionMeta = {
  task_id: string;
  completion_date: string;
  points_awarded: number | null;
};

export type ProfileForCalendar = Profile & {
  current_streak?: number | null;
  streak_shield_used_at?: string | null;
  families: { timezone: string } | null;
};

interface Props {
  profile: ProfileForCalendar;
  tasks: Task[];
  completions: CompletionMeta[];
  todayStr: string;
}

type MonthStats = {
  completedCount: number;
  totalCount: number;
  ptsEarned: number;
  activeDays: number;
};

// ── Design system (mirrors today-client.tsx) ──────────────────────────────────

function timeGroup(due_time: string | null): "morning" | "afternoon" | "night" | "anytime" {
  if (!due_time) return "anytime";
  const h = parseInt(due_time.slice(0, 2));
  if (h < 12) return "morning";
  if (h < 19) return "afternoon";
  return "night";
}

type Group = "morning" | "afternoon" | "night" | "anytime";

const GROUP_EMOJI = {
  morning: "☀️",
  afternoon: "🌤️",
  night: "🌙",
  anytime: "⚡",
} as const;

const GROUP_COLORS: Record<Group, { accent: string; bg: string }> = {
  morning: { accent: "#F59E0B", bg: "#FFF9E6" },
  afternoon: { accent: "#0EA5E9", bg: "#E0F2FE" },
  night: { accent: "#A855F7", bg: "#F3E8FF" },
  anytime: { accent: "#F97316", bg: "#FFF0E8" },
};

// Mon→Sun accent colors for weekday headers
const DOW_COLORS = ["#F59E0B", "#0EA5E9", "#A855F7", "#F97316", "#10B981", "#0EA5E9", "#F59E0B"];

const sectionVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
};

function darkenHex(hex: string, amount = 0.15): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const d = (c: number) => Math.max(0, Math.floor(c * (1 - amount)));
  return `#${d(r).toString(16).padStart(2, "0")}${d(g).toString(16).padStart(2, "0")}${d(b).toString(16).padStart(2, "0")}`;
}

function isShieldAvailable(shieldUsedAt: string | null | undefined, todayStr: string): boolean {
  if (!shieldUsedAt) return true;
  const days = Math.floor(
    (new Date(todayStr).getTime() - new Date(shieldUsedAt).getTime()) / 86_400_000,
  );
  return days >= 30;
}

// ── Root component ─────────────────────────────────────────────────────────────

export function CalendarClient({ profile, tasks, completions, todayStr }: Props) {
  const todayDate = useMemo(() => parseISO(todayStr), [todayStr]);
  const [currentMonth, setCurrentMonth] = useState(todayDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(todayDate);
  const [direction, setDirection] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }),
    [currentMonth],
  );

  const completedSet = useMemo(
    () => new Set(completions.map((c) => `${c.task_id}:${c.completion_date}`)),
    [completions],
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    days.forEach((day) => {
      const dayTasks = getTasksForDate(tasks, day);
      if (dayTasks.length > 0) map.set(day.toISOString().slice(0, 10), dayTasks);
    });
    return map;
  }, [days, tasks]);

  const monthStats = useMemo((): MonthStats => {
    const monthStart = startOfMonth(currentMonth).toISOString().slice(0, 10);
    const monthEnd = endOfMonth(currentMonth).toISOString().slice(0, 10);
    const monthCompletions = completions.filter(
      (c) => c.completion_date >= monthStart && c.completion_date <= monthEnd,
    );
    const totalCount = days.reduce((acc, d) => acc + getTasksForDate(tasks, d).length, 0);
    const ptsEarned = monthCompletions.reduce((acc, c) => acc + (c.points_awarded ?? 0), 0);
    const activeDays = new Set(monthCompletions.map((c) => c.completion_date)).size;
    return { completedCount: monthCompletions.length, totalCount, ptsEarned, activeDays };
  }, [completions, currentMonth, days, tasks]);

  const selectedTasks = useMemo(
    () => (selectedDate ? getTasksForDate(tasks, selectedDate) : []),
    [selectedDate, tasks],
  );

  const selectedDateStr = selectedDate?.toISOString().slice(0, 10) ?? null;
  const startDow = (getDay(startOfMonth(currentMonth)) + 6) % 7;
  const shieldAvailable = isShieldAvailable(profile.streak_shield_used_at, todayStr);

  function animateStats() {
    if (typeof window === "undefined" || !statsRef.current) return;
    const spans = statsRef.current.querySelectorAll("[data-stat-target]");
    import("animejs").then(({ animate }) => {
      spans.forEach((span) => {
        const end = parseInt(span.getAttribute("data-stat-target") ?? "0", 10);
        const obj = { v: 0 };
        animate(obj, {
          v: end,
          duration: 600,
          ease: "outExpo",
          onUpdate() {
            (span as HTMLElement).textContent = String(Math.round(obj.v));
          },
        });
      });
    });
  }

  function goToPrevMonth() {
    setDirection(-1);
    setCurrentMonth((m) => subMonths(m, 1));
    animateStats();
  }

  function goToNextMonth() {
    setDirection(1);
    setCurrentMonth((m) => addMonths(m, 1));
    animateStats();
  }

  return (
    <main className="child-page flex flex-col flex-1 gap-0 pb-4 overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="animate-blob-a absolute -top-20 -left-20 size-64 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="animate-blob-b absolute top-32 -right-16 size-56 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="animate-blob-c absolute bottom-60 -left-10 size-48 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="animate-blob-d absolute -bottom-10 right-10 size-52 rounded-full bg-lime-300/20 blur-3xl" />
      </div>

      {/* Hero header */}
      <div className="relative z-10 px-5 pt-8 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-fredoka text-base font-medium text-amber-700/80">
              ¡Hola, {profile.display_name}! 🗓️
            </p>
            <div className="mt-1">
              <PointsCounter points={profile.points_balance} />
            </div>
          </div>
          <div className="pt-1">
            <StreakBadge
              streak={profile.current_streak ?? 0}
              shieldAvailable={shieldAvailable}
              todayStr={todayStr}
            />
          </div>
        </div>
        <p className="font-fredoka text-sm font-medium text-amber-600/70 mt-2">
          {monthStats.completedCount > 0
            ? `${monthStats.completedCount} misiones completadas este mes 🎉`
            : "¡Empieza a completar misiones este mes! 🚀"}
        </p>
      </div>

      {/* Monthly stats strip */}
      <MonthlyStatsStrip ref={statsRef} stats={monthStats} />

      {/* Scrollable body */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 space-y-4 pb-2">
        <CalendarCard
          currentMonth={currentMonth}
          direction={direction}
          days={days}
          startDow={startDow}
          today={todayDate}
          selectedDate={selectedDate}
          tasksByDay={tasksByDay}
          completedSet={completedSet}
          onPrev={goToPrevMonth}
          onNext={goToNextMonth}
          onSelectDate={setSelectedDate}
        />

        <AnimatePresence mode="wait">
          {selectedDate ? (
            <SelectedDatePanel
              key={selectedDateStr}
              date={selectedDate}
              tasks={selectedTasks}
              completedSet={completedSet}
              dateStr={selectedDateStr!}
            />
          ) : (
            <NoDayPrompt key="prompt" />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

// ── Monthly stats strip ────────────────────────────────────────────────────────

function MonthlyStatsStrip({ stats, ref }: { stats: MonthStats; ref?: React.Ref<HTMLDivElement> }) {
  const pills = [
    {
      emoji: "✅",
      value: `${stats.completedCount}/${stats.totalCount}`,
      label: "este mes",
      accent: "#10B981",
      bg: "#ecfdf5",
      target: stats.completedCount,
    },
    {
      emoji: "⭐",
      value: stats.ptsEarned,
      label: "pts",
      accent: "#F59E0B",
      bg: "#FFF9E6",
      target: stats.ptsEarned,
    },
    {
      emoji: "🔥",
      value: stats.activeDays,
      label: "días activos",
      accent: "#F97316",
      bg: "#FFF0E8",
      target: stats.activeDays,
    },
  ];

  return (
    <m.div
      ref={ref}
      className="relative z-10 flex gap-2 px-4 pb-3 overflow-x-auto"
      style={{ scrollbarWidth: "none" }}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {pills.map((pill, i) => (
        <m.div
          key={i}
          variants={{
            hidden: { opacity: 0, scale: 0.8 },
            visible: {
              opacity: 1,
              scale: 1,
              transition: { type: "spring", stiffness: 300, damping: 22 },
            },
          }}
          className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{
            background: pill.bg,
            border: `1px solid ${pill.accent}33`,
            boxShadow: `0 2px 8px -2px ${pill.accent}30`,
          }}
        >
          <span className="text-sm leading-none">{pill.emoji}</span>
          <span
            className="font-fredoka text-xs font-bold tabular"
            style={{ color: pill.accent }}
            data-stat-target={pill.target}
          >
            {typeof pill.value === "number" ? pill.value : pill.value}
          </span>
          <span className="font-fredoka text-xs text-gray-500">{pill.label}</span>
        </m.div>
      ))}
    </m.div>
  );
}

// ── Calendar card (double-bezel) ───────────────────────────────────────────────

interface CalendarCardProps {
  currentMonth: Date;
  direction: number;
  days: Date[];
  startDow: number;
  today: Date;
  selectedDate: Date | null;
  tasksByDay: Map<string, Task[]>;
  completedSet: Set<string>;
  onPrev: () => void;
  onNext: () => void;
  onSelectDate: React.Dispatch<React.SetStateAction<Date | null>>;
}

function CalendarCard({
  currentMonth,
  direction,
  days,
  startDow,
  today,
  selectedDate,
  tasksByDay,
  completedSet,
  onPrev,
  onNext,
  onSelectDate,
}: CalendarCardProps) {
  const ACCENT = "#7c3aed";

  return (
    <div
      className="rounded-[2rem]"
      style={{
        background: "linear-gradient(135deg, #ede9fe, #dbeafe)",
        border: "1px solid rgba(124,58,237,0.2)",
        boxShadow:
          "0 8px 32px -8px rgba(124,58,237,0.18), 0 2px 8px -2px rgba(124,58,237,0.10)",
        padding: "3px",
      }}
    >
      <div
        className="rounded-[calc(2rem-3px)] p-4"
        style={{
          background: "rgba(255,255,255,0.97)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)",
        }}
      >
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <MonthNavButton dir="prev" onClick={onPrev} accent={ACCENT} />
          <AnimatePresence mode="wait" custom={direction}>
            <m.h2
              key={currentMonth.toISOString()}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, y: d > 0 ? 10 : -10 }),
                center: {
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring", stiffness: 320, damping: 26 },
                },
                exit: (d: number) => ({
                  opacity: 0,
                  y: d > 0 ? -10 : 10,
                  transition: { duration: 0.15 },
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              className="font-fredoka text-xl font-bold text-gray-800 capitalize"
            >
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </m.h2>
          </AnimatePresence>
          <MonthNavButton dir="next" onClick={onNext} accent={ACCENT} />
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-center mb-2">
          {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
            <span
              key={d}
              className="font-fredoka text-xs font-bold uppercase py-1"
              style={{ color: DOW_COLORS[i] }}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Day grid */}
        <AnimatePresence mode="wait" custom={direction}>
          <m.div
            key={currentMonth.toISOString()}
            custom={direction}
            variants={{
              enter: (d: number) => ({
                opacity: 0,
                x: d * 30,
                filter: "blur(4px)",
              }),
              center: {
                opacity: 1,
                x: 0,
                filter: "blur(0px)",
                transition: { type: "spring", stiffness: 280, damping: 28 },
              },
              exit: (d: number) => ({
                opacity: 0,
                x: d * -30,
                filter: "blur(4px)",
                transition: { duration: 0.15 },
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            className="grid grid-cols-7 gap-y-1"
          >
            {Array.from({ length: startDow }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {days.map((day) => (
              <DayCell
                key={day.toISOString().slice(0, 10)}
                day={day}
                today={today}
                selectedDate={selectedDate}
                tasksByDay={tasksByDay}
                completedSet={completedSet}
                onSelect={onSelectDate}
              />
            ))}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Month nav button ───────────────────────────────────────────────────────────

function MonthNavButton({
  dir,
  onClick,
  accent,
}: {
  dir: "prev" | "next";
  onClick: () => void;
  accent: string;
}) {
  return (
    <m.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.88 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="size-9 flex items-center justify-center rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
        border: `1px solid ${accent}30`,
      }}
      aria-label={dir === "prev" ? "Mes anterior" : "Mes siguiente"}
    >
      {dir === "prev" ? (
        <ChevronLeft className="size-5" style={{ color: accent }} />
      ) : (
        <ChevronRight className="size-5" style={{ color: accent }} />
      )}
    </m.button>
  );
}

// ── Day cell ──────────────────────────────────────────────────────────────────

interface DayCellProps {
  day: Date;
  today: Date;
  selectedDate: Date | null;
  tasksByDay: Map<string, Task[]>;
  completedSet: Set<string>;
  onSelect: React.Dispatch<React.SetStateAction<Date | null>>;
}

function DayCell({ day, today, selectedDate, tasksByDay, completedSet, onSelect }: DayCellProps) {
  const dayStr = day.toISOString().slice(0, 10);
  const isToday = isSameDay(day, today);
  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
  const dayTasks = tasksByDay.get(dayStr) ?? [];
  const hasTasks = dayTasks.length > 0;
  const allDone = hasTasks && dayTasks.every((t) => completedSet.has(`${t.id}:${dayStr}`));
  const dots = dayTasks.slice(0, 3).map((t) => GROUP_COLORS[timeGroup(t.due_time)].accent);

  const cellRef = useRef<HTMLButtonElement>(null);

  function handleClick() {
    onSelect((prev) => (prev && isSameDay(prev, day) ? null : day));
    if (typeof window !== "undefined" && cellRef.current) {
      import("animejs").then(({ animate }) => {
        animate(cellRef.current!, {
          scale: [1, 1.12, 1],
          duration: 320,
          ease: "outElastic(1, 0.5)",
        });
      });
    }
  }

  let outerStyle: React.CSSProperties = {};
  let textClass = "text-gray-700";

  if (isSelected) {
    outerStyle = {
      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
      boxShadow: "0 4px 12px -2px rgba(124,58,237,0.45)",
    };
    textClass = "text-white";
  } else if (allDone) {
    outerStyle = {
      background: "#ecfdf5",
      outline: "1.5px solid rgba(16,185,129,0.4)",
      outlineOffset: "-1.5px",
    };
    textClass = "text-emerald-700";
  } else if (isToday) {
    outerStyle = {
      outline: "2px solid #F59E0B",
      outlineOffset: "-2px",
    };
    textClass = "text-amber-700";
  } else if (hasTasks) {
    const firstGroup = timeGroup(dayTasks[0]?.due_time ?? null);
    outerStyle = { background: GROUP_COLORS[firstGroup].bg };
  }

  return (
    <button
      ref={cellRef}
      onClick={handleClick}
      className={`relative flex flex-col items-center py-1.5 rounded-2xl transition-colors ${textClass}`}
      style={outerStyle}
      suppressHydrationWarning
    >
      <span className="font-fredoka text-sm font-semibold leading-none">{format(day, "d")}</span>

      {allDone && (
        <span
          className="mt-0.5 font-fredoka text-[10px] font-bold leading-none text-emerald-500 animate-pop-in"
          style={{ display: "block" }}
        >
          ✓
        </span>
      )}

      {!allDone && hasTasks && (
        <span className="mt-1 flex gap-0.5">
          {dots.map((color, i) => (
            <span
              key={i}
              className="size-1.5 rounded-full"
              style={{ background: isSelected ? "rgba(255,255,255,0.75)" : color }}
            />
          ))}
        </span>
      )}
    </button>
  );
}

// ── Selected date panel ────────────────────────────────────────────────────────

function SelectedDatePanel({
  date,
  tasks,
  completedSet,
  dateStr,
}: {
  date: Date;
  tasks: Task[];
  completedSet: Set<string>;
  dateStr: string;
}) {
  const isEmpty = tasks.length === 0;

  const dominantGroup = useMemo((): Group => {
    if (tasks.length === 0) return "anytime";
    const counts: Partial<Record<Group, number>> = {};
    tasks.forEach((t) => {
      const g = timeGroup(t.due_time);
      counts[g] = (counts[g] ?? 0) + 1;
    });
    return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "anytime") as Group;
  }, [tasks]);

  const doneCount = tasks.filter((t) => completedSet.has(`${t.id}:${dateStr}`)).length;
  const { accent } = GROUP_COLORS[dominantGroup];

  return (
    <m.div
      initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
      animate={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { type: "spring", stiffness: 260, damping: 24 },
      }}
      exit={{ opacity: 0, y: 20, filter: "blur(4px)", transition: { duration: 0.18 } }}
      className="rounded-[2rem]"
      style={{
        background: GROUP_COLORS[dominantGroup].bg,
        border: `1px solid ${accent}33`,
        boxShadow: `0 8px 24px -8px ${accent}30`,
        padding: "3px",
      }}
    >
      <div
        className="rounded-[calc(2rem-3px)] p-4 space-y-3"
        style={{
          background: "rgba(255,255,255,0.97)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)",
        }}
      >
        {/* Panel header */}
        <div>
          <h3 className="font-fredoka text-lg font-bold text-gray-800 capitalize">
            {GROUP_EMOJI[dominantGroup]}{" "}
            {format(date, "EEEE d 'de' MMMM", { locale: es })}
          </h3>
          {!isEmpty && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="h-1.5 w-28 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(doneCount / tasks.length) * 100}%`,
                    background: `linear-gradient(90deg, ${accent}, ${darkenHex(accent)})`,
                  }}
                />
              </div>
              <span className="font-fredoka text-xs font-bold" style={{ color: accent }}>
                {doneCount}/{tasks.length} misiones
              </span>
            </div>
          )}
        </div>

        {/* Task list */}
        {isEmpty ? (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-8 gap-3"
          >
            <span className="text-5xl">🚀</span>
            <p className="font-fredoka text-base font-semibold text-gray-400">
              Sin misiones este día
            </p>
          </m.div>
        ) : (
          <m.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {tasks.map((task) => (
              <CalendarTaskItem
                key={task.id}
                task={task}
                isDone={completedSet.has(`${task.id}:${dateStr}`)}
              />
            ))}
          </m.div>
        )}
      </div>
    </m.div>
  );
}

// ── Task item (read-only, mirrors today-client TaskItem) ───────────────────────

function CalendarTaskItem({ task, isDone }: { task: Task; isDone: boolean }) {
  const group = timeGroup(task.due_time);
  const { accent, bg } = GROUP_COLORS[group];

  return (
    <m.div
      variants={cardVariants}
      className="rounded-[2rem]"
      style={{
        background: isDone ? "#ecfdf5" : bg,
        border: `1px solid ${isDone ? "#10b98133" : accent + "33"}`,
        boxShadow: `0 4px 20px -4px ${isDone ? "rgba(16,185,129,0.18)" : accent + "40"}`,
        opacity: isDone ? 0.82 : 1,
      }}
    >
      <div
        className="flex items-center gap-3 p-3 relative overflow-hidden"
        style={{
          borderRadius: "calc(2rem - 0.375rem)",
          background: isDone ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.95)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)",
        }}
      >
        {/* Shimmer on pending */}
        {!isDone && (
          <div
            className="animate-shimmer pointer-events-none absolute inset-0"
            style={{ borderRadius: "inherit", zIndex: 0 }}
            aria-hidden
          />
        )}

        {/* Emoji bubble */}
        <div
          className="relative z-10 shrink-0 size-14 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: isDone ? "#ecfdf5" : bg }}
        >
          {task.emoji ?? "⭐"}
          {isDone && (
            <span
              className="animate-pop-in absolute inset-0 flex items-center justify-center rounded-2xl text-xl font-black text-emerald-600"
              style={{ background: "rgba(236,253,245,0.88)" }}
            >
              ✓
            </span>
          )}
        </div>

        {/* Text */}
        <div className="relative z-10 flex-1 min-w-0">
          <p
            className={`font-fredoka text-base font-semibold leading-tight ${
              isDone ? "line-through text-gray-400" : "text-gray-800"
            }`}
          >
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {task.due_time && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="size-3" />
                {task.due_time.slice(0, 5)}
              </span>
            )}
            <span className="text-xs font-bold text-amber-500">⭐ {task.points} pts</span>
          </div>
        </div>

        {/* Done indicator */}
        {isDone && (
          <div className="relative z-10 shrink-0">
            <m.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <CheckCircle2 className="size-9 text-emerald-500" />
            </m.div>
          </div>
        )}
      </div>
    </m.div>
  );
}

// ── No day prompt ──────────────────────────────────────────────────────────────

function NoDayPrompt() {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="flex flex-col items-center justify-center py-10 gap-3"
    >
      <m.span
        className="text-5xl"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        👆
      </m.span>
      <p className="font-fredoka text-base font-semibold text-amber-700/60 text-center">
        Toca un día para ver tus misiones
      </p>
    </m.div>
  );
}
