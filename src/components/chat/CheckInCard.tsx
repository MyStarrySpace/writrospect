"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Clock,
  SkipForward,
  Edit2,
  FileText,
  Target,
  CheckSquare,
  Flame,
} from "lucide-react";
import type { CheckInItem, QuickAction } from "@/app/api/check-in/route";

interface CheckInCardProps {
  item: CheckInItem;
  index: number;
  isActive: boolean;
  onAction: (item: CheckInItem, action: QuickAction) => void;
  onSkip: () => void;
}

const typeIcons = {
  task: CheckSquare,
  commitment: Flame,
  goal: Target,
};

const typeLabels = {
  task: "Task",
  commitment: "Habit",
  goal: "Goal",
};

const actionIcons: Record<string, React.ReactNode> = {
  check: <Check className="h-4 w-4" />,
  x: <X className="h-4 w-4" />,
  clock: <Clock className="h-4 w-4" />,
  skip: <SkipForward className="h-4 w-4" />,
  edit: <Edit2 className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
};

export function CheckInCard({
  item,
  index,
  isActive,
  onAction,
  onSkip,
}: CheckInCardProps) {
  const [hoveredAction, setHoveredAction] = useState<number | null>(null);
  const TypeIcon = typeIcons[item.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isActive ? 1 : 0.95,
      }}
      transition={{ delay: index * 0.1 }}
      className="relative rounded-2xl p-4 transition-all"
      style={{
        background: "var(--background)",
        boxShadow: isActive ? "var(--neu-shadow)" : "var(--neu-shadow-sm)",
        opacity: isActive ? 1 : 0.6,
      }}
    >
      {/* Type badge */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full"
          style={{
            background: "var(--shadow-light)",
            color: "var(--accent)",
          }}
        >
          <TypeIcon className="h-3 w-3" />
          {typeLabels[item.type]}
        </div>
        {item.context && (
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              background:
                item.context === "Overdue" || item.context === "Urgent"
                  ? "#fee2e2"
                  : "var(--shadow-light)",
              color:
                item.context === "Overdue" || item.context === "Urgent"
                  ? "#991b1b"
                  : "var(--accent)",
            }}
          >
            {item.context}
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        className="font-medium mb-4 line-clamp-2"
        style={{ color: "var(--foreground)" }}
      >
        {item.title}
      </h3>

      {/* Progress bar for goals */}
      {item.type === "goal" && item.progress !== undefined && (
        <div
          className="h-2 rounded-full mb-4 overflow-hidden"
          style={{ background: "var(--shadow-dark)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${item.progress}%`,
              background: "linear-gradient(90deg, #7eb88e 0%, #5a9a6a 100%)",
            }}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {item.actions.map((action) => (
          <button
            key={action.key}
            onClick={() => onAction(item, action)}
            onMouseEnter={() => setHoveredAction(action.key)}
            onMouseLeave={() => setHoveredAction(null)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background:
                hoveredAction === action.key
                  ? "var(--shadow-dark)"
                  : "var(--shadow-light)",
              color: "var(--foreground)",
              boxShadow:
                hoveredAction === action.key
                  ? "var(--neu-shadow-inset-sm)"
                  : "var(--neu-shadow-sm)",
            }}
          >
            {action.icon && actionIcons[action.icon]}
            <span className="hidden sm:inline">{action.label}</span>
            <span
              className="text-xs opacity-50 hidden md:inline"
              style={{ fontFamily: "monospace" }}
            >
              Alt+{action.key}
            </span>
          </button>
        ))}
      </div>

      {/* Skip link */}
      {isActive && (
        <button
          onClick={onSkip}
          className="w-full mt-3 text-xs py-1.5 rounded-lg transition-colors hover:bg-[var(--shadow-light)]"
          style={{ color: "var(--accent)" }}
        >
          Skip for now (Enter)
        </button>
      )}
    </motion.div>
  );
}
