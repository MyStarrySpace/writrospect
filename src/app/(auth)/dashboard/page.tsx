import { stackServerApp } from "@/stack";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { DashboardClient, PatternInsight } from "./DashboardClient";
import { TimeContext } from "@prisma/client";

export default async function DashboardPage() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect("/handler/sign-in");
  }

  const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

  // Fetch stats
  const [
    totalEntries,
    totalHabits,
    completedHabits,
    activeHabits,
    abandonedHabits,
    totalStrategies,
    workingStrategies,
    recentEntries,
    recentHabits,
    allEntries,
    abandonedHabitsList,
    completedTaskCount,
    totalTaskCount,
  ] = await Promise.all([
    prisma.journalEntry.count({ where: { userId: dbUser.id } }),
    prisma.habit.count({ where: { userId: dbUser.id } }),
    prisma.habit.count({
      where: { userId: dbUser.id, status: "completed" },
    }),
    prisma.habit.count({
      where: { userId: dbUser.id, status: "active" },
    }),
    prisma.habit.count({
      where: { userId: dbUser.id, status: "abandoned" },
    }),
    prisma.strategy.count({ where: { userId: dbUser.id } }),
    prisma.strategy.count({
      where: { userId: dbUser.id, worked: true },
    }),
    prisma.journalEntry.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.habit.findMany({
      where: { userId: dbUser.id, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // For pattern analysis
    prisma.journalEntry.findMany({
      where: { userId: dbUser.id },
      select: { timeContext: true, conditionsPresent: true, entryType: true, moodScore: true },
    }),
    prisma.habit.findMany({
      where: { userId: dbUser.id, status: "abandoned" },
      select: { learned: true },
    }),
    prisma.task.count({ where: { userId: dbUser.id, status: "completed" } }),
    prisma.task.count({ where: { userId: dbUser.id } }),
  ]);

  // Calculate completion rate
  const completionRate =
    totalHabits > 0
      ? Math.round((completedHabits / totalHabits) * 100)
      : 0;

  // Calculate strategy success rate
  const strategySuccessRate =
    totalStrategies > 0
      ? Math.round((workingStrategies / totalStrategies) * 100)
      : 0;

  // ── Compute pattern insights ──
  const insights: PatternInsight[] = [];

  // 1. Most productive time of day
  if (allEntries.length >= 5) {
    const timeCounts: Record<string, number> = {};
    for (const e of allEntries) {
      timeCounts[e.timeContext] = (timeCounts[e.timeContext] || 0) + 1;
    }
    const sorted = Object.entries(timeCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const labels: Record<string, string> = {
        early_morning: "early morning",
        morning: "morning",
        afternoon: "afternoon",
        evening: "evening",
        late_night: "late night",
      };
      const topTime = labels[sorted[0][0]] || sorted[0][0];
      const pct = Math.round((sorted[0][1] / allEntries.length) * 100);
      insights.push({
        icon: "clock",
        title: "Most active time",
        description: `You journal most during the ${topTime} (${pct}% of entries). Your best ideas seem to come when the world is quiet.`,
        variant: "info",
      });
    }
  }

  // 2. Conditions that correlate with good entries
  const allConditions: Record<string, number> = {};
  for (const e of allEntries) {
    for (const c of e.conditionsPresent) {
      allConditions[c] = (allConditions[c] || 0) + 1;
    }
  }
  const topConditions = Object.entries(allConditions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topConditions.length >= 2) {
    insights.push({
      icon: "sparkles",
      title: "When you're at your best",
      description: `Your most common states when journaling: ${topConditions.map(([c]) => c).join(", ")}. Creativity shows up most when you're in a ${topConditions[0][0]} state.`,
      variant: "success",
    });
  }

  // 3. Learning from abandoned habits
  const learnedLessons = abandonedHabitsList
    .filter((h) => h.learned)
    .map((h) => h.learned!);
  if (learnedLessons.length > 0) {
    insights.push({
      icon: "lightbulb",
      title: "What you've learned from letting go",
      description: learnedLessons[0],
      variant: "warning",
    });
  }

  // 4. Task completion pattern
  if (totalTaskCount >= 5) {
    const taskRate = Math.round((completedTaskCount / totalTaskCount) * 100);
    insights.push({
      icon: "target",
      title: "Task follow-through",
      description: `You've completed ${completedTaskCount} of ${totalTaskCount} tasks (${taskRate}%). ${taskRate >= 50 ? "Solid follow-through. you tend to do what you say you'll do." : "Some tasks slip through. might help to trim the list to what actually matters."}`,
      variant: taskRate >= 50 ? "success" : "default",
    });
  }

  // 5. Late night creativity pattern
  const lateNightCount = allEntries.filter(
    (e) => e.timeContext === "late_night"
  ).length;
  const lateNightThinking = allEntries.filter(
    (e) => e.timeContext === "late_night" && e.entryType === "thinking_of"
  ).length;
  if (lateNightCount >= 3) {
    insights.push({
      icon: "moon",
      title: "Night owl pattern",
      description: `${lateNightCount} entries written late at night${lateNightThinking > 0 ? `, ${lateNightThinking} of which are deep-thinking entries` : ""}. Your brain seems to do its best connecting work after hours.`,
      variant: "secondary",
    });
  }

  return (
    <DashboardClient
      stats={{
        totalEntries,
        totalHabits,
        completedHabits,
        activeHabits,
        abandonedHabits,
        totalStrategies,
        workingStrategies,
        completionRate,
        strategySuccessRate,
      }}
      recentEntries={recentEntries}
      recentHabits={recentHabits}
      insights={insights}
    />
  );
}
