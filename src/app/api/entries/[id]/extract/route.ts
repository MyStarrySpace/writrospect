import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { extractFromEntry } from "@/lib/extraction/commitment-extractor";
import { Sentiment, RelationshipType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/entries/[id]/extract - Extract commitments and people from an entry
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const { id } = await params;

    // Get the entry
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Extract data from the entry
    const extraction = await extractFromEntry(entry.content);

    // Create commitments
    const createdCommitments = [];
    for (const commitment of extraction.commitments) {
      const created = await prisma.commitment.create({
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
      createdCommitments.push(created);
    }

    // Process people
    const processedPeople = [];
    for (const person of extraction.people) {
      if (!person.name) continue;

      // Check if person already exists
      let dbPerson = await prisma.person.findUnique({
        where: {
          userId_name: {
            userId: dbUser.id,
            name: person.name,
          },
        },
      });

      if (dbPerson) {
        // Update existing person
        dbPerson = await prisma.person.update({
          where: { id: dbPerson.id },
          data: {
            lastMentioned: new Date(),
            mentionCount: { increment: 1 },
          },
        });
      } else {
        // Create new person
        const relationship = mapRelationshipType(person.relationship);
        dbPerson = await prisma.person.create({
          data: {
            userId: dbUser.id,
            name: person.name,
            relationship,
          },
        });
      }

      // Add sentiment if available
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

      processedPeople.push(dbPerson);
    }

    // Update entry with key topics as reflections if not already set
    if (extraction.keyTopics.length > 0 && entry.reflections.length === 0) {
      await prisma.journalEntry.update({
        where: { id: entry.id },
        data: {
          reflections: extraction.keyTopics,
        },
      });
    }

    return NextResponse.json({
      commitments: createdCommitments,
      people: processedPeople,
      emotionalState: extraction.emotionalState,
      keyTopics: extraction.keyTopics,
    });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract from entry" },
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
