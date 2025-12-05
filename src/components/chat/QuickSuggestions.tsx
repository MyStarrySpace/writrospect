"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, Check, X, FileText, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type {
  QuickSuggestion,
  AddToEntrySuggestion,
  NewEntrySuggestion,
  StyleEditSuggestion,
  QuickReplySuggestion,
  DatePickerSuggestion,
  ConfirmActionSuggestion,
} from "@/lib/types/suggestions";

interface QuickSuggestionsProps {
  suggestions: QuickSuggestion[];
  onSendMessage: (message: string) => void;
  onAddToEntry?: (content: string) => void;
  onCreateEntry?: (content: string, conditions?: string[]) => void;
  onApplyStyleEdit?: (editId: string, originalText: string, suggestedText: string) => void;
  onDismiss: () => void;
}

export function QuickSuggestions({
  suggestions,
  onSendMessage,
  onAddToEntry,
  onCreateEntry,
  onApplyStyleEdit,
  onDismiss,
}: QuickSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex flex-wrap gap-2 px-4 py-3"
        style={{ background: "var(--background)" }}
      >
        {suggestions.map((suggestion) => (
          <SuggestionItem
            key={suggestion.id}
            suggestion={suggestion}
            onSendMessage={onSendMessage}
            onAddToEntry={onAddToEntry}
            onCreateEntry={onCreateEntry}
            onApplyStyleEdit={onApplyStyleEdit}
            onDismiss={onDismiss}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

interface SuggestionItemProps {
  suggestion: QuickSuggestion;
  onSendMessage: (message: string) => void;
  onAddToEntry?: (content: string) => void;
  onCreateEntry?: (content: string, conditions?: string[]) => void;
  onApplyStyleEdit?: (editId: string, originalText: string, suggestedText: string) => void;
  onDismiss: () => void;
}

function SuggestionItem({
  suggestion,
  onSendMessage,
  onAddToEntry,
  onCreateEntry,
  onApplyStyleEdit,
  onDismiss,
}: SuggestionItemProps) {
  switch (suggestion.type) {
    case "add_to_entry":
      return (
        <AddToEntryButton
          suggestion={suggestion}
          onAddToEntry={onAddToEntry}
          onDismiss={onDismiss}
        />
      );
    case "new_entry":
      return (
        <NewEntryButton
          suggestion={suggestion}
          onCreateEntry={onCreateEntry}
          onDismiss={onDismiss}
        />
      );
    case "style_edit":
      return (
        <StyleEditButton
          suggestion={suggestion}
          onApplyStyleEdit={onApplyStyleEdit}
          onDismiss={onDismiss}
        />
      );
    case "quick_reply":
      return (
        <QuickReplyButtons
          suggestion={suggestion}
          onSendMessage={onSendMessage}
          onDismiss={onDismiss}
        />
      );
    case "date_picker":
      return (
        <DatePickerButton
          suggestion={suggestion}
          onSendMessage={onSendMessage}
          onDismiss={onDismiss}
        />
      );
    case "confirm_action":
      return (
        <ConfirmButtons
          suggestion={suggestion}
          onSendMessage={onSendMessage}
          onDismiss={onDismiss}
        />
      );
    default:
      return null;
  }
}

// Neomorphism pill button style
const neuPillStyle: React.CSSProperties = {
  background: "var(--background)",
  boxShadow: "var(--neu-shadow-subtle)",
  color: "var(--foreground)",
};

const neuPillActiveStyle: React.CSSProperties = {
  background: "#d1fae5",
  boxShadow: "var(--neu-shadow-subtle)",
  color: "#065f46",
};

// Add to Entry Button - shows expandable content preview
function AddToEntryButton({
  suggestion,
  onAddToEntry,
  onDismiss,
}: {
  suggestion: AddToEntrySuggestion;
  onAddToEntry?: (content: string) => void;
  onDismiss: () => void;
}) {
  const [added, setAdded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    if (!expanded) {
      setExpanded(true);
      return;
    }
    if (onAddToEntry) {
      onAddToEntry(suggestion.content);
      setAdded(true);
      setTimeout(onDismiss, 1500);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss();
  };

  if (added) {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium"
        style={neuPillActiveStyle}
      >
        <Check className="h-3.5 w-3.5" />
        Added to entry
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--background)",
        boxShadow: "var(--neu-shadow)",
      }}
    >
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-3 text-sm w-full text-left"
        style={{ color: "var(--foreground)" }}
      >
        <PenLine className="h-4 w-4 flex-shrink-0" style={{ color: "var(--accent)" }} />
        <div className="flex-1 min-w-0">
          <div className="font-medium">Add to entry</div>
          {suggestion.reason && (
            <div className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>
              {suggestion.reason}
            </div>
          )}
        </div>
        <X
          className="h-4 w-4 flex-shrink-0 cursor-pointer opacity-50 hover:opacity-100"
          onClick={handleDismiss}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 py-3 text-sm"
              style={{
                borderTop: "1px solid var(--shadow-dark)",
                background: "var(--background)",
                boxShadow: "var(--neu-shadow-inset-sm)",
              }}
            >
              <p className="text-xs mb-2 font-medium" style={{ color: "var(--accent)" }}>
                Content to add:
              </p>
              <p style={{ color: "var(--foreground)" }}>{suggestion.content}</p>
              <div className="flex gap-2 mt-3 justify-end">
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleClick}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// New Entry Button - create a new journal entry from suggestion
function NewEntryButton({
  suggestion,
  onCreateEntry,
  onDismiss,
}: {
  suggestion: NewEntrySuggestion;
  onCreateEntry?: (content: string, conditions?: string[]) => void;
  onDismiss: () => void;
}) {
  const [created, setCreated] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    if (!expanded) {
      setExpanded(true);
      return;
    }
    if (onCreateEntry) {
      onCreateEntry(suggestion.content, suggestion.suggestedConditions);
      setCreated(true);
      setTimeout(onDismiss, 1500);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss();
  };

  if (created) {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium"
        style={neuPillActiveStyle}
      >
        <Check className="h-3.5 w-3.5" />
        Entry created
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--background)",
        boxShadow: "var(--neu-shadow)",
      }}
    >
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-3 text-sm w-full text-left"
        style={{ color: "var(--foreground)" }}
      >
        <FileText className="h-4 w-4 flex-shrink-0" style={{ color: "var(--accent)" }} />
        <div className="flex-1 min-w-0">
          <div className="font-medium">Create new entry</div>
          {suggestion.reason && (
            <div className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>
              {suggestion.reason}
            </div>
          )}
        </div>
        <X
          className="h-4 w-4 flex-shrink-0 cursor-pointer opacity-50 hover:opacity-100"
          onClick={handleDismiss}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 py-3 text-sm"
              style={{
                borderTop: "1px solid var(--shadow-dark)",
                background: "var(--background)",
                boxShadow: "var(--neu-shadow-inset-sm)",
              }}
            >
              <p className="text-xs mb-2 font-medium" style={{ color: "var(--accent)" }}>
                Suggested entry:
              </p>
              <p style={{ color: "var(--foreground)" }}>
                {suggestion.content.length > 200
                  ? suggestion.content.slice(0, 200) + "..."
                  : suggestion.content}
              </p>
              {suggestion.suggestedConditions && suggestion.suggestedConditions.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {suggestion.suggestedConditions.map((condition) => (
                    <span
                      key={condition}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "#e8dff5",
                        color: "#6b5b8a",
                      }}
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-3 justify-end">
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleClick}>
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Create
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Style Edit Button - show diff and allow accept/reject
function StyleEditButton({
  suggestion,
  onApplyStyleEdit,
  onDismiss,
}: {
  suggestion: StyleEditSuggestion;
  onApplyStyleEdit?: (editId: string, originalText: string, suggestedText: string) => void;
  onDismiss: () => void;
}) {
  const [applied, setApplied] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAccept = () => {
    if (!expanded) {
      setExpanded(true);
      return;
    }
    if (onApplyStyleEdit) {
      onApplyStyleEdit(suggestion.id, suggestion.originalText, suggestion.suggestedText);
      setApplied(true);
      // Send feedback to API
      fetch("/api/style-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editId: suggestion.id, accepted: true }),
      }).catch(console.error);
      setTimeout(onDismiss, 1500);
    }
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Send rejection feedback to API
    fetch("/api/style-edits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editId: suggestion.id, accepted: false }),
    }).catch(console.error);
    setRejected(true);
    setTimeout(onDismiss, 1000);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss();
  };

  if (applied) {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium"
        style={neuPillActiveStyle}
      >
        <Check className="h-3.5 w-3.5" />
        Edit applied
      </div>
    );
  }

  if (rejected) {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium"
        style={neuPillStyle}
      >
        <X className="h-3.5 w-3.5" />
        Skipped
      </div>
    );
  }

  // Edit type labels for display
  const editTypeLabels: Record<string, string> = {
    grammar: "Grammar",
    clarity: "Clarity",
    tone: "Tone",
    structure: "Structure",
    voice: "Voice",
    conciseness: "Conciseness",
  };

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--background)",
        boxShadow: "var(--neu-shadow)",
      }}
    >
      <button
        onClick={handleAccept}
        className="flex items-center gap-2 px-4 py-3 text-sm w-full text-left"
        style={{ color: "var(--foreground)" }}
      >
        <Sparkles className="h-4 w-4 flex-shrink-0" style={{ color: "#8b5cf6" }} />
        <div className="flex-1 min-w-0">
          <div className="font-medium flex items-center gap-2">
            Style suggestion
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "#f3e8ff",
                color: "#7c3aed",
              }}
            >
              {editTypeLabels[suggestion.editType] || suggestion.editType}
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>
            {suggestion.explanation}
          </div>
        </div>
        <X
          className="h-4 w-4 flex-shrink-0 cursor-pointer opacity-50 hover:opacity-100"
          onClick={handleDismiss}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 py-3 text-sm space-y-3"
              style={{
                borderTop: "1px solid var(--shadow-dark)",
                background: "var(--background)",
                boxShadow: "var(--neu-shadow-inset-sm)",
              }}
            >
              {/* Original text */}
              <div>
                <p className="text-xs mb-1 font-medium" style={{ color: "#ef4444" }}>
                  Original:
                </p>
                <p
                  className="p-2 rounded-lg text-sm"
                  style={{
                    background: "#fef2f2",
                    color: "#991b1b",
                    textDecoration: "line-through",
                    opacity: 0.8,
                  }}
                >
                  {suggestion.originalText}
                </p>
              </div>

              {/* Suggested text */}
              <div>
                <p className="text-xs mb-1 font-medium" style={{ color: "#22c55e" }}>
                  Suggested:
                </p>
                <p
                  className="p-2 rounded-lg text-sm"
                  style={{
                    background: "#f0fdf4",
                    color: "#166534",
                  }}
                >
                  {suggestion.suggestedText}
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={handleReject}>
                  <X className="h-3.5 w-3.5 mr-1" />
                  Skip
                </Button>
                <Button size="sm" onClick={handleAccept}>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Apply
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Quick Reply Buttons
function QuickReplyButtons({
  suggestion,
  onSendMessage,
  onDismiss,
}: {
  suggestion: QuickReplySuggestion;
  onSendMessage: (message: string) => void;
  onDismiss: () => void;
}) {
  const handleClick = (value: string) => {
    onSendMessage(value);
    onDismiss();
  };

  return (
    <>
      {suggestion.options.map((option, index) => (
        <button
          key={index}
          onClick={() => handleClick(option.value)}
          className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={neuPillStyle}
        >
          {option.label}
        </button>
      ))}
    </>
  );
}

// Date Picker Button
function DatePickerButton({
  suggestion,
  onSendMessage,
  onDismiss,
}: {
  suggestion: DatePickerSuggestion;
  onSendMessage: (message: string) => void;
  onDismiss: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("12:00");

  const handleQuickDate = (date: string, label: string) => {
    onSendMessage(label);
    onDismiss();
  };

  const handleCustomDate = () => {
    if (!selectedDate) return;

    let message = selectedDate;
    if (suggestion.includeTime && selectedTime) {
      message += ` at ${selectedTime}`;
    }
    onSendMessage(message);
    onDismiss();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm" style={{ color: "var(--accent)" }}>
        {suggestion.label}:
      </span>

      {/* Quick date options */}
      {suggestion.suggestedDates?.map((dateOption, index) => (
        <button
          key={index}
          onClick={() => handleQuickDate(dateOption.date, dateOption.label)}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "#fef3c7",
            boxShadow: "2px 2px 4px rgba(0,0,0,0.1)",
            color: "#92400e",
          }}
        >
          <Calendar className="h-3.5 w-3.5" />
          {dateOption.label}
        </button>
      ))}

      {/* Custom date picker toggle */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={neuPillStyle}
      >
        <Calendar className="h-3.5 w-3.5" />
        Pick date
      </button>

      {/* Custom date picker */}
      {showPicker && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 rounded-xl p-3"
          style={{
            background: "var(--background)",
            boxShadow: "var(--neu-shadow)",
          }}
        >
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border-none px-3 py-1.5 text-sm"
            style={{
              background: "var(--background)",
              color: "var(--foreground)",
              boxShadow: "var(--neu-shadow-inset-sm)",
            }}
          />
          {suggestion.includeTime && (
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="rounded-lg border-none px-3 py-1.5 text-sm"
              style={{
                background: "var(--background)",
                color: "var(--foreground)",
                boxShadow: "var(--neu-shadow-inset-sm)",
              }}
            />
          )}
          <Button size="sm" onClick={handleCustomDate} disabled={!selectedDate}>
            Set
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// Confirm Action Buttons
function ConfirmButtons({
  suggestion,
  onSendMessage,
  onDismiss,
}: {
  suggestion: ConfirmActionSuggestion;
  onSendMessage: (message: string) => void;
  onDismiss: () => void;
}) {
  const handleConfirm = () => {
    onSendMessage(suggestion.confirmValue);
    onDismiss();
  };

  const handleCancel = () => {
    if (suggestion.cancelValue) {
      onSendMessage(suggestion.cancelValue);
    }
    onDismiss();
  };

  return (
    <div className="flex items-center gap-2">
      {suggestion.question && (
        <span className="text-sm" style={{ color: "var(--accent)" }}>
          {suggestion.question}
        </span>
      )}
      <button
        onClick={handleConfirm}
        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: "#d1fae5",
          boxShadow: "2px 2px 4px rgba(0,0,0,0.1)",
          color: "#065f46",
        }}
      >
        <Check className="h-3.5 w-3.5" />
        {suggestion.confirmLabel || "Yes"}
      </button>
      <button
        onClick={handleCancel}
        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={neuPillStyle}
      >
        <X className="h-3.5 w-3.5" />
        {suggestion.cancelLabel || "No"}
      </button>
    </div>
  );
}
