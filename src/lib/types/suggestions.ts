// Quick suggestion types for contextual chat actions

export type QuickSuggestionType =
  | "add_to_entry"      // Add content to journal entry
  | "new_entry"         // Create a new journal entry from draft
  | "quick_reply"       // Pre-filled reply options
  | "date_picker"       // Select date/time for deadlines
  | "confirm_action";   // Yes/No confirmation

export interface BaseSuggestion {
  id: string;
  type: QuickSuggestionType;
}

export interface AddToEntrySuggestion extends BaseSuggestion {
  type: "add_to_entry";
  label: string;
  content: string;  // The text to add to the entry
  reason?: string;  // Why this should be added
  draftId?: string; // ID of the draft in the database
  targetEntryId?: string; // ID of the entry to add to
  position?: "append" | "prepend";
}

export interface NewEntrySuggestion extends BaseSuggestion {
  type: "new_entry";
  content: string;  // The suggested entry content
  reason: string;   // Why this should be a new entry
  draftId: string;  // ID of the draft in the database
  suggestedConditions?: string[]; // Suggested mood/condition tags
}

export interface QuickReplySuggestion extends BaseSuggestion {
  type: "quick_reply";
  options: {
    label: string;
    value: string;  // The message to send
  }[];
}

export interface DatePickerSuggestion extends BaseSuggestion {
  type: "date_picker";
  label: string;
  context: string;  // e.g., "task_deadline", "commitment_target"
  targetId?: string;  // ID of task/commitment being updated
  includeTime?: boolean;
  suggestedDates?: {
    label: string;
    date: string;  // ISO string
  }[];
}

export interface ConfirmActionSuggestion extends BaseSuggestion {
  type: "confirm_action";
  question: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmValue: string;  // Message to send on confirm
  cancelValue?: string;  // Message to send on cancel (optional)
}

export type QuickSuggestion =
  | AddToEntrySuggestion
  | NewEntrySuggestion
  | QuickReplySuggestion
  | DatePickerSuggestion
  | ConfirmActionSuggestion;

// Helper to generate suggestion IDs
export function generateSuggestionId(): string {
  return `sug-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
