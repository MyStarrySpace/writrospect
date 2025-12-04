import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { getTimeContextWithTimezone } from "@/lib/utils/time";
import { extractFromEntry } from "@/lib/extraction/commitment-extractor";
import { Sentiment, RelationshipType, QuickEntryType } from "@prisma/client";

// GET /api/entries - List all entries for the user
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const entries = await prisma.journalEntry.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        commitmentsMade: {
          select: { id: true, what: true, status: true },
        },
      },
    });

    const total = await prisma.journalEntry.count({
      where: { userId: dbUser.id },
    });

    return NextResponse.json({
      entries,
      total,
      hasMore: offset + entries.length < total,
    });
  } catch (error) {
    console.error("Error fetching entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

// POST /api/entries - Create a new entry
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();

    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Determine which date/time to use for time context
    // If specificDateTime is provided, use it; otherwise use now
    let dateForContext = now;
    let specificDateTime: Date | null = null;

    if (body.specificDateTime) {
      specificDateTime = new Date(body.specificDateTime);
      dateForContext = specificDateTime;
    }

    // Get time context using user's timezone if available
    const timeContext = getTimeContextWithTimezone(dateForContext, dbUser.timezone);

    // Parse entry type and mood score if provided
    const entryType: QuickEntryType = body.entryType || "general";
    let moodScore: number | null = null;
    if (entryType === "mood_check" && body.moodScore) {
      moodScore = Math.min(5, Math.max(1, parseInt(body.moodScore)));
    }

    const entry = await prisma.journalEntry.create({
      data: {
        userId: dbUser.id,
        date: now,
        time: now,
        timeContext,
        content: body.content.trim(),
        specificDateTime,
        entryType,
        moodScore,
        conditionsPresent: body.conditionsPresent || [],
        reflections: [],
      },
      include: {
        commitmentsMade: true,
      },
    });

    // Run extraction in background if autoExtract is enabled (default: true)
    const shouldExtract = body.autoExtract !== false;
    let extraction = null;

    if (shouldExtract) {
      try {
        const result = await extractFromEntry(body.content.trim());
        extraction = result;

        // Create commitments from extraction
        for (const commitment of result.commitments) {
          await prisma.commitment.create({
            data: {
              userId: dbUser.id,
              what: commitment.what,
              why: commitment.why,
              complexity: commitment.complexity,
              motivationType: commitment.motivationType,
              dueDate: commitment.dueDate ? new Date(commitment.dueDate) : null,
              sourceEntryId: entry.id,
            },
          });
        }

        // Process people from extraction
        for (const person of result.people) {
          if (!person.name) continue;

          let dbPerson = await prisma.person.findUnique({
            where: {
              userId_name: {
                userId: dbUser.id,
                name: person.name,
              },
            },
          });

          if (dbPerson) {
            await prisma.person.update({
              where: { id: dbPerson.id },
              data: {
                lastMentioned: new Date(),
                mentionCount: { increment: 1 },
              },
            });
          } else {
            const relationship = mapRelationshipType(person.relationship);
            dbPerson = await prisma.person.create({
              data: {
                userId: dbUser.id,
                name: person.name,
                relationship,
              },
            });
          }

          if (person.sentiment) {
            await prisma.personSentiment.create({
              data: {
                personId: dbPerson.id,
                sentiment: mapSentiment(person.sentiment),
                context: person.context,
                entryId: entry.id,
              },
            });
          }
        }

        // Update entry with key topics
        if (result.keyTopics.length > 0) {
          await prisma.journalEntry.update({
            where: { id: entry.id },
            data: { reflections: result.keyTopics },
          });
        }
      } catch (extractError) {
        console.error("Extraction error (non-fatal):", extractError);
      }
    }

    // Fetch updated entry with commitments
    const updatedEntry = await prisma.journalEntry.findUnique({
      where: { id: entry.id },
      include: { commitmentsMade: true },
    });

    return NextResponse.json({
      entry: updatedEntry || entry,
      extraction,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating entry:", error);
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 }
    );
  }
}

function mapRelationshipType(type?: string): RelationshipType {
  const mapping: Record<string, RelationshipType> = {
    partner: "partner",
    friend: "friend",
    family: "family",
    coworker: "coworker",
    acquaintance: "acquaintance",
  };
  return mapping[type?.toLowerCase() || ""] || "other";
}

function mapSentiment(sentiment: string): Sentiment {
  const mapping: Record<string, Sentiment> = {
    positive: "positive",
    neutral: "neutral",
    stressed: "stressed",
    conflicted: "conflicted",
    negative: "negative",
  };
  return mapping[sentiment.toLowerCase()] || "neutral";
}
