import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// GET /api/people/silence - Get people who haven't been mentioned recently
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const { searchParams } = new URL(request.url);
    // Days of silence before considered "quiet" - default 14 days
    const daysThreshold = parseInt(searchParams.get("days") || "14");
    // Minimum mention count to be considered for silence (avoids one-time mentions)
    const minMentions = parseInt(searchParams.get("minMentions") || "2");

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    // Find people who:
    // 1. Have been mentioned at least minMentions times (established relationship)
    // 2. Haven't been mentioned since thresholdDate
    const silentPeople = await prisma.person.findMany({
      where: {
        userId: dbUser.id,
        mentionCount: { gte: minMentions },
        lastMentioned: { lt: thresholdDate },
      },
      orderBy: { lastMentioned: "asc" }, // Most silent first
      include: {
        sentimentHistory: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });

    // Calculate days since last mention for each person
    const peopleWithSilence = silentPeople.map((person) => {
      const daysSilent = Math.floor(
        (Date.now() - new Date(person.lastMentioned).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Get the last sentiment if available
      const lastSentiment = person.sentimentHistory[0]?.sentiment || null;

      return {
        ...person,
        daysSilent,
        lastSentiment,
      };
    });

    // Also get stats about people relationships
    const stats = await prisma.person.aggregate({
      where: { userId: dbUser.id },
      _count: true,
      _avg: { mentionCount: true },
    });

    const totalPeople = stats._count;
    const silentCount = silentPeople.length;
    const silenceRate = totalPeople > 0 ? silentCount / totalPeople : 0;

    return NextResponse.json({
      silentPeople: peopleWithSilence,
      stats: {
        totalPeople,
        silentCount,
        silenceRate,
        thresholdDays: daysThreshold,
      },
    });
  } catch (error) {
    console.error("Error fetching silent people:", error);
    return NextResponse.json(
      { error: "Failed to fetch silent people" },
      { status: 500 }
    );
  }
}
