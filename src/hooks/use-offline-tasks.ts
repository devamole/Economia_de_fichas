"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/offline/db";
import { getTasksForDate } from "@/lib/recurrence";
import type { Task, TaskCompletion } from "@/types";

export function useOfflineTasks(date: Date, dateStr: string) {
  const rawTasks = useLiveQuery(() => db.tasks.toArray(), []);

  const completions = useLiveQuery(
    () => db.task_completions.where("completion_date").equals(dateStr).toArray(),
    [dateStr],
  );

  const tasks = useMemo(
    () => (rawTasks ? getTasksForDate(rawTasks as Task[], date) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawTasks, dateStr],
  );

  const pendingCompletedIds = useMemo(
    () =>
      new Set(
        (completions ?? []).filter((c) => c.pending_sync).map((c) => c.task_id),
      ),
    [completions],
  );

  return {
    tasks,
    completions: (completions ?? []) as TaskCompletion[],
    pendingCompletedIds,
    isReady: rawTasks !== undefined,
  };
}
