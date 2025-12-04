import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { ResponseFeedback, TimeContext } from "@prisma/client";
import { getTimeContext } from "@/lib/utils/time";

// POST /api/feedback - Submit feedback for an AI response
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();

    if (!body.messageId) {
      return NextResponse.json(
        { error: "messageId is required" },
        { status: 400 }
      );
    }

    if (!body.feedback) {
      return NextResponse.json(
        { error: "feedback is required" },
        { status: 400 }
      );
    }

    // Validate feedback type
    const validFeedback: ResponseFeedback[] = [
      "helpful",
      "not_helpful",
      "too_long",
      "too_short",
      "tone_wrong",
      "off_topic",
    ];

    if (!validFeedback.includes(body.feedback)) {
      return NextResponse.json(
        { error: "Invalid feedback type" },
        { status: 400 }
      );
    }

    // Get the original message to extract metadata
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: body.messageId,
        userId: dbUser.id,
        role: "assistant",
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Analyze the message content for learning
    const containedQuestion = message.content.includes("?");
    const advicePatterns = [
      "try ",
      "consider ",
      "you could ",
      "i suggest ",
      "recommend ",
      "might want to ",
    ];
    const containedAdvice = advicePatterns.some((p) =>
      message.content.toLowerCase().includes(p)
    );
    const empathyPatterns = [
      "understand",
      "sounds like",
      "that must be",
      "i hear you",
      "that's tough",
      "sorry to hear",
    ];
    const containedEmpathy = empathyPatterns.some((p) =>
      message.content.toLowerCase().includes(p)
    );

    // Create the feedback record
    const tracking = await prisma.responseTracking.create({
      data: {
        userId: dbUser.id,
        messageId: body.messageId,
        feedback: body.feedback as ResponseFeedback,
        context: body.context?.trim() || null,
        responseLength: message.content.length,
        containedQuestion,
        containedAdvice,
        containedEmpathy,
        timeContext: getTimeContext(new Date()),
      },
    });

    // Update tone preferences based on feedback
    await updateTonePreferences(dbUser.id, body.feedback, {
      containedQuestion,
      containedAdvice,
      containedEmpathy,
      responseLength: message.content.length,
    });

    return NextResponse.json({ tracking }, { status: 201 });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

// GET /api/feedback/stats - Get feedback statistics
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    // Get feedback counts by type
    const feedbackCounts = await prisma.responseTracking.groupBy({
      by: ["feedback"],
      where: { userId: dbUser.id },
      _count: true,
    });

    // Get tone preferences
    const tonePreferences = await prisma.tonePreference.findMany({
      where: { userId: dbUser.id },
      orderBy: { score: "desc" },
    });

    // Get recent feedback
    const recentFeedback = await prisma.responseTracking.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Calculate overall satisfaction rate
    const totalFeedback = feedbackCounts.reduce((sum, f) => sum + f._count, 0);
    const helpfulCount =
      feedbackCounts.find((f) => f.feedback === "helpful")?._count || 0;
    const satisfactionRate = totalFeedback > 0 ? helpfulCount / totalFeedback : 0;

    return NextResponse.json({
      feedbackCounts: feedbackCounts.reduce(
        (acc, f) => ({ ...acc, [f.feedback]: f._count }),
        {}
      ),
      tonePreferences,
      recentFeedback,
      stats: {
        totalFeedback,
        satisfactionRate,
      },
    });
  } catch (error) {
    console.error("Feedback stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback stats" },
      { status: 500 }
    );
  }
}

async function updateTonePreferences(
  userId: string,
  feedback: ResponseFeedback,
  metadata: {
    containedQuestion: boolean;
    containedAdvice: boolean;
    containedEmpathy: boolean;
    responseLength: number;
  }
) {
  const isPositive = feedback === "helpful";
  const scoreChange = isPositive ? 1 : -1;

  const toneUpdates: { type: string; shouldUpdate: boolean }[] = [
    { type: "questioning", shouldUpdate: metadata.containedQuestion },
    { type: "advisory", shouldUpdate: metadata.containedAdvice },
    { type: "empathetic", shouldUpdate: metadata.containedEmpathy },
    { type: "concise", shouldUpdate: metadata.responseLength < 500 },
    { type: "detailed", shouldUpdate: metadata.responseLength > 1000 },
  ];

  // Update feedback-specific tones
  if (feedback === "too_long") {
    toneUpdates.push({ type: "concise", shouldUpdate: true });
  }
  if (feedback === "too_short") {
    toneUpdates.push({ type: "detailed", shouldUpdate: true });
  }
  if (feedback === "tone_wrong") {
    // Negative signal for whatever tones were present
    for (const update of toneUpdates) {
      if (update.shouldUpdate) {
        update.shouldUpdate = true;
      }
    }
  }

  for (const { type, shouldUpdate } of toneUpdates) {
    if (!shouldUpdate) continue;

    await prisma.tonePreference.upsert({
      where: {
        userId_toneType: {
          userId,
          toneType: type,
        },
      },
      create: {
        userId,
        toneType: type,
        score: scoreChange,
        sampleCount: 1,
      },
      update: {
        score: { increment: scoreChange },
        sampleCount: { increment: 1 },
      },
    });
  }
}
