import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

export interface CheckInItem {
  type: "task" | "habit" | "goal";
  id: string;
  title: string;
  context?: string;
  urgency?: string;
  progress?: number;
  actions: QuickAction[];
}

export interface QuickAction {
  key: number;
  label: string;
  action: string;
  icon?: string;
}

interface CheckInEvaluation {
  shouldTrigger: boolean;
  reason: string;
  items: CheckInItem[];
  score: number;
}

// GET /api/check-in - Evaluate if check-in should be triggered and return items
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Fetch pending/overdue tasks
    const tasks = await prisma.task.findMany({
      where: {
        userId: dbUser.id,
        status: "pending",
        OR: [
          { urgency: { in: ["now", "today"] } },
          { dueDate: { lte: tomorrowStart } },
        ],
      },
      orderBy: [{ urgency: "asc" }, { dueDate: "asc" }],
      take: 5,
    });

    // Fetch active habits
    const habits = await prisma.habit.findMany({
      where: {
        userId: dbUser.id,
        status: "active",
      },
      orderBy: { updatedAt: "asc" },
      take: 3,
    });

    // Fetch active goals that haven't been updated in a while
    const staleGoals = await prisma.goal.findMany({
      where: {
        userId: dbUser.id,
        status: "active",
        updatedAt: { lt: weekAgo },
      },
      orderBy: { updatedAt: "asc" },
      take: 2,
    });

    // Get last chat message to determine time since last check-in
    const lastMessage = await prisma.chatMessage.findFirst({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    const hoursSinceLastChat = lastMessage
      ? (now.getTime() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60)
      : 999;

    // Calculate check-in score
    let score = 0;
    const reasons: string[] = [];

    // High weight: overdue or urgent tasks
    const urgentTasks = tasks.filter(
      (t) => t.urgency === "now" || t.urgency === "today"
    );
    if (urgentTasks.length > 0) {
      score += 40;
      reasons.push(`${urgentTasks.length} urgent task(s)`);
    }

    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now
    );
    if (overdueTasks.length > 0) {
      score += 30;
      reasons.push(`${overdueTasks.length} overdue task(s)`);
    }

    // Medium weight: time since last check-in
    if (hoursSinceLastChat > 24) {
      score += 25;
      reasons.push("No check-in in 24+ hours");
    } else if (hoursSinceLastChat > 12) {
      score += 15;
      reasons.push("No check-in in 12+ hours");
    }

    // Medium weight: stale goals/strategies
    if (staleGoals.length > 0) {
      score += 20;
      reasons.push(`${staleGoals.length} goal(s) need attention`);
    }

    // Build check-in items
    const items: CheckInItem[] = [];

    // Add tasks
    for (const task of tasks.slice(0, 3)) {
      const isOverdue = task.dueDate && new Date(task.dueDate) < now;
      items.push({
        type: "task",
        id: task.id,
        title: task.what,
        context: isOverdue
          ? "Overdue"
          : task.urgency === "now"
            ? "Urgent"
            : task.urgency === "today"
              ? "Due today"
              : task.dueTime || undefined,
        urgency: task.urgency,
        actions: [
          { key: 1, label: "Done", action: "complete", icon: "check" },
          { key: 2, label: "Skip", action: "skip", icon: "x" },
          { key: 3, label: "Defer", action: "defer", icon: "clock" },
        ],
      });
    }

    // Add habits - check if they need a status update
    for (const habit of habits.slice(0, 2)) {
      const daysSinceUpdate = Math.floor(
        (now.getTime() - habit.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceUpdate >= 1) {
        items.push({
          type: "habit",
          id: habit.id,
          title: habit.what,
          context:
            daysSinceUpdate === 1
              ? "Check in for today"
              : `${daysSinceUpdate} days since update`,
          actions: [
            { key: 1, label: "Did it", action: "log_success", icon: "check" },
            { key: 2, label: "Missed", action: "log_missed", icon: "x" },
            { key: 3, label: "Skip", action: "skip_today", icon: "skip" },
          ],
        });
      }
    }

    // Add stale goals
    for (const goal of staleGoals.slice(0, 1)) {
      items.push({
        type: "goal",
        id: goal.id,
        title: goal.title,
        context: `${goal.progress}% progress`,
        progress: goal.progress,
        actions: [
          { key: 1, label: "Update", action: "update_progress", icon: "edit" },
          { key: 2, label: "Note", action: "add_note", icon: "note" },
          { key: 3, label: "Skip", action: "skip", icon: "skip" },
        ],
      });
    }

    const shouldTrigger = score >= 25 && items.length > 0;

    const evaluation: CheckInEvaluation = {
      shouldTrigger,
      reason: reasons.join(", ") || "No urgent items",
      items,
      score,
    };

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Error evaluating check-in:", error);
    return NextResponse.json(
      { error: "Failed to evaluate check-in" },
      { status: 500 }
    );
  }
}
