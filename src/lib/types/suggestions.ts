// Quick suggestion types for contextual chat actions

export type QuickSuggestionType =
  | "add_to_entry"      // Add content to journal entry
  | "new_entry"         // Create a new journal entry from draft
  | "style_edit"        // Suggest a style edit to improve writing
  | "quick_reply"       // Pre-filled reply options
  | "date_picker"       // Select date/time for deadlines
  | "confirm_action"    // Yes/No confirmation
  | "proposed_items";   // Batch of proposed tasks/habits/strategies for approval

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

export interface StyleEditSuggestion extends BaseSuggestion {
  type: "style_edit";
  originalText: string;  // The text to replace
  suggestedText: string; // The improved version
  editType: "grammar" | "clarity" | "tone" | "structure" | "voice" | "conciseness";
  explanation: string;   // Why this edit improves the entry
  targetEntryId?: string; // ID of the entry to edit
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
  context: string;  // e.g., "task_deadline", "habit_target"
  targetId?: string;  // ID of task/habit being updated
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

// Proposed item types for batch approval
export type ProposedItemType = "task" | "habit" | "strategy";

export interface ProposedTask {
  itemType: "task";
  what: string;
  context?: string;
  urgency: "now" | "today" | "this_week" | "whenever";
  dueDate?: string;
  dueTime?: string;
}

export interface ProposedHabit {
  itemType: "habit";
  what: string;
  why?: string;
  complexity: number;
  motivationType: "intrinsic" | "extrinsic" | "obligation" | "curiosity" | "growth";
}

export interface ProposedStrategy {
  itemType: "strategy";
  strategy: string;
  context: string;
  trigger?: string;
}

export type ProposedItem = ProposedTask | ProposedHabit | ProposedStrategy;

export interface ProposedItemsSuggestion extends BaseSuggestion {
  type: "proposed_items";
  items: ProposedItem[];
  entryId?: string;  // Source entry for context
  // Dependency context (set when proposed via propose_dependencies)
  parentItem?: {
    id: string;
    type: "task" | "habit" | "goal";
    title: string;
  };
}

export type QuickSuggestion =
  | AddToEntrySuggestion
  | NewEntrySuggestion
  | StyleEditSuggestion
  | QuickReplySuggestion
  | DatePickerSuggestion
  | ConfirmActionSuggestion
  | ProposedItemsSuggestion;

// Helper to generate suggestion IDs
export function generateSuggestionId(): string {
  return `sug-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
