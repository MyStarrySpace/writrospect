import type {
  QuickSuggestion,
  AddToEntrySuggestion,
  QuickReplySuggestion,
  DatePickerSuggestion,
  ConfirmActionSuggestion,
} from "@/lib/types/suggestions";

let suggestionCounter = 0;

function generateId(): string {
  return `sug-${Date.now()}-${++suggestionCounter}`;
}

/**
 * Create a suggestion to add content to the journal entry
 */
export function createAddToEntrySuggestion(
  label: string,
  content: string
): AddToEntrySuggestion {
  return {
    id: generateId(),
    type: "add_to_entry",
    label,
    content,
  };
}

/**
 * Create quick reply buttons
 */
export function createQuickReplySuggestion(
  options: { label: string; value: string }[]
): QuickReplySuggestion {
  return {
    id: generateId(),
    type: "quick_reply",
    options,
  };
}

/**
 * Create a date picker for deadlines
 */
export function createDatePickerSuggestion(
  label: string,
  options: {
    context: string;
    targetId?: string;
    includeTime?: boolean;
    suggestedDates?: { label: string; date: string }[];
  }
): DatePickerSuggestion {
  return {
    id: generateId(),
    type: "date_picker",
    label,
    ...options,
  };
}

/**
 * Create a yes/no confirmation
 */
export function createConfirmSuggestion(
  question: string,
  confirmValue: string,
  options?: {
    confirmLabel?: string;
    cancelLabel?: string;
    cancelValue?: string;
  }
): ConfirmActionSuggestion {
  return {
    id: generateId(),
    type: "confirm_action",
    question,
    confirmValue,
    ...options,
  };
}

/**
 * Generate common date suggestions relative to now
 */
export function getCommonDateSuggestions(): { label: string; date: string }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return [
    { label: "Tomorrow", date: tomorrow.toISOString() },
    { label: "Next week", date: nextWeek.toISOString() },
    { label: "Next month", date: nextMonth.toISOString() },
  ];
}

/**
 * Analyze assistant response and generate contextual suggestions
 * This can be called after generating the response to add relevant suggestions
 */
export function analyzeResponseForSuggestions(
  response: string,
  context: {
    hasEntry?: boolean;
    mentionedTask?: { id: string; title: string };
    mentionedCommitment?: { id: string; title: string };
    askedForDeadline?: boolean;
    askedForConfirmation?: boolean;
    extractedInsight?: string;
  }
): QuickSuggestion[] {
  const suggestions: QuickSuggestion[] = [];

  // If there's an insight that could be added to the entry
  if (context.hasEntry && context.extractedInsight) {
    suggestions.push(
      createAddToEntrySuggestion("Add insight to entry", context.extractedInsight)
    );
  }

  // If asking for a deadline
  if (context.askedForDeadline) {
    const targetId = context.mentionedTask?.id || context.mentionedCommitment?.id;
    const targetContext = context.mentionedTask ? "task_deadline" : "commitment_target";

    suggestions.push(
      createDatePickerSuggestion("Set deadline", {
        context: targetContext,
        targetId,
        includeTime: true,
        suggestedDates: getCommonDateSuggestions(),
      })
    );
  }

  // If asking yes/no questions
  if (context.askedForConfirmation) {
    suggestions.push(
      createConfirmSuggestion("", "Yes", {
        confirmLabel: "Yes",
        cancelLabel: "No",
        cancelValue: "No",
      })
    );
  }

  return suggestions;
}

/**
 * Create suggestions for task-related responses
 */
export function createTaskSuggestions(
  taskId: string,
  taskTitle: string,
  suggestDeadline: boolean = false
): QuickSuggestion[] {
  const suggestions: QuickSuggestion[] = [];

  suggestions.push(
    createQuickReplySuggestion([
      { label: "Mark complete", value: `Mark "${taskTitle}" as complete` },
      { label: "Skip it", value: `Skip "${taskTitle}" for now` },
      { label: "Defer", value: `Defer "${taskTitle}" to later` },
    ])
  );

  if (suggestDeadline) {
    suggestions.push(
      createDatePickerSuggestion("Set deadline", {
        context: "task_deadline",
        targetId: taskId,
        includeTime: true,
        suggestedDates: getCommonDateSuggestions(),
      })
    );
  }

  return suggestions;
}

/**
 * Create suggestions for commitment check-ins
 */
export function createCommitmentSuggestions(
  commitmentId: string,
  commitmentTitle: string
): QuickSuggestion[] {
  return [
    createQuickReplySuggestion([
      { label: "Making progress", value: `I'm making progress on "${commitmentTitle}"` },
      { label: "Struggling", value: `I'm struggling with "${commitmentTitle}"` },
      { label: "Need to adjust", value: `I need to adjust my approach to "${commitmentTitle}"` },
    ]),
  ];
}

/**
 * Create reflection prompts as suggestions
 */
export function createReflectionSuggestions(): QuickSuggestion[] {
  return [
    createQuickReplySuggestion([
      { label: "Feeling good", value: "I'm feeling good about my progress" },
      { label: "Feeling stuck", value: "I'm feeling stuck right now" },
      { label: "Need motivation", value: "I could use some motivation" },
    ]),
  ];
}
