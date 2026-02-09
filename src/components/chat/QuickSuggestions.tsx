"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, Check, X, FileText, PenLine, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type {
  QuickSuggestion,
  AddToEntrySuggestion,
  NewEntrySuggestion,
  StyleEditSuggestion,
  QuickReplySuggestion,
  DatePickerSuggestion,
  ConfirmActionSuggestion,
  ProposedItemsSuggestion,
  ProposedItem,
} from "@/lib/types/suggestions";

interface QuickSuggestionsProps {
  suggestions: QuickSuggestion[];
  onSendMessage: (message: string) => void;
  onAddToEntry?: (content: string) => void;
  onCreateEntry?: (content: string, conditions?: string[]) => void;
  onApplyStyleEdit?: (editId: string, originalText: string, suggestedText: string) => void;
  onApproveItems?: (items: ProposedItem[], entryId?: string) => void;
  onDismiss: () => void;
}

export function QuickSuggestions({
  suggestions,
  onSendMessage,
  onAddToEntry,
  onCreateEntry,
  onApplyStyleEdit,
  onApproveItems,
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
            onApproveItems={onApproveItems}
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
  onApproveItems?: (items: ProposedItem[], entryId?: string) => void;
  onDismiss: () => void;
}

function SuggestionItem({
  suggestion,
  onSendMessage,
  onAddToEntry,
  onCreateEntry,
  onApplyStyleEdit,
  onApproveItems,
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
    case "proposed_items":
      return (
        <ProposedItemsTable
          suggestion={suggestion}
          onApproveItems={onApproveItems}
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

// Proposed Items Table - shows batch of items for approval
function ProposedItemsTable({
  suggestion,
  onApproveItems,
  onDismiss,
}: {
  suggestion: ProposedItemsSuggestion;
  onApproveItems?: (items: ProposedItem[], entryId?: string) => void;
  onDismiss: () => void;
}) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(
    new Set(suggestion.items.map((_, i) => i))
  );
  const [editedItems, setEditedItems] = useState<Map<number, ProposedItem>>(new Map());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleItem = (index: number) => {
    if (editingIndex !== null) return; // Don't toggle while editing
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const startEditing = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = getEffectiveItem(index);
    const currentValue = item.itemType === "strategy" ? item.strategy : item.what;
    setEditValue(currentValue || "");
    setEditingIndex(index);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const saveEdit = (index: number) => {
    if (!editValue.trim()) {
      cancelEditing();
      return;
    }
    const originalItem = suggestion.items[index];
    const existingEdits = editedItems.get(index) || { ...originalItem };

    // Update the appropriate field based on item type
    const updatedItem: ProposedItem = { ...existingEdits };
    if (updatedItem.itemType === "strategy") {
      updatedItem.strategy = editValue.trim();
    } else {
      updatedItem.what = editValue.trim();
    }

    const newEditedItems = new Map(editedItems);
    newEditedItems.set(index, updatedItem);
    setEditedItems(newEditedItems);
    setEditingIndex(null);
    setEditValue("");
  };

  // Get the effective item (edited version if exists, otherwise original)
  const getEffectiveItem = (index: number): ProposedItem => {
    return editedItems.get(index) || suggestion.items[index];
  };

  const handleApprove = async () => {
    if (!onApproveItems || selectedItems.size === 0) return;
    setSaving(true);
    // Use edited items where available
    const itemsToApprove = Array.from(selectedItems).map(i => getEffectiveItem(i));
    await onApproveItems(itemsToApprove, suggestion.entryId);
    setSaved(true);
    setTimeout(onDismiss, 1500);
  };

  const getItemTypeLabel = (item: ProposedItem) => {
    switch (item.itemType) {
      case "task": return "Task";
      case "habit": return "Habit";
      case "strategy": return "Strategy";
    }
  };

  const getItemTypeColor = (item: ProposedItem) => {
    switch (item.itemType) {
      case "task": return { bg: "#dbeafe", text: "#1e40af" };
      case "habit": return { bg: "#fef3c7", text: "#92400e" };
      case "strategy": return { bg: "#e8dff5", text: "#6b5b8a" };
    }
  };

  const getItemDescription = (item: ProposedItem) => {
    if (item.itemType === "task") return item.what;
    if (item.itemType === "habit") return item.what;
    return item.strategy;
  };

  const getItemDetail = (item: ProposedItem) => {
    if (item.itemType === "task" && item.urgency) {
      const urgencyLabels: Record<string, string> = {
        now: "Urgent",
        today: "Today",
        this_week: "This week",
        whenever: "Whenever",
      };
      return urgencyLabels[item.urgency] || item.urgency;
    }
    if (item.itemType === "strategy" && item.trigger) {
      return `When: ${item.trigger}`;
    }
    return null;
  };

  if (saved) {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium"
        style={neuPillActiveStyle}
      >
        <Check className="h-3.5 w-3.5" />
        {selectedItems.size} item(s) saved
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: "var(--background)",
        boxShadow: "var(--neu-shadow)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--shadow-dark)" }}
      >
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4" style={{ color: "var(--accent)" }} />
          <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
            Review suggested items
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "#f3f4f6", color: "#6b7280" }}
          >
            {selectedItems.size}/{suggestion.items.length} selected
          </span>
        </div>
        <X
          className="h-4 w-4 cursor-pointer opacity-50 hover:opacity-100"
          style={{ color: "var(--accent)" }}
          onClick={onDismiss}
        />
      </div>

      {/* Items table */}
      <div className="px-2 py-2">
        <table className="w-full text-sm">
          <tbody>
            {suggestion.items.map((_, index) => {
              const item = getEffectiveItem(index);
              const colors = getItemTypeColor(item);
              const isSelected = selectedItems.has(index);
              const isEditing = editingIndex === index;
              const wasEdited = editedItems.has(index);
              return (
                <tr
                  key={index}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleItem(index)}
                  style={{
                    opacity: isSelected ? 1 : 0.5,
                  }}
                >
                  <td className="py-2 px-2 w-8">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{
                        background: isSelected ? "#d1fae5" : "var(--background)",
                        boxShadow: isSelected ? "none" : "var(--neu-shadow-inset-sm)",
                      }}
                    >
                      {isSelected && <Check className="h-3 w-3" style={{ color: "#065f46" }} />}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {getItemTypeLabel(item)}
                    </span>
                  </td>
                  <td className="py-2 px-2" style={{ color: "var(--foreground)" }}>
                    {isEditing ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 rounded-lg border px-2 py-1 text-sm"
                          style={{
                            background: "var(--background)",
                            borderColor: "var(--accent-soft)",
                            color: "var(--foreground)",
                          }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(index);
                            if (e.key === "Escape") cancelEditing();
                          }}
                        />
                        <button
                          onClick={() => saveEdit(index)}
                          className="rounded p-1 transition-colors"
                          style={{ background: "#dcfce7", color: "#166534" }}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="rounded p-1 transition-colors"
                          style={{ background: "#fee2e2", color: "#991b1b" }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={wasEdited ? "italic" : ""}>
                          {getItemDescription(item)}
                        </span>
                        {wasEdited && (
                          <span className="text-xs" style={{ color: "var(--accent)" }}>(edited)</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2 text-xs" style={{ color: "var(--accent)" }}>
                    {!isEditing && getItemDetail(item)}
                  </td>
                  <td className="py-2 px-1 w-8">
                    {!isEditing && (
                      <button
                        onClick={(e) => startEditing(index, e)}
                        className="rounded p-1 opacity-50 hover:opacity-100 transition-opacity"
                        title="Edit"
                      >
                        <Pencil className="h-3 w-3" style={{ color: "var(--accent)" }} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with actions */}
      <div
        className="flex items-center justify-end gap-2 px-4 py-3"
        style={{ borderTop: "1px solid var(--shadow-dark)" }}
      >
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Skip all
        </Button>
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={selectedItems.size === 0 || saving}
          isLoading={saving}
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Save {selectedItems.size} item(s)
        </Button>
      </div>
    </motion.div>
  );
}
