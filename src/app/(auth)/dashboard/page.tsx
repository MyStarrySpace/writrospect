import { stackServerApp } from "@/stack";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { DashboardClient } from "./DashboardClient";

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
    />
  );
}
