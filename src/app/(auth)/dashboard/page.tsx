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
    totalCommitments,
    completedCommitments,
    activeCommitments,
    abandonedCommitments,
    totalStrategies,
    workingStrategies,
    recentEntries,
    recentCommitments,
  ] = await Promise.all([
    prisma.journalEntry.count({ where: { userId: dbUser.id } }),
    prisma.commitment.count({ where: { userId: dbUser.id } }),
    prisma.commitment.count({
      where: { userId: dbUser.id, status: "completed" },
    }),
    prisma.commitment.count({
      where: { userId: dbUser.id, status: "active" },
    }),
    prisma.commitment.count({
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
    prisma.commitment.findMany({
      where: { userId: dbUser.id, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // Calculate completion rate
  const completionRate =
    totalCommitments > 0
      ? Math.round((completedCommitments / totalCommitments) * 100)
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
        totalCommitments,
        completedCommitments,
        activeCommitments,
        abandonedCommitments,
        totalStrategies,
        workingStrategies,
        completionRate,
        strategySuccessRate,
      }}
      recentEntries={recentEntries}
      recentCommitments={recentCommitments}
    />
  );
}
