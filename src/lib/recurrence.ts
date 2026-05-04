import { parseISO, isWithinInterval, getDay, isSameDay, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { Task } from "@/types";

/**
 * Returns `date` converted to the family's local date (YYYY-MM-DD) using
 * the given IANA timezone. No `new Date()` inside — always call with explicit now.
 */
export function toLocalDate(utcDate: Date, timezone: string): Date {
  return toZonedTime(utcDate, timezone);
}

/**
 * Whether a task occurs on a specific local date.
 * `localDate` must already be in the family's timezone.
 */
export function taskOccursOn(task: Task, localDate: Date): boolean {
  if (!task.active) return false;

  const start = startOfDay(parseISO(task.start_date));
  const local = startOfDay(localDate);

  if (local < start) return false;
  if (task.end_date) {
    const end = startOfDay(parseISO(task.end_date));
    if (local > end) return false;
  }

  switch (task.recurrence_type) {
    case "once":
      return isSameDay(local, start);

    case "daily":
      return true;

    case "weekly": {
      const days = (task.recurrence_days as number[] | null) ?? [];
      const dow = getDay(local); // 0=Sun … 6=Sat
      return days.includes(dow);
    }

    case "custom": {
      const days = (task.recurrence_days as number[] | null) ?? [];
      const dow = getDay(local);
      return days.includes(dow);
    }

    default:
      return false;
  }
}

/** Filter tasks that occur on a given local date. */
export function getTasksForDate(tasks: Task[], localDate: Date): Task[] {
  return tasks.filter((t) => taskOccursOn(t, localDate));
}

/**
 * Returns a map of ISO-date-string → Task[] for each day in [from, to].
 * `from` and `to` must be local dates in the family timezone.
 */
export function getTasksForDateRange(
  tasks: Task[],
  from: Date,
  to: Date,
): Map<string, Task[]> {
  const result = new Map<string, Task[]>();
  const current = startOfDay(from);
  const end = startOfDay(to);

  while (current <= end) {
    const key = current.toISOString().slice(0, 10);
    result.set(key, getTasksForDate(tasks, current));
    current.setDate(current.getDate() + 1);
  }

  return result;
}
