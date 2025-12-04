import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// GET /api/stats - Get aggregated user statistics
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Run all aggregations in parallel
    const [
      totalEntries,
      recentEntries,
      entriesByType,
      entriesByTimeContext,
      totalCommitments,
      commitmentsByStatus,
      completedCommitments,
      totalPeople,
      recentlyMentionedPeople,
      silentPeopleCount,
      strategiesStats,
      moodStats,
      feedbackStats,
    ] = await Promise.all([
      // Total entries all time
      prisma.journalEntry.count({
        where: { userId: dbUser.id },
      }),

      // Recent entries count
      prisma.journalEntry.count({
        where: {
          userId: dbUser.id,
          createdAt: { gte: startDate },
        },
      }),

      // Entries by type (recent)
      prisma.journalEntry.groupBy({
        by: ["entryType"],
        where: {
          userId: dbUser.id,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),

      // Entries by time context (recent)
      prisma.journalEntry.groupBy({
        by: ["timeContext"],
        where: {
          userId: dbUser.id,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),

      // Total commitments all time
      prisma.commitment.count({
        where: { userId: dbUser.id },
      }),

      // Commitments by status
      prisma.commitment.groupBy({
        by: ["status"],
        where: { userId: dbUser.id },
        _count: true,
      }),

      // Completed commitments (recent)
      prisma.commitment.count({
        where: {
          userId: dbUser.id,
          status: "completed",
          updatedAt: { gte: startDate },
        },
      }),

      // Total people tracked
      prisma.person.count({
        where: { userId: dbUser.id },
      }),

      // Recently mentioned people
      prisma.person.count({
        where: {
          userId: dbUser.id,
          lastMentioned: { gte: startDate },
        },
      }),

      // Silent people (not mentioned in 14+ days)
      prisma.person.count({
        where: {
          userId: dbUser.id,
          mentionCount: { gte: 2 },
          lastMentioned: {
            lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Strategies stats
      prisma.strategy.groupBy({
        by: ["worked"],
        where: { userId: dbUser.id },
        _count: true,
      }),

      // Mood stats (average mood score in recent entries)
      prisma.journalEntry.aggregate({
        where: {
          userId: dbUser.id,
          entryType: "mood_check",
          moodScore: { not: null },
          createdAt: { gte: startDate },
        },
        _avg: { moodScore: true },
        _count: { moodScore: true },
      }),

      // Feedback stats
      prisma.responseTracking.groupBy({
        by: ["feedback"],
        where: {
          userId: dbUser.id,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
    ]);

    // Calculate derived stats
    const commitmentCompletionRate =
      totalCommitments > 0
        ? commitmentsByStatus.find((c) => c.status === "completed")?._count || 0 / totalCommitments
        : 0;

    const activeCommitments =
      commitmentsByStatus.find((c) => c.status === "active")?._count || 0;

    const strategySuccessRate = (() => {
      const worked = strategiesStats.find((s) => s.worked === true)?._count || 0;
      const didntWork = strategiesStats.find((s) => s.worked === false)?._count || 0;
      const total = worked + didntWork;
      return total > 0 ? worked / total : 0;
    })();

    // Calculate streaks
    const recentEntriesDates = await prisma.journalEntry.findMany({
      where: { userId: dbUser.id },
      select: { date: true },
      orderBy: { date: "desc" },
      take: 100,
    });

    const currentStreak = calculateStreak(recentEntriesDates.map((e) => e.date));

    return NextResponse.json({
      overview: {
        totalEntries,
        recentEntries,
        totalCommitments,
        activeCommitments,
        completedCommitmentsRecent: completedCommitments,
        totalPeople,
        currentStreak,
      },
      entries: {
        byType: entriesByType.reduce(
          (acc, e) => ({ ...acc, [e.entryType]: e._count }),
          {}
        ),
        byTimeContext: entriesByTimeContext.reduce(
          (acc, e) => ({ ...acc, [e.timeContext]: e._count }),
          {}
        ),
      },
      commitments: {
        byStatus: commitmentsByStatus.reduce(
          (acc, c) => ({ ...acc, [c.status]: c._count }),
          {}
        ),
        completionRate: commitmentCompletionRate,
      },
      people: {
        total: totalPeople,
        recentlyMentioned: recentlyMentionedPeople,
        silent: silentPeopleCount,
      },
      strategies: {
        successRate: strategySuccessRate,
        byOutcome: strategiesStats.reduce(
          (acc, s) => ({
            ...acc,
            [s.worked === null ? "untested" : s.worked ? "worked" : "didnt_work"]:
              s._count,
          }),
          {}
        ),
      },
      mood: {
        average: moodStats._avg.moodScore,
        checkIns: moodStats._count.moodScore,
      },
      feedback: {
        byType: feedbackStats.reduce(
          (acc, f) => ({ ...acc, [f.feedback]: f._count }),
          {}
        ),
      },
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if there's an entry today
  const firstDate = new Date(dates[0]);
  firstDate.setHours(0, 0, 0, 0);

  const diffToday = Math.floor(
    (today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If no entry today and no entry yesterday, streak is 0
  if (diffToday > 1) return 0;

  // Start counting from the most recent entry
  let currentDate = firstDate;
  streak = 1;

  for (let i = 1; i < dates.length; i++) {
    const entryDate = new Date(dates[i]);
    entryDate.setHours(0, 0, 0, 0);

    const diff = Math.floor(
      (currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff === 1) {
      streak++;
      currentDate = entryDate;
    } else if (diff === 0) {
      // Same day, continue
      continue;
    } else {
      // Gap in streak
      break;
    }
  }

  return streak;
}
