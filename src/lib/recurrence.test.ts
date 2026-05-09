import { describe, it, expect } from "vitest";
import { parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import {
  taskOccursOn,
  getTasksForDate,
  getTasksForDateRange,
  getNextTaskOccurrence,
} from "./recurrence";
import type { Task } from "@/types";

const TZ = "America/Bogota"; // UTC-5

function localDate(isoDate: string): Date {
  return toZonedTime(parseISO(isoDate + "T12:00:00Z"), TZ);
}

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: "test-id",
    family_id: "fam",
    assigned_to: "kid",
    created_by: "parent",
    title: "Test task",
    description: null,
    points: 10,
    emoji: "✅",
    recurrence_type: "daily",
    recurrence_days: null,
    due_time: null,
    start_date: "2025-01-01",
    end_date: null,
    requires_approval: false,
    active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("taskOccursOn", () => {
  it("inactive tasks never occur", () => {
    const task = makeTask({ active: false, recurrence_type: "daily" });
    expect(taskOccursOn(task, localDate("2025-06-01"))).toBe(false);
  });

  it("once: only on start_date", () => {
    const task = makeTask({ recurrence_type: "once", start_date: "2025-06-15" });
    expect(taskOccursOn(task, localDate("2025-06-15"))).toBe(true);
    expect(taskOccursOn(task, localDate("2025-06-14"))).toBe(false);
    expect(taskOccursOn(task, localDate("2025-06-16"))).toBe(false);
  });

  it("daily: every day on or after start_date", () => {
    const task = makeTask({ recurrence_type: "daily", start_date: "2025-06-10" });
    expect(taskOccursOn(task, localDate("2025-06-09"))).toBe(false);
    expect(taskOccursOn(task, localDate("2025-06-10"))).toBe(true);
    expect(taskOccursOn(task, localDate("2025-12-31"))).toBe(true);
  });

  it("daily: stops after end_date", () => {
    const task = makeTask({ recurrence_type: "daily", start_date: "2025-01-01", end_date: "2025-01-05" });
    expect(taskOccursOn(task, localDate("2025-01-05"))).toBe(true);
    expect(taskOccursOn(task, localDate("2025-01-06"))).toBe(false);
  });

  it("weekly: only on specified day-of-week (1=Mon)", () => {
    // Jan 6 2025 is a Monday (dow=1)
    const task = makeTask({
      recurrence_type: "weekly",
      recurrence_days: [1],
      start_date: "2025-01-01",
    });
    expect(taskOccursOn(task, localDate("2025-01-06"))).toBe(true); // Monday
    expect(taskOccursOn(task, localDate("2025-01-07"))).toBe(false); // Tuesday
    expect(taskOccursOn(task, localDate("2025-01-13"))).toBe(true); // Next Monday
  });

  it("custom: multiple days of week", () => {
    const task = makeTask({
      recurrence_type: "custom",
      recurrence_days: [1, 3, 5], // Mon, Wed, Fri
      start_date: "2025-01-01",
    });
    expect(taskOccursOn(task, localDate("2025-01-06"))).toBe(true); // Mon
    expect(taskOccursOn(task, localDate("2025-01-07"))).toBe(false); // Tue
    expect(taskOccursOn(task, localDate("2025-01-08"))).toBe(true); // Wed
    expect(taskOccursOn(task, localDate("2025-01-09"))).toBe(false); // Thu
    expect(taskOccursOn(task, localDate("2025-01-10"))).toBe(true); // Fri
  });

  it("does not occur before start_date", () => {
    const task = makeTask({ recurrence_type: "daily", start_date: "2025-06-15" });
    expect(taskOccursOn(task, localDate("2025-06-14"))).toBe(false);
  });

  it("timezone edge: UTC midnight vs Bogota previous day", () => {
    // 2025-06-15T04:00:00Z = 2025-06-14T23:00:00 America/Bogota
    const utcMidnight = new Date("2025-06-15T04:00:00Z");
    const localBogota = toZonedTime(utcMidnight, TZ);
    const task = makeTask({ recurrence_type: "once", start_date: "2025-06-14" });
    // In Bogota, this is still June 14
    expect(taskOccursOn(task, localBogota)).toBe(true);
  });
});

describe("getTasksForDate", () => {
  it("returns only tasks occurring on the given date", () => {
    const daily = makeTask({ id: "daily", recurrence_type: "daily", start_date: "2025-01-01" });
    const once = makeTask({ id: "once", recurrence_type: "once", start_date: "2025-06-15" });
    const result = getTasksForDate([daily, once], localDate("2025-01-10"));
    expect(result.map((t) => t.id)).toEqual(["daily"]);
  });
});

describe("getTasksForDateRange", () => {
  it("maps each date in range to its tasks", () => {
    const task = makeTask({ recurrence_type: "daily", start_date: "2025-01-01" });
    const from = localDate("2025-01-01");
    const to = localDate("2025-01-03");
    const map = getTasksForDateRange([task], from, to);
    expect(map.size).toBe(3);
    expect(map.get("2025-01-01")).toHaveLength(1);
    expect(map.get("2025-01-02")).toHaveLength(1);
    expect(map.get("2025-01-03")).toHaveLength(1);
  });

  it("excludes inactive tasks from range", () => {
    const task = makeTask({ active: false, recurrence_type: "daily", start_date: "2025-01-01" });
    const map = getTasksForDateRange([task], localDate("2025-01-01"), localDate("2025-01-02"));
    expect(map.get("2025-01-01")).toHaveLength(0);
  });
});

describe("getNextTaskOccurrence", () => {
  it("returns today for daily tasks already started", () => {
    const task = makeTask({ recurrence_type: "daily", start_date: "2025-01-01" });
    expect(getNextTaskOccurrence(task, localDate("2025-01-10"))?.toISOString().slice(0, 10)).toBe(
      "2025-01-10",
    );
  });

  it("returns the next matching weekday for weekly tasks", () => {
    const task = makeTask({
      recurrence_type: "weekly",
      recurrence_days: [1],
      start_date: "2025-01-01",
    });

    expect(getNextTaskOccurrence(task, localDate("2025-01-07"))?.toISOString().slice(0, 10)).toBe(
      "2025-01-13",
    );
  });

  it("returns null when a once task is already in the past", () => {
    const task = makeTask({ recurrence_type: "once", start_date: "2025-01-05" });
    expect(getNextTaskOccurrence(task, localDate("2025-01-10"))).toBeNull();
  });

  it("returns null when no matching custom day exists before end_date", () => {
    const task = makeTask({
      recurrence_type: "custom",
      recurrence_days: [5],
      start_date: "2025-01-01",
      end_date: "2025-01-02",
    });

    expect(getNextTaskOccurrence(task, localDate("2025-01-01"))).toBeNull();
  });
});
