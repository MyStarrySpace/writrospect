"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/Button";
import { useChat } from "@/hooks/useChat";
import { QuickSuggestions } from "./QuickSuggestions";

interface ChatInterfaceProps {
  entryId?: string;
  initialMessage?: string;
  onAddToEntry?: (content: string) => void;
}

export function ChatInterface({ entryId, initialMessage, onAddToEntry }: ChatInterfaceProps) {
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
  useEffect(() => {
    if (shouldSendInitial && initialMessage && !hasInitialized.current) {
      hasInitialized.current = true;
      sendMessage(initialMessage, entryId);
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
              style={{
                background: "var(--background)",
                boxShadow: "var(--neu-shadow)",
              }}
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
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: "var(--background)",
                      boxShadow: "var(--neu-shadow-sm)",
                    }}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4" style={{ color: "var(--foreground)" }} />
                    ) : (
                      <Bot className="h-4 w-4" style={{ color: "var(--accent)" }} />
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
              ))}
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
