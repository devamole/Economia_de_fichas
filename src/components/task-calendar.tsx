"use client";

import { useState, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, format,
  isSameDay, isSameMonth, addMonths, subMonths, parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { getTasksForDate } from "@/lib/recurrence";
import type { Task, Profile } from "@/types";

type CompletionMeta = { task_id: string; completion_date: string };

const EMPTY_COMPLETIONS: CompletionMeta[] = [];
const EMPTY_KIDS: Pick<Profile, "id" | "display_name" | "emoji">[] = [];

interface TaskCalendarProps {
  tasks: Task[];
  completions?: CompletionMeta[];
  kids?: Pick<Profile, "id" | "display_name" | "emoji">[];
  onAddTaskForDate?: (date: string) => void;
  isParent?: boolean;
  todayStr?: string;
}

export function TaskCalendar({
  tasks,
  completions = EMPTY_COMPLETIONS,
  kids = EMPTY_KIDS,
  onAddTaskForDate,
  isParent = false,
  todayStr,
}: TaskCalendarProps) {
  const today = useMemo(() => (todayStr ? parseISO(todayStr) : new Date()), [todayStr]);
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  const completedTaskIds = useMemo(
    () => new Set(completions.map((c) => `${c.task_id}:${c.completion_date}`)),
    [completions],
  );

  // Days in the current month grid
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Task occurrence count per day (memoized)
  const taskCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    days.forEach((day) => {
      const count = getTasksForDate(tasks, day).length;
      if (count > 0) map.set(day.toISOString().slice(0, 10), count);
    });
    return map;
  }, [days, tasks]);

  const selectedTasks = useMemo(
    () => (selectedDate ? getTasksForDate(tasks, selectedDate) : []),
    [selectedDate, tasks],
  );

  const selectedDateStr = selectedDate?.toISOString().slice(0, 10);

  // Leading blank days for the month grid (Monday start)
  const startDow = (getDay(startOfMonth(currentMonth)) + 6) % 7; // 0=Mon

  return (
    <div className="flex flex-col gap-4">
      {/* Month header */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="size-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="size-5" />
        </button>
        <m.h2
          key={currentMonth.toISOString()}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display font-semibold text-lg capitalize"
        >
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </m.h2>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="size-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Weekday headers — Mon to Sun */}
      <div className="grid grid-cols-7 text-center">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <span key={d} className="text-xs font-semibold text-muted-foreground py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Day cells */}
      <AnimatePresence mode="wait">
        <m.div
          key={currentMonth.toISOString()}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-7 gap-y-1"
        >
          {Array.from({ length: startDow }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((day) => {
            const key = day.toISOString().slice(0, 10);
            const count = taskCountByDay.get(key) ?? 0;
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const isToday = isSameDay(day, today);

            return (
              <button
                key={key}
                suppressHydrationWarning
                onClick={() => setSelectedDate((prev) => (prev && isSameDay(prev, day) ? null : day))}
                className={`relative flex flex-col items-center py-1.5 rounded-2xl transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                    ? "bg-primary/15 text-primary"
                    : "hover:bg-muted"
                } ${!isSameMonth(day, currentMonth) ? "opacity-30" : ""}`}
              >
                <span className="text-sm font-medium leading-none">{format(day, "d")}</span>
                {count > 0 && (
                  <span
                    className={`mt-1 flex gap-0.5 ${isSelected ? "opacity-80" : ""}`}
                  >
                    {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                      <span
                        key={i}
                        className={`size-1.5 rounded-full ${
                          isSelected ? "bg-primary-foreground" : "bg-primary"
                        }`}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </m.div>
      </AnimatePresence>

      {/* Selected day panel */}
      <AnimatePresence>
        {selectedDate && (
          <m.div
            key={selectedDateStr}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-2xl border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold capitalize">
                {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </h3>
              <div className="flex gap-2">
                {isParent && onAddTaskForDate && (
                  <button
                    onClick={() => onAddTaskForDate(selectedDateStr!)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    + Añadir tarea
                  </button>
                )}
                <button onClick={() => setSelectedDate(null)}>
                  <X className="size-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {selectedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin tareas este día.</p>
            ) : (
              <ul className="space-y-2">
                {selectedTasks.map((task) => {
                  const isDone = selectedDateStr
                    ? completedTaskIds.has(`${task.id}:${selectedDateStr}`)
                    : false;
                  const kid = kids.find((k) => k.id === task.assigned_to);

                  return (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="text-xl">{task.emoji ?? "✅"}</span>
                      <span className={`flex-1 truncate ${isDone ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </span>
                      {kid && isParent && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {kid.emoji} {kid.display_name}
                        </span>
                      )}
                      <span className="text-xs font-bold text-primary shrink-0">
                        {task.points} pts
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
