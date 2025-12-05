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
  isCompact?: boolean;
  onContentChange?: (content: string) => void;
}

export function EntryEditor({
  onSubmit,
  isSubmitting = false,
  placeholder = "What's on your mind? What happened today? What are you committing to?",
  isCompact = false,
  onContentChange,
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
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
      className="rounded-3xl p-[2px]"
      style={{
        background: "linear-gradient(135deg, #DED0DD 0%, #E0D2DF 100%)",
        boxShadow: "6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light)",
      }}
    >
      <motion.div
        layout
        className="rounded-[22px]"
        style={{
          background: "var(--background)",
          boxShadow: "inset 4px 4px 12px var(--shadow-dark), inset -4px -4px 12px var(--shadow-light)",
        }}
      >
        <motion.textarea
          layout
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            onContentChange?.(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={isCompact ? "Quick note..." : placeholder}
          className="w-full resize-none px-6 pt-4 pb-2 focus:outline-none"
          style={{
            background: "transparent",
            color: "var(--foreground)",
            minHeight: isCompact ? "80px" : "140px",
            resize: "none",
          }}
          disabled={isSubmitting}
        />

      {/* Selected conditions */}
      <AnimatePresence>
        {conditions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-1 flex flex-wrap gap-2"
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
            className="mx-4 mt-2 border-t pt-4"
            style={{ borderColor: "var(--shadow-dark)" }}
          >
            <p className="mb-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>
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
                className="flex-1 rounded-xl px-3 py-1.5 text-sm focus:outline-none"
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  boxShadow: "var(--neu-shadow-inset-sm)",
                }}
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
            className="mx-4 mt-2 border-t pt-4"
            style={{ borderColor: "var(--shadow-dark)" }}
          >
            <p className="mb-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>
              When did this happen? (optional)
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: "var(--accent)" }}>Date</label>
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className="rounded-xl px-3 py-1.5 text-sm focus:outline-none"
                  style={{
                    background: "var(--background)",
                    color: "var(--foreground)",
                    boxShadow: "var(--neu-shadow-inset-sm)",
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: "var(--accent)" }}>Time</label>
                <input
                  type="time"
                  value={specificTime}
                  onChange={(e) => setSpecificTime(e.target.value)}
                  className="rounded-xl px-3 py-1.5 text-sm focus:outline-none"
                  style={{
                    background: "var(--background)",
                    color: "var(--foreground)",
                    boxShadow: "var(--neu-shadow-inset-sm)",
                  }}
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
              <p className="mt-2 text-xs" style={{ color: "var(--accent)" }}>
                This entry will be tagged for {specificDate}
                {specificTime && ` at ${specificTime}`}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <motion.div layout className="mx-4 mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 ml-2 mb-4">
          <button
            onClick={() => setShowConditions(!showConditions)}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: showConditions ? "var(--foreground)" : "var(--accent)" }}
          >
            <Clock className="h-4 w-4" />
            {showConditions ? "Hide conditions" : "Add conditions"}
          </button>
          <button
            onClick={() => setShowDateTime(!showDateTime)}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: specificDate ? "var(--accent-primary)" : "var(--accent)" }}
          >
            <Calendar className="h-4 w-4" />
            {showDateTime ? "Hide date/time" : specificDate ? "Edit date/time" : "Set date/time"}
          </button>
        </div>

        <div className="flex items-center gap-2 mr-2 mb-4">
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            isLoading={isSubmitting}
            rightIcon={<Send className="h-4 w-4" />}
          >
            Post
          </Button>
        </div>
      </motion.div>
      </motion.div>
    </motion.div>
  );
}
