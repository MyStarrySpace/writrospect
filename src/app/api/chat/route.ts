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
  taskTools,
  executeTaskTool,
} from "@/lib/ai-tools/task-tools";
import {
  journalTools,
  executeJournalTool,
} from "@/lib/ai-tools/journal-tools";
import {
  strategyTools,
  executeStrategyTool,
} from "@/lib/ai-tools/strategy-tools";
import {
  quickRouteCheck,
  classifyAndRoute,
  summarizeChatHistory,
  RoutingDecision,
} from "@/lib/router";
import {
  detectTimeGap,
  getTimeGapContextForAI,
  looksLikeNewEntry,
  checkTaskDeadlines,
  getTaskReminderContextForAI,
  hasTasksNeedingAttention,
} from "@/lib/utils/time-gap";

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
        toolUses: msg.toolUses as { tool: string; input: Record<string, unknown> }[] | null,
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
    let routing: RoutingDecision = quickRouteCheck(messageText) || await classifyAndRoute(messageText);

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

    // Fetch pending tasks (always fetch when commitments context is needed)
    const pendingTasks = routing.context.commitments
      ? await prisma.task.findMany({
          where: { userId: dbUser.id, status: "pending" },
          orderBy: [
            { urgency: "asc" }, // now, today, this_week, whenever
            { dueDate: "asc" },
            { createdAt: "desc" },
          ],
          take: 10,
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
    // Note: currentEntry will be added after we fetch it below
    const systemPromptBuilder = (entry?: { id: string; content: string; date: Date; timeContext: string }) => buildSessionPrompt({
      user: fullUser,
      recentEntries,
      openCommitments,
      pendingTasks,
      recentStrategies,
      recentPeople,
      silentPeople,
      tonePreferences,
      currentEntry: entry,
    });

    // Get conversation history if entryId is provided
    const conversationHistory: Anthropic.MessageParam[] = [];
    let chatSummary = "";
    let timeGapContext = "";
    let taskReminderContext = "";
    let suggestNewEntry = false;
    let lastMessageTime: Date | null = null;

    // Get the full current entry for context
    let currentEntry: { id: string; content: string; date: Date; timeContext: string; createdAt: Date } | null = null;
    if (body.entryId) {
      currentEntry = await prisma.journalEntry.findUnique({
        where: { id: body.entryId },
        select: { id: true, content: true, date: true, timeContext: true, createdAt: true },
      });

      const chatHistory = await prisma.chatMessage.findMany({
        where: {
          userId: dbUser.id,
          entryId: body.entryId,
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      });

      // Get the last message time for time gap detection
      if (chatHistory.length > 0) {
        lastMessageTime = chatHistory[chatHistory.length - 1].createdAt;
      }

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

    // Detect time gap and check if message looks like a new entry
    if (lastMessageTime) {
      const gapInfo = detectTimeGap(lastMessageTime);
      if (gapInfo.hasGap && currentEntry) {
        timeGapContext = getTimeGapContextForAI(gapInfo, currentEntry.createdAt, lastMessageTime);
      }
      // Check if we should suggest a new entry
      if (gapInfo.suggestNewEntry && looksLikeNewEntry(messageText)) {
        suggestNewEntry = true;
      }
    }

    // Check for tasks with deadlines that need attention
    if (pendingTasks.length > 0) {
      const taskDeadlineInfo = checkTaskDeadlines(pendingTasks);
      if (hasTasksNeedingAttention(taskDeadlineInfo)) {
        taskReminderContext = getTaskReminderContextForAI(taskDeadlineInfo);
      }
    }

    // Add the new user message
    conversationHistory.push({
      role: "user",
      content: messageText,
    });

    // Save user message to database (unless skipSave is true - used for system context messages)
    if (!body.skipSave) {
      await prisma.chatMessage.create({
        data: {
          userId: dbUser.id,
          role: "user",
          content: messageText,
          entryId: body.entryId || null,
        },
      });
    }

    // Build final system prompt with the current entry context, summary, time context, task reminders
    const systemPrompt = systemPromptBuilder(currentEntry || undefined);
    let finalSystemPrompt = chatSummary + systemPrompt + timeGapContext + taskReminderContext;

    // Add suggestion prompt if we detect this might be a new entry
    if (suggestNewEntry) {
      finalSystemPrompt += `\n\n## Important: New Entry Suggestion\n\nThe user's message appears to be new content that would make sense as a separate journal entry (it's been a while since the last message, and this seems like fresh thoughts/experiences). Use the suggest_new_entry tool to create a draft for them. The user will see an option to create it as a new entry.`;
    }

    // Determine tools based on routing - include commitment, task, journal, and strategy tools
    const allTools = [...commitmentTools, ...taskTools, ...journalTools, ...strategyTools];
    const tools = routing.needsTools ? allTools : [];
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
          const allToolUses: { tool: string; input: Record<string, unknown> }[] = []; // Track all tool uses for this response

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
                // Track tool use for persistence with the assistant message
                allToolUses.push({
                  tool: event.toolName,
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
                    // Route to appropriate tool handler based on tool name
                    let result: string;
                    if (toolCall.name.startsWith("create_task") || toolCall.name.startsWith("update_task") || toolCall.name.startsWith("list_task")) {
                      result = await executeTaskTool(
                        dbUser.id,
                        toolCall.name,
                        toolCall.input,
                        body.entryId
                      );
                    } else if (toolCall.name.endsWith("_strategy")) {
                      result = await executeStrategyTool(
                        dbUser.id,
                        toolCall.name,
                        toolCall.input
                      );
                    } else if (toolCall.name.startsWith("suggest_") || toolCall.name === "propose_items") {
                      result = await executeJournalTool(
                        dbUser.id,
                        toolCall.name,
                        toolCall.input,
                        body.entryId
                      );

                      // Parse the result and send suggestion to client
                      try {
                        const parsed = JSON.parse(result);
                        if (parsed.success && parsed.suggestion) {
                          let suggestionType: string;
                          let label: string;

                          switch (parsed.type) {
                            case "entry_addition":
                              suggestionType = "add_to_entry";
                              label = "Add to entry";
                              break;
                            case "style_edit":
                              suggestionType = "style_edit";
                              label = "Style suggestion";
                              break;
                            case "proposed_items":
                              suggestionType = "proposed_items";
                              label = "Review items";
                              break;
                            default:
                              suggestionType = "new_entry";
                              label = "Create new entry";
                          }

                          const suggestion = {
                            id: parsed.suggestion.id,
                            type: suggestionType,
                            ...parsed.suggestion,
                            label,
                          };
                          controller.enqueue(
                            encoder.encode(
                              `data: ${JSON.stringify({ type: "suggestion", suggestion })}\n\n`
                            )
                          );
                        }
                      } catch {
                        // Ignore parse errors
                      }
                    } else {
                      result = await executeCommitmentTool(
                        dbUser.id,
                        toolCall.name,
                        toolCall.input,
                        body.entryId
                      );
                    }
                    toolResults.push({
                      type: "tool_result",
                      tool_use_id: toolCall.id,
                      content: result,
                    });

                    // Send created item info back to client for undo/edit functionality
                    if (toolCall.name.startsWith("create_")) {
                      try {
                        const parsed = JSON.parse(result);
                        if (parsed.success) {
                          // Determine item type and extract ID
                          let itemType: string | null = null;
                          let itemId: string | null = null;
                          let itemData: Record<string, unknown> | null = null;

                          if (parsed.task) {
                            itemType = "task";
                            itemId = parsed.task.id;
                            itemData = parsed.task;
                          } else if (parsed.commitment) {
                            itemType = "commitment";
                            itemId = parsed.commitment.id;
                            itemData = parsed.commitment;
                          } else if (parsed.strategy) {
                            itemType = "strategy";
                            itemId = parsed.strategy.id;
                            itemData = parsed.strategy;
                          }

                          if (itemType && itemId) {
                            controller.enqueue(
                              encoder.encode(
                                `data: ${JSON.stringify({
                                  type: "tool_result",
                                  toolUseId: toolCall.id,
                                  itemType,
                                  itemId,
                                  itemData,
                                })}\n\n`
                              )
                            );
                          }
                        }
                      } catch {
                        // Ignore parse errors
                      }
                    }
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

                  // If we used tools but got no text response, prompt the AI to continue
                  // This ensures the user always gets a conversational response after tool use
                  if (allToolUses.length > 0 && allTextParts.length === 0 && !currentLoopText) {
                    // Add a prompt to continue the conversation
                    currentMessages.push({
                      role: "user",
                      content: [{ type: "text", text: "[System: Tools executed successfully. Please provide a brief conversational response to the user about what you did.]" }],
                    });
                    // Continue the loop to get a text response
                  } else {
                    continueLoop = false;
                  }
                }
              }
            }
          }

          // Save complete assistant response to database (all text parts combined)
          // Skip saving if this was a system context message (skipSave flag)
          const fullResponse = allTextParts.join("\n\n");
          if (!body.skipSave && (fullResponse || allToolUses.length > 0)) {
            await prisma.chatMessage.create({
              data: {
                userId: dbUser.id,
                role: "assistant",
                content: fullResponse || "",
                toolUses: allToolUses.length > 0 ? JSON.parse(JSON.stringify(allToolUses)) : undefined,
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
