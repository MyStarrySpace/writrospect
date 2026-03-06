"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, Loader2 } from "lucide-react";
import { CheckInCard } from "./CheckInCard";
import type { CheckInItem, QuickAction } from "@/app/api/check-in/route";

interface CheckInModeProps {
  onComplete: (responses: CheckInResponse[]) => void;
  onDismiss: () => void;
}

export interface CheckInResponse {
  item: CheckInItem;
  action: QuickAction | "skipped";
}

export function CheckInMode({ onComplete, onDismiss }: CheckInModeProps) {
  const [items, setItems] = useState<CheckInItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<CheckInResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch check-in items on mount
  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await fetch("/api/check-in");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch check-in items");
        }

        if (data.shouldTrigger && data.items.length > 0) {
          setItems(data.items);
        } else {
          // No items to check in on - auto-dismiss
          onDismiss();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load items");
      } finally {
        setIsLoading(false);
      }
    }

    fetchItems();
  }, [onDismiss]);

  const handleAction = useCallback(
    async (item: CheckInItem, action: QuickAction) => {
      setIsProcessing(true);

      try {
        // Execute the action via API
        const endpoint =
          item.type === "task"
            ? `/api/tasks/${item.id}`
            : item.type === "habit"
              ? `/api/habits/${item.id}`
              : `/api/goals/${item.id}`;

        let updateData: Record<string, unknown> = {};

        if (item.type === "task") {
          switch (action.action) {
            case "complete":
              updateData = { status: "completed" };
              break;
            case "skip":
              updateData = { status: "skipped" };
              break;
            case "defer":
              // Defer to tomorrow
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(9, 0, 0, 0);
              updateData = { status: "deferred", deferredTo: tomorrow.toISOString() };
              break;
          }
        } else if (item.type === "habit") {
          // For habits, just update the updatedAt timestamp
          // In a real app, you might have a habit log table
          switch (action.action) {
            case "log_success":
            case "log_missed":
            case "skip_today":
              // Touch the record to update timestamp
              updateData = { updatedAt: new Date().toISOString() };
              break;
          }
        } else if (item.type === "goal") {
          // Goals handled separately - skip for now
          if (action.action === "skip") {
            // Do nothing, just move on
          }
        }

        if (Object.keys(updateData).length > 0) {
          await fetch(endpoint, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          });
        }

        // Record the response
        const newResponse: CheckInResponse = { item, action };
        const updatedResponses = [...responses, newResponse];
        setResponses(updatedResponses);

        // Move to next item or complete
        if (currentIndex < items.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          onComplete(updatedResponses);
        }
      } catch (err) {
        console.error("Error processing action:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [currentIndex, items.length, responses, onComplete]
  );

  const handleSkip = useCallback(() => {
    const item = items[currentIndex];
    const newResponse: CheckInResponse = { item, action: "skipped" };
    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete(updatedResponses);
    }
  }, [currentIndex, items, responses, onComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isLoading || isProcessing || items.length === 0) return;

      const currentItem = items[currentIndex];

      // Alt+1, Alt+2, Alt+3, Alt+4 for quick actions
      if (e.altKey && e.key >= "1" && e.key <= "4") {
        const actionKey = parseInt(e.key);
        const action = currentItem.actions.find((a) => a.key === actionKey);
        if (action) {
          e.preventDefault();
          handleAction(currentItem, action);
        }
      }

      // Enter to skip current item
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSkip();
      }

      // Escape to dismiss check-in mode
      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isLoading,
    isProcessing,
    items,
    currentIndex,
    handleAction,
    handleSkip,
    onDismiss,
  ]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
        <p className="mt-4 text-sm" style={{ color: "var(--accent)" }}>
          Loading check-in...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm" style={{ color: "#991b1b" }}>
          {error}
        </p>
        <button
          onClick={onDismiss}
          className="mt-4 text-sm underline"
          style={{ color: "var(--accent)" }}
        >
          Continue to chat
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--shadow-dark)" }}>
        <div>
          <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>
            Quick Check-in
          </h2>
          <p className="text-xs" style={{ color: "var(--accent)" }}>
            {currentIndex + 1} of {items.length} items
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="p-2 rounded-xl transition-colors hover:bg-[var(--shadow-light)]"
          style={{ color: "var(--accent)" }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1" style={{ background: "var(--shadow-dark)" }}>
        <motion.div
          className="h-full"
          style={{ background: "var(--foreground)" }}
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <CheckInCard
              item={items[currentIndex]}
              index={0}
              isActive={true}
              onAction={handleAction}
              onSkip={handleSkip}
            />
          </motion.div>
        </AnimatePresence>

        {/* Upcoming items preview */}
        {items.length > 1 && currentIndex < items.length - 1 && (
          <div className="mt-6">
            <p className="text-xs mb-3" style={{ color: "var(--accent)" }}>
              Coming up...
            </p>
            <div className="space-y-2 opacity-50">
              {items.slice(currentIndex + 1, currentIndex + 3).map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl"
                  style={{ background: "var(--shadow-light)" }}
                >
                  <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                    {item.type === "task" ? "📋" : item.type === "habit" ? "🔄" : "🎯"}
                  </span>
                  <span
                    className="text-sm truncate"
                    style={{ color: "var(--foreground)" }}
                  >
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer with keyboard hints */}
      <div
        className="hidden sm:block px-4 py-3 text-center text-xs border-t"
        style={{ borderColor: "var(--shadow-dark)", color: "var(--accent)" }}
      >
        <span className="opacity-75">
          Alt+1/2/3 for actions • Enter to pass • Esc to exit
        </span>
      </div>
    </div>
  );
}
