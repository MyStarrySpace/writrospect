"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Sparkles,
  Clock,
  TrendingUp,
  ListChecks,
  Target,
} from "lucide-react";

interface BaseItem {
  id: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  status?: string;
  urgency?: string;
  dueDate?: Date | string | null;
  completedAt?: Date | string | null;
}

interface DashboardProps<T extends BaseItem> {
  items: T[];
  section: "tasks" | "commitments" | "strategies" | "goals";
  onDismiss?: () => void;
  onFilter?: (filter: string | null) => void;
  onHover?: (filter: string | null) => void;
  activeFilter?: string | null;
}

interface DashboardStat {
  id: string;
  label: string;
  value: string | number;
  emphasis?: "normal" | "strong" | "muted";
  icon: React.ReactNode;
  filter: string; // Used to identify which items to highlight
}

export function ChangesSummary<T extends BaseItem>({
  items,
  section,
  onDismiss,
  onFilter,
  onHover,
  activeFilter,
}: DashboardProps<T>) {
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Calculate stats
    const addedToday = items.filter((item) => {
      const created = new Date(item.createdAt);
      return created >= today;
    }).length;

    const completedToday = items.filter((item) => {
      if (item.status !== "completed") return false;
      const updated = item.updatedAt ? new Date(item.updatedAt) : null;
      const completed = item.completedAt ? new Date(item.completedAt) : updated;
      return completed && completed >= today;
    }).length;

    const dueToday = items.filter((item) => {
      if (!item.dueDate || item.status === "completed" || item.status === "skipped")
        return false;
      const due = new Date(item.dueDate);
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      return dueDay.getTime() === today.getTime();
    }).length;

    const needsAttention = items.filter(
      (item) =>
        (item.urgency === "now" || item.urgency === "today") &&
        item.status === "pending"
    ).length;

    const overdue = items.filter((item) => {
      if (!item.dueDate || item.status === "completed" || item.status === "skipped")
        return false;
      const due = new Date(item.dueDate);
      return due < today;
    }).length;

    const totalCompleted = items.filter(
      (item) => item.status === "completed"
    ).length;

    const totalActive = items.filter(
      (item) => item.status === "pending" || item.status === "active"
    ).length;

    const completedThisWeek = items.filter((item) => {
      if (item.status !== "completed") return false;
      const updated = item.updatedAt ? new Date(item.updatedAt) : null;
      const completed = item.completedAt ? new Date(item.completedAt) : updated;
      return completed && completed >= weekAgo;
    }).length;

    const completedPreviousWeek = items.filter((item) => {
      if (item.status !== "completed") return false;
      const updated = item.updatedAt ? new Date(item.updatedAt) : null;
      const completed = item.completedAt ? new Date(item.completedAt) : updated;
      return completed && completed >= twoWeeksAgo && completed < weekAgo;
    }).length;

    // Build stats array - prioritize what to show
    const allStats: DashboardStat[] = [];

    // Priority 1: Urgent/attention items
    if (needsAttention > 0) {
      allStats.push({
        id: "attention",
        label: "need attention",
        value: needsAttention,
        emphasis: "strong",
        icon: <AlertCircle className="h-5 w-5" />,
        filter: "attention",
      });
    }

    // Priority 2: Due today
    if (dueToday > 0) {
      allStats.push({
        id: "due",
        label: "due today",
        value: dueToday,
        emphasis: "strong",
        icon: <Calendar className="h-5 w-5" />,
        filter: "due-today",
      });
    }

    // Priority 3: Overdue
    if (overdue > 0) {
      allStats.push({
        id: "overdue",
        label: "overdue",
        value: overdue,
        emphasis: "strong",
        icon: <Clock className="h-5 w-5" />,
        filter: "overdue",
      });
    }

    // Priority 4: Completed today
    if (completedToday > 0) {
      allStats.push({
        id: "completed-today",
        label: "done today",
        value: completedToday,
        emphasis: "normal",
        icon: <CheckCircle2 className="h-5 w-5" />,
        filter: "completed-today",
      });
    }

    // Priority 5: Added today
    if (addedToday > 0) {
      allStats.push({
        id: "added",
        label: "added today",
        value: addedToday,
        emphasis: "normal",
        icon: <Sparkles className="h-5 w-5" />,
        filter: "added-today",
      });
    }

    // Priority 6: This week progress
    if (completedThisWeek > completedToday && completedThisWeek >= 2) {
      allStats.push({
        id: "week",
        label: "this week",
        value: completedThisWeek,
        emphasis: "muted",
        icon: <ListChecks className="h-4 w-4" />,
        filter: "completed-week",
      });
    }

    // Priority 7: Trend (only if meaningful)
    if (completedPreviousWeek >= 2 && completedThisWeek > completedPreviousWeek) {
      const increase = Math.round(
        ((completedThisWeek - completedPreviousWeek) / completedPreviousWeek) * 100
      );
      if (increase >= 20) {
        allStats.push({
          id: "trend",
          label: "vs last week",
          value: `+${increase}%`,
          emphasis: "muted",
          icon: <TrendingUp className="h-4 w-4" />,
          filter: "trend",
        });
      }
    }

    // Priority 8: Total active (fallback)
    if (allStats.length < 2 && totalActive > 0) {
      allStats.push({
        id: "active",
        label: "in progress",
        value: totalActive,
        emphasis: "muted",
        icon: <Target className="h-4 w-4" />,
        filter: "active",
      });
    }

    // Priority 9: Total completed (fallback)
    if (allStats.length < 3 && totalCompleted >= 3) {
      allStats.push({
        id: "total",
        label: "completed total",
        value: totalCompleted,
        emphasis: "muted",
        icon: <CheckCircle2 className="h-4 w-4" />,
        filter: "completed",
      });
    }

    return allStats.slice(0, 3);
  }, [items]);

  if (stats.length === 0) return null;

  const handleStatHover = (filter: string | null) => {
    setHoveredStat(filter);
    onHover?.(filter);
  };

  const handleStatClick = (filter: string) => {
    if (activeFilter === filter) {
      onFilter?.(null);
    } else {
      onFilter?.(filter);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--accent)" }}
        >
          Today's snapshot
        </h2>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg opacity-40 hover:opacity-100 transition-opacity"
            style={{ color: "var(--accent)" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6">
        {stats.map((stat) => {
          const isActive = activeFilter === stat.filter;
          const isHovered = hoveredStat === stat.filter;
          const isInteractive = stat.filter !== "trend"; // Trend isn't filterable

          return (
            <motion.div
              key={stat.id}
              className={`text-center sm:text-left ${isInteractive ? "cursor-pointer" : ""}`}
              onMouseEnter={() => isInteractive && handleStatHover(stat.filter)}
              onMouseLeave={() => isInteractive && handleStatHover(null)}
              onClick={() => isInteractive && handleStatClick(stat.filter)}
              whileHover={isInteractive ? { scale: 1.02 } : undefined}
              whileTap={isInteractive ? { scale: 0.98 } : undefined}
            >
              <div
                className={`
                  flex items-center gap-2 justify-center sm:justify-start
                  transition-opacity duration-150
                  ${isActive ? "opacity-100" : isHovered ? "opacity-80" : "opacity-100"}
                `}
              >
                <span
                  style={{
                    color:
                      stat.emphasis === "muted"
                        ? "var(--accent)"
                        : "var(--foreground)",
                  }}
                >
                  {stat.icon}
                </span>
                <span
                  className={`
                    font-semibold tabular-nums
                    ${stat.emphasis === "strong" ? "text-3xl" : ""}
                    ${stat.emphasis === "normal" ? "text-2xl" : ""}
                    ${stat.emphasis === "muted" ? "text-xl" : ""}
                  `}
                  style={{
                    color:
                      stat.emphasis === "muted"
                        ? "var(--accent)"
                        : "var(--foreground)",
                  }}
                >
                  {stat.value}
                </span>
              </div>
              <div
                className="text-xs mt-0.5 text-center sm:text-left"
                style={{ color: "var(--accent)" }}
              >
                {stat.label}
                {isInteractive && (isActive ? (
                  <span className="ml-1 opacity-60">(click to clear)</span>
                ) : isHovered ? (
                  <span className="ml-1 opacity-60">(click to filter)</span>
                ) : null)}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Helper to check if an item matches a filter
export function itemMatchesFilter<T extends BaseItem>(
  item: T,
  filter: string | null
): boolean {
  if (!filter) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  switch (filter) {
    case "attention":
      return (
        (item.urgency === "now" || item.urgency === "today") &&
        item.status === "pending"
      );

    case "due-today": {
      if (!item.dueDate || item.status === "completed" || item.status === "skipped")
        return false;
      const due = new Date(item.dueDate);
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      return dueDay.getTime() === today.getTime();
    }

    case "overdue": {
      if (!item.dueDate || item.status === "completed" || item.status === "skipped")
        return false;
      const due = new Date(item.dueDate);
      return due < today;
    }

    case "completed-today": {
      if (item.status !== "completed") return false;
      const updated = item.updatedAt ? new Date(item.updatedAt) : null;
      const completed = item.completedAt ? new Date(item.completedAt) : updated;
      return completed ? completed >= today : false;
    }

    case "added-today": {
      const created = new Date(item.createdAt);
      return created >= today;
    }

    case "completed-week": {
      if (item.status !== "completed") return false;
      const updated = item.updatedAt ? new Date(item.updatedAt) : null;
      const completed = item.completedAt ? new Date(item.completedAt) : updated;
      return completed ? completed >= weekAgo : false;
    }

    case "active":
      return item.status === "pending" || item.status === "active";

    case "completed":
      return item.status === "completed";

    default:
      return false;
  }
}
