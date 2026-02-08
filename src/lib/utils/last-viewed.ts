/**
 * Utility for tracking when users last viewed different sections
 * Uses localStorage to persist timestamps across sessions
 */

const STORAGE_KEY_PREFIX = "accountabili_last_viewed_";

export type ViewableSection = "tasks" | "habits" | "strategies" | "goals";

/**
 * Get the timestamp of when a section was last viewed
 */
export function getLastViewed(section: ViewableSection): Date | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${section}`);
  if (!stored) return null;

  const timestamp = parseInt(stored, 10);
  if (isNaN(timestamp)) return null;

  return new Date(timestamp);
}

/**
 * Mark a section as viewed now
 */
export function markAsViewed(section: ViewableSection): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(`${STORAGE_KEY_PREFIX}${section}`, Date.now().toString());
}

/**
 * Check if an item is "new" (created after last viewed)
 */
export function isNewSinceLastViewed(section: ViewableSection, createdAt: Date): boolean {
  const lastViewed = getLastViewed(section);
  if (!lastViewed) return true; // If never viewed, everything is new

  return new Date(createdAt) > lastViewed;
}

/**
 * Check if an item was updated since last viewed
 */
export function isUpdatedSinceLastViewed(section: ViewableSection, updatedAt: Date, createdAt: Date): boolean {
  const lastViewed = getLastViewed(section);
  if (!lastViewed) return false;

  // Only count as "updated" if it was updated after last viewed AND after creation
  // (so new items don't also show as "updated")
  const updated = new Date(updatedAt);
  const created = new Date(createdAt);

  return updated > lastViewed && updated > created;
}

/**
 * Calculate summary stats for a list of items
 */
export interface ChangesSummary {
  newCount: number;
  updatedCount: number;
  completedCount: number;
  needsAttentionCount: number;
  lastViewedAt: Date | null;
}

export function calculateChangesSummary<T extends {
  createdAt: Date | string;
  updatedAt: Date | string;
  status?: string;
  urgency?: string;
  completedAt?: Date | string | null;
}>(
  section: ViewableSection,
  items: T[]
): ChangesSummary {
  const lastViewed = getLastViewed(section);

  let newCount = 0;
  let updatedCount = 0;
  let completedCount = 0;
  let needsAttentionCount = 0;

  for (const item of items) {
    const createdAt = new Date(item.createdAt);
    const updatedAt = new Date(item.updatedAt);

    if (!lastViewed || createdAt > lastViewed) {
      newCount++;
    } else if (updatedAt > lastViewed && updatedAt > createdAt) {
      updatedCount++;

      // Check if it was completed since last viewed
      if (item.completedAt) {
        const completedAt = new Date(item.completedAt);
        if (completedAt > lastViewed) {
          completedCount++;
        }
      }
    }

    // Count items needing attention (pending + urgent)
    if (item.status === "pending" && (item.urgency === "now" || item.urgency === "today")) {
      needsAttentionCount++;
    }
  }

  return {
    newCount,
    updatedCount,
    completedCount,
    needsAttentionCount,
    lastViewedAt: lastViewed,
  };
}
