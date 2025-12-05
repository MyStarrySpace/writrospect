// Time gap detection utilities for chat sessions

import { Task, TaskUrgency } from "@prisma/client";

export interface TimeGapInfo {
  hasGap: boolean;
  hoursElapsed: number;
  description: string;
  // What kind of gap is it?
  gapType: "none" | "short_break" | "sleep_cycle" | "new_day" | "long_absence";
  // Should we suggest a new entry?
  suggestNewEntry: boolean;
}

// Task deadline status
export interface TaskDeadlineInfo {
  overdueTasks: TaskWithDeadline[];
  dueTodayTasks: TaskWithDeadline[];
  upcomingTasks: TaskWithDeadline[]; // Due within next 24 hours
  urgentNowTasks: TaskWithDeadline[]; // Urgency = "now"
}

export interface TaskWithDeadline {
  id: string;
  what: string;
  dueDate: Date | null;
  dueTime: string | null;
  urgency: TaskUrgency;
  context: string | null;
}

// Detect time gap between chat messages or entries
export function detectTimeGap(
  lastTimestamp: Date,
  currentTimestamp: Date = new Date()
): TimeGapInfo {
  const diffMs = currentTimestamp.getTime() - lastTimestamp.getTime();
  const hoursElapsed = diffMs / (1000 * 60 * 60);

  // No significant gap (< 2 hours)
  if (hoursElapsed < 2) {
    return {
      hasGap: false,
      hoursElapsed,
      description: "Continuing conversation",
      gapType: "none",
      suggestNewEntry: false,
    };
  }

  // Short break (2-5 hours)
  if (hoursElapsed < 5) {
    return {
      hasGap: true,
      hoursElapsed,
      description: `${Math.round(hoursElapsed)} hours since last message`,
      gapType: "short_break",
      suggestNewEntry: false,
    };
  }

  // Sleep cycle or long break (5-12 hours)
  if (hoursElapsed < 12) {
    // Check if this looks like a sleep cycle (late night -> morning)
    const lastHour = lastTimestamp.getHours();
    const currentHour = currentTimestamp.getHours();
    const isSleepCycle =
      (lastHour >= 22 || lastHour <= 3) && // Last message was late night
      (currentHour >= 5 && currentHour <= 12); // Current is morning

    return {
      hasGap: true,
      hoursElapsed,
      description: isSleepCycle
        ? "Good morning! Looks like you got some sleep."
        : `${Math.round(hoursElapsed)} hours since last message`,
      gapType: isSleepCycle ? "sleep_cycle" : "short_break",
      suggestNewEntry: isSleepCycle, // Suggest new entry after sleep
    };
  }

  // New day (12-24 hours)
  if (hoursElapsed < 24) {
    return {
      hasGap: true,
      hoursElapsed,
      description: "It's been a while! A lot can change in half a day.",
      gapType: "new_day",
      suggestNewEntry: true,
    };
  }

  // Long absence (> 24 hours)
  const daysElapsed = Math.floor(hoursElapsed / 24);
  return {
    hasGap: true,
    hoursElapsed,
    description: `It's been ${daysElapsed} day${daysElapsed > 1 ? 's' : ''} since we last chatted.`,
    gapType: "long_absence",
    suggestNewEntry: true,
  };
}

// Check if a message looks like it might be a new journal entry rather than a chat continuation
export function looksLikeNewEntry(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();

  // Length check - long messages are more likely to be entries
  if (message.length > 300) return true;

  // Starts with time indicators
  const timeStarters = [
    /^(this morning|today|yesterday|last night|earlier|just now)/i,
    /^(woke up|got up|couldn't sleep|finally)/i,
    /^(feeling|i feel|i'm feeling|i am feeling)/i,
    /^(so much has happened|a lot happened|things have)/i,
    /^(update:|check-in:|entry:)/i,
  ];
  if (timeStarters.some(pattern => pattern.test(lowerMessage))) return true;

  // Contains multiple sentences and emotional content
  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length >= 3) {
    const emotionalWords = [
      'feel', 'feeling', 'felt', 'anxious', 'stressed', 'overwhelmed',
      'happy', 'sad', 'frustrated', 'tired', 'exhausted', 'excited',
      'worried', 'nervous', 'proud', 'disappointed', 'angry'
    ];
    const hasEmotionalContent = emotionalWords.some(word => lowerMessage.includes(word));
    if (hasEmotionalContent) return true;
  }

  return false;
}

// Generate context string for the AI about the time gap
export function getTimeGapContextForAI(
  gapInfo: TimeGapInfo,
  entryCreatedAt: Date,
  lastChatAt?: Date
): string {
  const parts: string[] = [];

  // Time since entry was created
  const entrySinceHours = (Date.now() - entryCreatedAt.getTime()) / (1000 * 60 * 60);
  if (entrySinceHours > 12) {
    const entryDaysAgo = Math.floor(entrySinceHours / 24);
    if (entryDaysAgo > 0) {
      parts.push(`This journal entry was written ${entryDaysAgo} day${entryDaysAgo > 1 ? 's' : ''} ago.`);
    } else {
      parts.push(`This journal entry was written ${Math.round(entrySinceHours)} hours ago.`);
    }
  }

  // Time gap context
  if (gapInfo.hasGap) {
    parts.push(gapInfo.description);

    if (gapInfo.gapType === "sleep_cycle") {
      parts.push("The user may be in a different headspace than when they wrote the original entry or last chatted.");
    } else if (gapInfo.gapType === "new_day" || gapInfo.gapType === "long_absence") {
      parts.push("Significant time has passed - the user's circumstances or feelings may have changed.");
      parts.push("If they share something that sounds like a new experience, consider suggesting they create a new journal entry for it.");
    }
  }

  if (parts.length === 0) return "";

  return `\n\n## Time Context\n\n${parts.join("\n")}`;
}

// Format a time for display
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Check task deadlines and categorize them
export function checkTaskDeadlines(tasks: Task[]): TaskDeadlineInfo {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(todayEnd.getTime() + 24 * 60 * 60 * 1000);

  const result: TaskDeadlineInfo = {
    overdueTasks: [],
    dueTodayTasks: [],
    upcomingTasks: [],
    urgentNowTasks: [],
  };

  for (const task of tasks) {
    const taskInfo: TaskWithDeadline = {
      id: task.id,
      what: task.what,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      urgency: task.urgency,
      context: task.context,
    };

    // Check urgency="now" tasks
    if (task.urgency === "now") {
      result.urgentNowTasks.push(taskInfo);
      continue;
    }

    // Check tasks with due dates
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);

      // Overdue: due date is before today
      if (dueDate < todayStart) {
        result.overdueTasks.push(taskInfo);
      }
      // Due today
      else if (dueDate >= todayStart && dueDate < todayEnd) {
        result.dueTodayTasks.push(taskInfo);
      }
      // Upcoming: due within next 24 hours (tomorrow)
      else if (dueDate >= todayEnd && dueDate < tomorrowEnd) {
        result.upcomingTasks.push(taskInfo);
      }
    }
    // For tasks without due dates but with urgency="today"
    else if (task.urgency === "today") {
      result.dueTodayTasks.push(taskInfo);
    }
  }

  return result;
}

// Generate AI context for task reminders
export function getTaskReminderContextForAI(taskInfo: TaskDeadlineInfo): string {
  const parts: string[] = [];

  // Urgent "now" tasks - highest priority
  if (taskInfo.urgentNowTasks.length > 0) {
    const taskList = taskInfo.urgentNowTasks
      .map((t) => `- ${t.what}${t.dueTime ? ` (${t.dueTime})` : ""}${t.context ? ` - ${t.context}` : ""}`)
      .join("\n");
    parts.push(`🚨 **URGENT TASKS (need immediate attention):**\n${taskList}`);
  }

  // Overdue tasks
  if (taskInfo.overdueTasks.length > 0) {
    const taskList = taskInfo.overdueTasks
      .map((t) => {
        const daysOverdue = t.dueDate
          ? Math.floor((Date.now() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        return `- ${t.what} (${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue)${t.context ? ` - ${t.context}` : ""}`;
      })
      .join("\n");
    parts.push(`⚠️ **OVERDUE TASKS:**\n${taskList}`);
  }

  // Due today
  if (taskInfo.dueTodayTasks.length > 0) {
    const taskList = taskInfo.dueTodayTasks
      .map((t) => `- ${t.what}${t.dueTime ? ` (${t.dueTime})` : ""}${t.context ? ` - ${t.context}` : ""}`)
      .join("\n");
    parts.push(`📅 **DUE TODAY:**\n${taskList}`);
  }

  // Upcoming tasks (tomorrow)
  if (taskInfo.upcomingTasks.length > 0) {
    const taskList = taskInfo.upcomingTasks
      .map((t) => `- ${t.what}${t.dueTime ? ` (${t.dueTime})` : ""}${t.context ? ` - ${t.context}` : ""}`)
      .join("\n");
    parts.push(`📌 **DUE TOMORROW:**\n${taskList}`);
  }

  if (parts.length === 0) {
    return "";
  }

  return `\n\n## Task Reminders\n\n${parts.join("\n\n")}\n\n**Important:** Proactively remind the user about these tasks naturally in your response. For overdue or urgent tasks, make sure to bring them up. Don't just list them - weave them into the conversation helpfully.`;
}

// Check if there are any tasks that need attention
export function hasTasksNeedingAttention(taskInfo: TaskDeadlineInfo): boolean {
  return (
    taskInfo.urgentNowTasks.length > 0 ||
    taskInfo.overdueTasks.length > 0 ||
    taskInfo.dueTodayTasks.length > 0 ||
    taskInfo.upcomingTasks.length > 0
  );
}
