import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { getTimeContextWithTimezone } from "@/lib/utils/time";
import { QuickEntryType } from "@prisma/client";

// Define templates for each quick entry type
const QUICK_ENTRY_TEMPLATES: Record<QuickEntryType, {
  label: string;
  placeholder: string;
  aiPromptHint: string;
}> = {
  mood_check: {
    label: "Mood Check",
    placeholder: "How are you feeling right now? (1-5 and why)",
    aiPromptHint: "This is a mood check-in. Acknowledge their emotional state and ask if there's anything they want to explore.",
  },
  done: {
    label: "Done",
    placeholder: "What did you just finish?",
    aiPromptHint: "They completed something. Acknowledge it simply, ask if it connects to any ongoing commitments.",
  },
  stuck: {
    label: "Stuck",
    placeholder: "What are you stuck on?",
    aiPromptHint: "They're blocked. Help identify what's causing the block and offer to brainstorm solutions.",
  },
  thinking_of: {
    label: "Thinking Of",
    placeholder: "What's on your mind?",
    aiPromptHint: "They're pondering something. Engage with the thought, help them process or develop it.",
  },
  quick_win: {
    label: "Quick Win",
    placeholder: "What small thing did you accomplish?",
    aiPromptHint: "Small accomplishment. Acknowledge it without overdoing it. 'Nice.' is enough.",
  },
  vent: {
    label: "Vent",
    placeholder: "Let it out...",
    aiPromptHint: "They need to vent. Listen without trying to fix. Validate feelings. Only offer perspective if asked.",
  },
  planning: {
    label: "Planning",
    placeholder: "What are you planning or thinking ahead about?",
    aiPromptHint: "They're planning ahead. Help them think through it, check for potential issues.",
  },
  general: {
    label: "General",
    placeholder: "What's on your mind?",
    aiPromptHint: "General entry. Engage naturally based on content.",
  },
};

// GET /api/quick-entry - Get quick entry type templates
export async function GET() {
  return NextResponse.json({
    templates: Object.entries(QUICK_ENTRY_TEMPLATES).map(([type, template]) => ({
      type,
      ...template,
    })),
  });
}

// POST /api/quick-entry - Create a quick entry
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

    const entryType: QuickEntryType = body.entryType || "general";

    // Validate entry type
    if (!Object.keys(QUICK_ENTRY_TEMPLATES).includes(entryType)) {
      return NextResponse.json(
        { error: "Invalid entry type" },
        { status: 400 }
      );
    }

    // Parse mood score if it's a mood check
    let moodScore: number | null = null;
    if (entryType === "mood_check" && body.moodScore) {
      moodScore = Math.min(5, Math.max(1, parseInt(body.moodScore)));
    }

    const now = new Date();
    const timeContext = getTimeContextWithTimezone(now, dbUser.timezone);

    const entry = await prisma.journalEntry.create({
      data: {
        userId: dbUser.id,
        date: now,
        time: now,
        timeContext,
        content: body.content.trim(),
        entryType,
        moodScore,
        conditionsPresent: body.conditionsPresent || [],
        reflections: [],
      },
      include: {
        commitmentsMade: true,
      },
    });

    // Get the AI prompt hint for this entry type
    const template = QUICK_ENTRY_TEMPLATES[entryType];

    return NextResponse.json({
      entry,
      aiPromptHint: template.aiPromptHint,
    }, { status: 201 });
  } catch (error) {
    console.error("Quick entry error:", error);
    return NextResponse.json(
      { error: "Failed to create quick entry" },
      { status: 500 }
    );
  }
}
