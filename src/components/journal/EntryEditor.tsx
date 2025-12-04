"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Clock, X, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const CONDITION_OPTIONS = [
  "tired",
  "energized",
  "stressed",
  "calm",
  "anxious",
  "focused",
  "scattered",
  "motivated",
  "overwhelmed",
  "hopeful",
];

interface EntryEditorProps {
  onSubmit: (content: string, conditions: string[], specificDateTime?: string) => Promise<void>;
  isSubmitting?: boolean;
  placeholder?: string;
}

export function EntryEditor({
  onSubmit,
  isSubmitting = false,
  placeholder = "What's on your mind? What happened today? What are you committing to?",
}: EntryEditorProps) {
  const [content, setContent] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [showConditions, setShowConditions] = useState(false);
  const [customCondition, setCustomCondition] = useState("");
  const [showDateTime, setShowDateTime] = useState(false);
  const [specificDate, setSpecificDate] = useState("");
  const [specificTime, setSpecificTime] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    // Combine date and time into ISO string if both are provided
    let specificDateTime: string | undefined;
    if (specificDate && specificTime) {
      specificDateTime = new Date(`${specificDate}T${specificTime}`).toISOString();
    } else if (specificDate) {
      // If only date is provided, use noon as default time
      specificDateTime = new Date(`${specificDate}T12:00`).toISOString();
    }

    await onSubmit(content.trim(), conditions, specificDateTime);
    setContent("");
    setConditions([]);
    setShowConditions(false);
    setShowDateTime(false);
    setSpecificDate("");
    setSpecificTime("");
  };

  const toggleCondition = (condition: string) => {
    setConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  const addCustomCondition = () => {
    if (customCondition.trim() && !conditions.includes(customCondition.trim())) {
      setConditions((prev) => [...prev, customCondition.trim()]);
      setCustomCondition("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
        style={{ minHeight: "120px" }}
        disabled={isSubmitting}
      />

      {/* Selected conditions */}
      <AnimatePresence>
        {conditions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex flex-wrap gap-2"
          >
            {conditions.map((condition) => (
              <Badge
                key={condition}
                variant="info"
                className="cursor-pointer"
                onClick={() => toggleCondition(condition)}
              >
                {condition}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conditions selector */}
      <AnimatePresence>
        {showConditions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800"
          >
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              How are you feeling? (optional)
            </p>
            <div className="flex flex-wrap gap-2">
              {CONDITION_OPTIONS.map((condition) => (
                <Badge
                  key={condition}
                  variant={conditions.includes(condition) ? "info" : "default"}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleCondition(condition)}
                >
                  {condition}
                </Badge>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomCondition();
                  }
                }}
                placeholder="Add custom..."
                className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={addCustomCondition}
                disabled={!customCondition.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date/Time selector */}
      <AnimatePresence>
        {showDateTime && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800"
          >
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              When did this happen? (optional)
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 dark:text-zinc-400">Date</label>
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 dark:text-zinc-400">Time</label>
                <input
                  type="time"
                  value={specificTime}
                  onChange={(e) => setSpecificTime(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>
              {(specificDate || specificTime) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSpecificDate("");
                    setSpecificTime("");
                  }}
                  className="self-end"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
            {specificDate && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                This entry will be tagged for {specificDate}
                {specificTime && ` at ${specificTime}`}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowConditions(!showConditions)}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <Clock className="h-4 w-4" />
            {showConditions ? "Hide conditions" : "Add conditions"}
          </button>
          <button
            onClick={() => setShowDateTime(!showDateTime)}
            className={`flex items-center gap-1.5 text-sm hover:text-zinc-700 dark:hover:text-zinc-300 ${
              specificDate ? "text-blue-500" : "text-zinc-500"
            }`}
          >
            <Calendar className="h-4 w-4" />
            {showDateTime ? "Hide date/time" : specificDate ? "Edit date/time" : "Set date/time"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">⌘ + Enter to submit</span>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            isLoading={isSubmitting}
            rightIcon={<Send className="h-4 w-4" />}
          >
            Post
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
