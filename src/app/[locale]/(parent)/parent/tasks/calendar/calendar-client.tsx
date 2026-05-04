"use client";

import { useState } from "react";
import { TaskCalendar } from "@/components/task-calendar";
import { TaskForm } from "@/components/task-form";
import type { Task, Profile } from "@/types";

type CompletionMeta = { task_id: string; completion_date: string };

interface ParentCalendarClientProps {
  tasks: Task[];
  completions: CompletionMeta[];
  kids: Pick<Profile, "id" | "display_name" | "emoji">[];
}

export function ParentCalendarClient({ tasks, completions, kids }: ParentCalendarClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [initialStartDate, setInitialStartDate] = useState<string | undefined>();

  function handleAddTaskForDate(date: string) {
    setInitialStartDate(date);
    setFormOpen(true);
  }

  return (
    <>
      <TaskCalendar
        tasks={tasks}
        completions={completions}
        kids={kids}
        isParent
        onAddTaskForDate={handleAddTaskForDate}
      />
      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        kids={kids}
        initialStartDate={initialStartDate}
      />
    </>
  );
}
