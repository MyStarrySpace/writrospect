import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { streamChatWithTools } from "@/lib/claude";
import { buildSessionPrompt } from "@/lib/prompts/session-prompt";
import {
  commitmentTools,
  executeCommitmentTool,
} from "@/lib/ai-tools/commitment-tools";
import {
  quickRouteCheck,
  routeMessage,
  summarizeChatHistory,
  RoutingDecision,
} from "@/lib/router";

// GET /api/chat?entryId=xxx - Fetch chat history for an entry
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("entryId");

    if (!entryId) {
      return NextResponse.json(
        { error: "entryId is required" },
        { status: 400 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        userId: dbUser.id,
        entryId: entryId,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();
    const messageText = body.message?.trim() || "";

    if (!messageText) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Step 1: Route the message (quick check first, then Haiku if needed)
    let routing: RoutingDecision = quickRouteCheck(messageText) || await routeMessage(messageText);

    // Step 2: Fetch only the context we need based on routing
    const fullUser = await prisma.user.findUnique({
      where: { id: dbUser.id },
      include: {
        context: routing.context.patterns,
        successModel: routing.context.patterns,
        preferences: routing.context.patterns,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Selective context fetching based on routing decision
    const recentEntries = routing.context.entries
      ? await prisma.journalEntry.findMany({
          where: { userId: dbUser.id },
          orderBy: { createdAt: "desc" },
          take: 3, // Reduced from 10
        })
      : [];

    const openCommitments = routing.context.commitments
      ? await prisma.commitment.findMany({
          where: { userId: dbUser.id, status: { in: ["active", "paused"] } },
          orderBy: { createdAt: "desc" },
          take: 5, // Limit
        })
      : [];

    const recentStrategies = routing.context.strategies
      ? await prisma.strategy.findMany({
          where: { userId: dbUser.id },
          orderBy: { lastTried: "desc" },
          take: 5, // Reduced from 15
        })
      : [];

    const recentPeople = routing.context.people
      ? await prisma.person.findMany({
          where: { userId: dbUser.id },
          orderBy: { lastMentioned: "desc" },
          take: 5, // Reduced from 10
          include: { sentimentHistory: { orderBy: { createdAt: "desc" }, take: 1 } },
        })
      : [];

    // Skip silent people unless specifically needed
    const silentPeople: typeof recentPeople = [];

    const tonePreferences = routing.context.patterns
      ? await prisma.tonePreference.findMany({
          where: { userId: dbUser.id },
          orderBy: { score: "desc" },
          take: 3, // Only top preferences
        })
      : [];

    // Build system prompt with selective context
    const systemPrompt = buildSessionPrompt({
      user: fullUser,
      recentEntries,
      openCommitments,
      recentStrategies,
      recentPeople,
      silentPeople,
      tonePreferences,
    });

    // Get conversation history if entryId is provided
    const conversationHistory: Anthropic.MessageParam[] = [];
    let chatSummary = "";

    if (body.entryId) {
      const chatHistory = await prisma.chatMessage.findMany({
        where: {
          userId: dbUser.id,
          entryId: body.entryId,
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      });

      // Summarize older messages if there are many
      if (chatHistory.length > 6) {
        const summary = await summarizeChatHistory(
          chatHistory.map((m) => ({ role: m.role, content: m.content }))
        );
        if (summary.summary) {
          chatSummary = `[Previous conversation summary: ${summary.summary}]\n\n`;
          // Only include last 4 messages in full
          for (const msg of chatHistory.slice(-4)) {
            conversationHistory.push({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            });
          }
        } else {
          // Fallback to last 6 if summarization failed
          for (const msg of chatHistory.slice(-6)) {
            conversationHistory.push({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            });
          }
        }
      } else {
        for (const msg of chatHistory) {
          conversationHistory.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        }
      }
    }

    // Add the new user message
    conversationHistory.push({
      role: "user",
      content: messageText,
    });

    // Save user message to database
    await prisma.chatMessage.create({
      data: {
        userId: dbUser.id,
        role: "user",
        content: messageText,
        entryId: body.entryId || null,
      },
    });

    // Build final system prompt with summary if available
    const finalSystemPrompt = chatSummary + systemPrompt;

    // Determine tools based on routing
    const tools = routing.needsTools ? commitmentTools : [];
    const selectedModel = routing.model;

    // Create streaming response with tool support
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let allTextParts: string[] = []; // Accumulate all text across tool calls
          let currentLoopText = ""; // Text for current loop iteration
          let currentMessages = [...conversationHistory];
          let continueLoop = true;

          while (continueLoop) {
            const pendingToolCalls: {
              id: string;
              name: string;
              input: Record<string, unknown>;
            }[] = [];
            currentLoopText = "";

            // Stream the response
            for await (const event of streamChatWithTools(
              finalSystemPrompt,
              currentMessages,
              tools,
              selectedModel
            )) {
              if (event.type === "text") {
                currentLoopText += event.content;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text", content: event.content })}\n\n`
                  )
                );
              } else if (event.type === "tool_use") {
                pendingToolCalls.push({
                  id: event.toolUseId,
                  name: event.toolName,
                  input: event.toolInput,
                });
                // Notify the client that a tool is being used
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "tool_use",
                      tool: event.toolName,
                      input: event.toolInput,
                    })}\n\n`
                  )
                );
              } else if (event.type === "done") {
                if (event.stopReason === "tool_use" && pendingToolCalls.length > 0) {
                  // Save text from this loop iteration
                  if (currentLoopText) {
                    allTextParts.push(currentLoopText);
                  }

                  // Execute tools and continue the conversation
                  const toolResults: Anthropic.ToolResultBlockParam[] = [];

                  for (const toolCall of pendingToolCalls) {
                    const result = await executeCommitmentTool(
                      dbUser.id,
                      toolCall.name,
                      toolCall.input,
                      body.entryId
                    );
                    toolResults.push({
                      type: "tool_result",
                      tool_use_id: toolCall.id,
                      content: result,
                    });
                  }

                  // Build the assistant message with tool uses
                  const assistantContent: Anthropic.ContentBlockParam[] = [];
                  if (currentLoopText) {
                    assistantContent.push({ type: "text", text: currentLoopText });
                  }
                  for (const toolCall of pendingToolCalls) {
                    assistantContent.push({
                      type: "tool_use",
                      id: toolCall.id,
                      name: toolCall.name,
                      input: toolCall.input,
                    });
                  }

                  // Add assistant message and tool results to history
                  currentMessages.push({
                    role: "assistant",
                    content: assistantContent,
                  });
                  currentMessages.push({
                    role: "user",
                    content: toolResults,
                  });

                  // Continue the loop to get the final response
                } else {
                  // End of conversation - save final text
                  if (currentLoopText) {
                    allTextParts.push(currentLoopText);
                  }
                  continueLoop = false;
                }
              }
            }
          }

          // Save complete assistant response to database (all text parts combined)
          const fullResponse = allTextParts.join("\n\n");
          if (fullResponse) {
            await prisma.chatMessage.create({
              data: {
                userId: dbUser.id,
                role: "assistant",
                content: fullResponse,
                entryId: body.entryId || null,
              },
            });
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: "Failed to generate response",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
