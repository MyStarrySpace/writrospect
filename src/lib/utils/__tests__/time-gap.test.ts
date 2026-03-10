import { describe, it, expect } from "vitest";
import {
  detectTimeGap,
  looksLikeNewEntry,
  hasTasksNeedingAttention,
  checkTaskDeadlines,
  type TimeGapInfo,
  type TaskDeadlineInfo,
} from "../time-gap";

describe("detectTimeGap", () => {
  function hoursAgo(hours: number, from?: Date): Date {
    const base = from || new Date();
    return new Date(base.getTime() - hours * 60 * 60 * 1000);
  }

  it("returns no gap for less than 2 hours", () => {
    const now = new Date();
    const result = detectTimeGap(hoursAgo(1, now), now);
    expect(result.hasGap).toBe(false);
    expect(result.gapType).toBe("none");
    expect(result.suggestNewEntry).toBe(false);
  });

  it("returns short_break for 2-5 hours", () => {
    const now = new Date();
    const result = detectTimeGap(hoursAgo(3, now), now);
    expect(result.hasGap).toBe(true);
    expect(result.gapType).toBe("short_break");
    expect(result.suggestNewEntry).toBe(false);
  });

  it("detects sleep cycle (late night to morning)", () => {
    // Last message at 11pm, current at 7am next day = 8 hours, sleep pattern
    const lastNight = new Date(2024, 0, 1, 23, 0); // 11pm
    const nextMorning = new Date(2024, 0, 2, 7, 0); // 7am next day
    const result = detectTimeGap(lastNight, nextMorning);
    expect(result.hasGap).toBe(true);
    expect(result.gapType).toBe("sleep_cycle");
    expect(result.suggestNewEntry).toBe(true);
    expect(result.description).toContain("Good morning");
  });

  it("returns short_break for 5-12 hours when not a sleep pattern", () => {
    // 10am to 4pm = 6 hours, but not a sleep pattern
    const morning = new Date(2024, 0, 1, 10, 0);
    const afternoon = new Date(2024, 0, 1, 16, 0);
    const result = detectTimeGap(morning, afternoon);
    expect(result.hasGap).toBe(true);
    expect(result.gapType).toBe("short_break");
    expect(result.suggestNewEntry).toBe(false);
  });

  it("returns new_day for 12-24 hours", () => {
    const now = new Date();
    const result = detectTimeGap(hoursAgo(18, now), now);
    expect(result.hasGap).toBe(true);
    expect(result.gapType).toBe("new_day");
    expect(result.suggestNewEntry).toBe(true);
  });

  it("returns long_absence for 24+ hours", () => {
    const now = new Date();
    const result = detectTimeGap(hoursAgo(48, now), now);
    expect(result.hasGap).toBe(true);
    expect(result.gapType).toBe("long_absence");
    expect(result.suggestNewEntry).toBe(true);
    expect(result.description).toContain("2 days");
  });

  it("correctly reports hours elapsed", () => {
    const now = new Date();
    const result = detectTimeGap(hoursAgo(3, now), now);
    expect(result.hoursElapsed).toBeCloseTo(3, 0);
  });

  it("handles singular day in long_absence", () => {
    const now = new Date();
    const result = detectTimeGap(hoursAgo(30, now), now);
    expect(result.description).toContain("1 day");
    expect(result.description).not.toContain("1 days");
  });
});

describe("looksLikeNewEntry", () => {
  it("returns true for long messages (>300 chars)", () => {
    const longMessage = "a".repeat(301);
    expect(looksLikeNewEntry(longMessage)).toBe(true);
  });

  it("returns true for messages starting with time indicators", () => {
    expect(looksLikeNewEntry("This morning I went for a run")).toBe(true);
    expect(looksLikeNewEntry("Today was really productive")).toBe(true);
    expect(looksLikeNewEntry("Yesterday I had a tough conversation")).toBe(true);
    expect(looksLikeNewEntry("Woke up feeling great")).toBe(true);
    expect(looksLikeNewEntry("Feeling much better today")).toBe(true);
    expect(looksLikeNewEntry("Update: finished the project")).toBe(true);
  });

  it("returns true for multi-sentence messages with emotional content", () => {
    const emotional =
      "Had a really long day. I feel exhausted from work. The project deadline is stressing me out.";
    expect(looksLikeNewEntry(emotional)).toBe(true);
  });

  it("returns false for short conversational messages", () => {
    expect(looksLikeNewEntry("ok")).toBe(false);
    expect(looksLikeNewEntry("thanks!")).toBe(false);
    expect(looksLikeNewEntry("what do you think?")).toBe(false);
    expect(looksLikeNewEntry("can you help me with something?")).toBe(false);
  });

  it("returns false for short messages without emotional content", () => {
    expect(looksLikeNewEntry("The weather is nice. I went outside. Had lunch.")).toBe(
      false
    );
  });
});

describe("checkTaskDeadlines", () => {
  function makeTask(overrides: Record<string, unknown>) {
    return {
      id: "test-1",
      what: "Test task",
      dueDate: null,
      dueTime: null,
      urgency: "normal" as const,
      context: null,
      userId: "user-1",
      why: null,
      how: null,
      status: "active" as const,
      priority: 0,
      complexity: 3,
      estimatedMinutes: null,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      ...overrides,
    };
  }

  it("categorizes overdue tasks (due before today)", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const result = checkTaskDeadlines([
      makeTask({ id: "overdue", what: "Overdue task", dueDate: yesterday }),
    ]);

    expect(result.overdueTasks).toHaveLength(1);
    expect(result.overdueTasks[0].what).toBe("Overdue task");
  });

  it("categorizes tasks due today", () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Noon today

    const result = checkTaskDeadlines([
      makeTask({ id: "today", what: "Today task", dueDate: today }),
    ]);

    expect(result.dueTodayTasks).toHaveLength(1);
    expect(result.dueTodayTasks[0].what).toBe("Today task");
  });

  it('categorizes tasks with urgency "now"', () => {
    const result = checkTaskDeadlines([
      makeTask({ id: "urgent", what: "Urgent task", urgency: "now" }),
    ]);

    expect(result.urgentNowTasks).toHaveLength(1);
    expect(result.urgentNowTasks[0].what).toBe("Urgent task");
  });

  it('categorizes tasks with urgency "today" and no due date as due today', () => {
    const result = checkTaskDeadlines([
      makeTask({ id: "today-urgency", what: "Today urgency", urgency: "today" }),
    ]);

    expect(result.dueTodayTasks).toHaveLength(1);
  });

  it("categorizes upcoming tasks (due tomorrow)", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);

    const result = checkTaskDeadlines([
      makeTask({ id: "tomorrow", what: "Tomorrow task", dueDate: tomorrow }),
    ]);

    expect(result.upcomingTasks).toHaveLength(1);
  });

  it("returns empty arrays when no tasks need attention", () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const result = checkTaskDeadlines([
      makeTask({ id: "future", what: "Future task", dueDate: nextWeek }),
    ]);

    expect(result.overdueTasks).toHaveLength(0);
    expect(result.dueTodayTasks).toHaveLength(0);
    expect(result.upcomingTasks).toHaveLength(0);
    expect(result.urgentNowTasks).toHaveLength(0);
  });
});

describe("hasTasksNeedingAttention", () => {
  const emptyInfo: TaskDeadlineInfo = {
    overdueTasks: [],
    dueTodayTasks: [],
    upcomingTasks: [],
    urgentNowTasks: [],
  };

  it("returns false when no tasks need attention", () => {
    expect(hasTasksNeedingAttention(emptyInfo)).toBe(false);
  });

  it("returns true when there are urgent tasks", () => {
    expect(
      hasTasksNeedingAttention({
        ...emptyInfo,
        urgentNowTasks: [
          { id: "1", what: "test", dueDate: null, dueTime: null, urgency: "now" as const, context: null },
        ],
      })
    ).toBe(true);
  });

  it("returns true when there are overdue tasks", () => {
    expect(
      hasTasksNeedingAttention({
        ...emptyInfo,
        overdueTasks: [
          { id: "1", what: "test", dueDate: new Date(), dueTime: null, urgency: "normal" as const, context: null },
        ],
      })
    ).toBe(true);
  });
});
