"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, ListTodo, Target, CheckSquare, PenLine, FileText, Sparkles, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/Button";
import { useChat } from "@/hooks/useChat";
import { QuickSuggestions } from "./QuickSuggestions";

interface ChatInterfaceProps {
  entryId?: string;
  initialMessage?: string;
  onAddToEntry?: (content: string) => void;
  onCreateEntry?: (content: string, conditions?: string[]) => void;
  onApplyStyleEdit?: (editId: string, originalText: string, suggestedText: string) => void;
}

// Helper to format tool use for display
function formatToolUse(tool: string, input: Record<string, unknown>): { icon: React.ReactNode; label: string; detail: string } {
  const iconClass = "h-3.5 w-3.5";

  switch (tool) {
    case "create_commitment":
      return {
        icon: <Target className={iconClass} />,
        label: "Tracking commitment",
        detail: (input.what as string) || "New commitment",
      };
    case "update_commitment":
      return {
        icon: <Target className={iconClass} />,
        label: "Updated commitment",
        detail: (input.status as string) || "Status changed",
      };
    case "create_task":
      return {
        icon: <CheckSquare className={iconClass} />,
        label: "Added task",
        detail: (input.what as string) || "New task",
      };
    case "update_task": {
      // Build a descriptive detail showing what changed
      const changes: string[] = [];
      if (input.status) changes.push(input.status as string);
      if (input.outcome) changes.push("with outcome");
      if (input.skipped_reason) changes.push("skipped");
      if (input.deferred_to) changes.push("rescheduled");
      return {
        icon: <CheckSquare className={iconClass} />,
        label: "Updated task",
        detail: changes.join(", ") || "Status changed",
      };
    }
    case "list_commitments":
      return {
        icon: <ListTodo className={iconClass} />,
        label: "Checking commitments",
        detail: "",
      };
    case "list_tasks":
      return {
        icon: <ListTodo className={iconClass} />,
        label: "Checking tasks",
        detail: "",
      };
    case "suggest_entry_addition":
      return {
        icon: <PenLine className={iconClass} />,
        label: "Suggesting addition",
        detail: "",
      };
    case "suggest_new_entry":
      return {
        icon: <FileText className={iconClass} />,
        label: "Suggesting new entry",
        detail: "",
      };
    case "suggest_style_edit":
      return {
        icon: <Sparkles className={iconClass} />,
        label: "Suggesting style edit",
        detail: "",
      };
    case "create_strategy":
      return {
        icon: <Lightbulb className={iconClass} />,
        label: "Tracking strategy",
        detail: (input.strategy as string)?.slice(0, 40) || "New strategy",
      };
    case "update_strategy":
      return {
        icon: <Lightbulb className={iconClass} />,
        label: "Updated strategy",
        detail: input.worked !== undefined ? (input.worked ? "Worked" : "Didn't work") : "Notes added",
      };
    case "list_strategies":
      return {
        icon: <Lightbulb className={iconClass} />,
        label: "Checking strategies",
        detail: "",
      };
    default:
      return {
        icon: <ListTodo className={iconClass} />,
        label: tool.replace(/_/g, " "),
        detail: "",
      };
  }
}

export function ChatInterface({ entryId, initialMessage, onAddToEntry, onCreateEntry, onApplyStyleEdit }: ChatInterfaceProps) {
  const [shouldSendInitial, setShouldSendInitial] = useState(false);

  const handleHistoryLoaded = useCallback((hasHistory: boolean) => {
    // Only send initial message if there's no existing chat history
    if (!hasHistory && initialMessage) {
      setShouldSendInitial(true);
    }
  }, [initialMessage]);

  const {
    messages,
    suggestions,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    clearSuggestions,
  } = useChat({
    entryId,
    onHistoryLoaded: handleHistoryLoaded,
  });

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Send initial message only if history loaded and no existing messages
  // Hide initial context from UI and don't save to database since the entry is already visible on the left
  useEffect(() => {
    if (shouldSendInitial && initialMessage && !hasInitialized.current) {
      hasInitialized.current = true;
      sendMessage(initialMessage, entryId, { hideFromUI: true, skipSave: true });
      setShouldSendInitial(false);
    }
  }, [shouldSendInitial, initialMessage, entryId, sendMessage]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message, entryId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionMessage = (message: string) => {
    sendMessage(message, entryId);
  };

  return (
    <div
      className="flex h-full flex-col rounded-2xl"
      style={{ background: "var(--background)" }}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingHistory ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Loader2
              className="h-8 w-8 animate-spin"
              style={{ color: "var(--accent)" }}
            />
            <p className="mt-4 text-sm" style={{ color: "var(--accent)" }}>
              Loading conversation...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div
              className="mb-4 rounded-2xl p-4"
            >
              <Bot className="h-8 w-8" style={{ color: "var(--accent)" }} />
            </div>
            <h3
              className="text-lg font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Start a conversation
            </h3>
            <p className="mt-1 max-w-sm text-sm" style={{ color: "var(--accent)" }}>
              Ask about your patterns, check in on commitments, or just talk through
              what's on your mind.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => {
                // Tool use bubble - distinct styling
                if (message.role === "tool" && message.toolUse) {
                  const { icon, label, detail } = formatToolUse(
                    message.toolUse.tool,
                    message.toolUse.input
                  );
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-center"
                    >
                      <div
                        className="flex items-center gap-2 rounded-full px-4 py-2 text-xs"
                        style={{
                          background: "linear-gradient(135deg, #e8dff5 0%, #d4c8e8 100%)",
                          color: "#6b5b8a",
                        }}
                      >
                        {icon}
                        <span className="font-medium">{label}</span>
                        {detail && (
                          <>
                            <span style={{ opacity: 0.5 }}>•</span>
                            <span style={{ opacity: 0.8 }}>{detail}</span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                }

                // Regular user/assistant message
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {/* Avatar - no interactive styling */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                      {message.role === "user" ? (
                        <User className="h-5 w-5" style={{ color: "var(--foreground)" }} />
                      ) : (
                        <Bot className="h-5 w-5" style={{ color: "var(--accent)" }} />
                      )}
                    </div>

                    {/* Message bubble */}
                    <div
                      className="max-w-[80%] rounded-2xl px-4 py-3"
                      style={{
                        background: "var(--background)",
                        boxShadow:
                          message.role === "user"
                            ? "var(--neu-shadow-sm)"
                            : "var(--neu-shadow-inset-sm)",
                        color: "var(--foreground)",
                      }}
                    >
                      {message.content ? (
                        message.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        )
                      ) : (
                        <span className="flex items-center gap-2 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Thinking...
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="mx-4 mb-2 rounded-xl px-4 py-2.5 text-sm"
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            boxShadow: "var(--neu-shadow-sm)",
          }}
        >
          {error}
        </div>
      )}

      {/* Quick Suggestions */}
      {!isLoading && suggestions.length > 0 && (
        <QuickSuggestions
          suggestions={suggestions}
          onSendMessage={handleSuggestionMessage}
          onAddToEntry={onAddToEntry}
          onCreateEntry={onCreateEntry}
          onApplyStyleEdit={onApplyStyleEdit}
          onDismiss={clearSuggestions}
        />
      )}

      {/* Input */}
      <div className="shrink-0 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 resize-none rounded-xl border-none px-4 py-3 text-sm placeholder:opacity-50 focus:outline-none"
            rows={1}
            style={{
              maxHeight: "120px",
              overflow: "auto",
              background: "var(--background)",
              color: "var(--foreground)",
              boxShadow: "var(--neu-shadow-inset)",
            }}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            isLoading={isLoading}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="mt-2 text-center text-xs" style={{ color: "var(--accent-soft)" }}>
          Shift + Enter for new line • Enter to send
        </p>
      </div>
    </div>
  );
}
