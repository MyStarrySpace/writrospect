"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type {
  QuickSuggestion,
  AddToEntrySuggestion,
  QuickReplySuggestion,
  DatePickerSuggestion,
  ConfirmActionSuggestion,
} from "@/lib/types/suggestions";

interface QuickSuggestionsProps {
  suggestions: QuickSuggestion[];
  onSendMessage: (message: string) => void;
  onAddToEntry?: (content: string) => void;
  onDismiss: () => void;
}

export function QuickSuggestions({
  suggestions,
  onSendMessage,
  onAddToEntry,
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
  onDismiss: () => void;
}

function SuggestionItem({
  suggestion,
  onSendMessage,
  onAddToEntry,
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

// Add to Entry Button
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

  const handleClick = () => {
    if (onAddToEntry) {
      onAddToEntry(suggestion.content);
      setAdded(true);
      setTimeout(onDismiss, 1500);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={added}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200"
      style={added ? neuPillActiveStyle : neuPillStyle}
    >
      {added ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Added
        </>
      ) : (
        <>
          <Plus className="h-3.5 w-3.5" />
          {suggestion.label}
        </>
      )}
    </button>
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
