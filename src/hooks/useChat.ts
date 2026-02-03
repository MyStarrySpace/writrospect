"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { QuickSuggestion } from "@/lib/types/suggestions";

interface ToolUse {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  // Result data for undo/edit functionality
  itemType?: string;
  itemId?: string;
  itemData?: Record<string, unknown>;
}

interface StoredToolUse {
  tool: string;
  input: Record<string, unknown>;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  timestamp: string;
  toolUse?: ToolUse;
  toolUses?: StoredToolUse[]; // Multiple tool uses from stored messages
}

interface UseChatOptions {
  entryId?: string;
  onHistoryLoaded?: (hasHistory: boolean) => void;
}

interface SendMessageOptions {
  hideFromUI?: boolean; // If true, don't show as user message in UI
  skipSave?: boolean; // If true, don't save message or response to database
}

interface UseChatReturn {
  messages: ChatMessage[];
  suggestions: QuickSuggestion[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  sendMessage: (content: string, entryId?: string, options?: SendMessageOptions) => Promise<void>;
  clearMessages: () => void;
  clearSuggestions: () => void;
  updateToolUseInput: (messageId: string, inputUpdates: Record<string, unknown>) => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { entryId, onHistoryLoaded } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<QuickSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const historyLoadedRef = useRef<string | null>(null);
  const onHistoryLoadedCalledRef = useRef<string | null>(null);

  // Load chat history when entryId changes, or signal no history for stuck mode
  useEffect(() => {
    // If no entryId (stuck mode), immediately signal no history (but only once)
    if (!entryId) {
      if (onHistoryLoadedCalledRef.current !== "no-entry") {
        onHistoryLoadedCalledRef.current = "no-entry";
        onHistoryLoaded?.(false);
      }
      return;
    }

    // Skip if we already loaded history for this entry
    if (historyLoadedRef.current === entryId) return;

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(`/api/chat?entryId=${entryId}`);
        if (response.ok) {
          const data = await response.json();
          // Transform messages: expand toolUses into separate tool messages
          const expandedMessages: ChatMessage[] = [];
          for (const msg of data.messages || []) {
            // If assistant message has tool uses, insert them before the message
            if (msg.role === "assistant" && msg.toolUses && Array.isArray(msg.toolUses)) {
              for (const tu of msg.toolUses) {
                expandedMessages.push({
                  id: `tool-${msg.id}-${tu.tool}-${Math.random().toString(36).slice(2)}`,
                  role: "tool",
                  content: "",
                  timestamp: msg.timestamp,
                  toolUse: {
                    id: tu.tool,
                    tool: tu.tool,
                    input: tu.input || {},
                  },
                });
              }
            }
            // Add the original message (without toolUses in the display data)
            expandedMessages.push({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
            });
          }
          setMessages(expandedMessages);
          historyLoadedRef.current = entryId;
          // Only call onHistoryLoaded once per entryId
          if (onHistoryLoadedCalledRef.current !== entryId) {
            onHistoryLoadedCalledRef.current = entryId;
            onHistoryLoaded?.(data.messages?.length > 0);
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [entryId, onHistoryLoaded]);

  const sendMessage = useCallback(
    async (content: string, entryId?: string, options?: SendMessageOptions) => {
      setIsLoading(true);
      setError(null);
      setSuggestions([]); // Clear previous suggestions

      // Add user message immediately (unless hidden)
      if (!options?.hideFromUI) {
        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: "user",
          content,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);
      }

      // Create placeholder for assistant message
      const assistantMessageId = `msg-${Date.now()}-assistant`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, entryId, skipSave: options?.skipSave }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulatedContent = "";
        const newSuggestions: QuickSuggestion[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "text" && data.content) {
                  accumulatedContent += data.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: accumulatedContent }
                        : m
                    )
                  );
                } else if (data.type === "tool_use" && data.tool) {
                  // Add tool use as a separate message
                  const toolMessage: ChatMessage = {
                    id: `tool-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    role: "tool",
                    content: "",
                    timestamp: new Date().toISOString(),
                    toolUse: {
                      id: data.tool,
                      tool: data.tool,
                      input: data.input || {},
                    },
                  };
                  setMessages((prev) => {
                    // Insert tool message before the assistant message placeholder
                    const assistantIndex = prev.findIndex((m) => m.id === assistantMessageId);
                    if (assistantIndex !== -1) {
                      const newMessages = [...prev];
                      newMessages.splice(assistantIndex, 0, toolMessage);
                      return newMessages;
                    }
                    return [...prev, toolMessage];
                  });
                } else if (data.type === "tool_result" && data.toolUseId) {
                  // Update the tool message with item info for undo/edit
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.toolUse?.id === data.toolUseId
                        ? {
                            ...m,
                            toolUse: {
                              ...m.toolUse,
                              itemType: data.itemType,
                              itemId: data.itemId,
                              itemData: data.itemData,
                            },
                          }
                        : m
                    )
                  );
                } else if (data.type === "suggestion" && data.suggestion) {
                  newSuggestions.push(data.suggestion);
                } else if (data.type === "suggestions" && data.suggestions) {
                  newSuggestions.push(...data.suggestions);
                } else if (data.type === "error") {
                  throw new Error(data.error);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        // Set suggestions after streaming completes
        if (newSuggestions.length > 0) {
          setSuggestions(newSuggestions);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
          // Remove the empty assistant message on error
          setMessages((prev) =>
            prev.filter((m) => m.id !== assistantMessageId)
          );
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSuggestions([]);
    setError(null);
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  const updateToolUseInput = useCallback((messageId: string, inputUpdates: Record<string, unknown>) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.toolUse
          ? {
              ...m,
              toolUse: {
                ...m.toolUse,
                input: { ...m.toolUse.input, ...inputUpdates },
              },
            }
          : m
      )
    );
  }, []);

  return {
    messages,
    suggestions,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    clearMessages,
    clearSuggestions,
    updateToolUseInput,
  };
}
