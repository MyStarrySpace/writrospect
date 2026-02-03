"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Pause,
  Trash2,
  Edit2,
  Play,
  Lightbulb,
  CheckSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { getRelativeTime } from "@/lib/utils/relative-time";

type GoalStatus = "active" | "completed" | "paused" | "abandoned";

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  why: string | null;
  status: GoalStatus;
  progress: number;
  outcome: string | null;
  learned: string | null;
  createdAt: Date;
  _count?: {
    strategies: number;
    tasks: number;
  };
}

interface GoalListItemProps {
  goal: Goal;
  onStatusChange?: (id: string, status: GoalStatus) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (id: string) => void;
  isLast?: boolean;
  isNew?: boolean;
  isHighlighted?: boolean;
}

const statusColors: Record<GoalStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  active: "info",
  completed: "success",
  abandoned: "danger",
  paused: "warning",
};

interface ActionButtonProps {
  onClick: () => void;
  tooltip: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
}

function ActionButton({ onClick, tooltip, icon, color, hoverColor }: ActionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tooltip content={tooltip} position="top">
      <motion.button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="rounded-xl p-1.5 transition-all"
        style={{
          color: isHovered ? hoverColor : color,
          background: isHovered ? "var(--shadow-light)" : "transparent",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {icon}
      </motion.button>
    </Tooltip>
  );
}

export function GoalListItem({
  goal,
  onStatusChange,
  onEdit,
  onDelete,
  isLast = false,
  isNew = false,
  isHighlighted = false,
}: GoalListItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const relativeAge = getRelativeTime(new Date(goal.createdAt));

  // Define actions based on goal status
  const getActions = () => {
    const actions: ActionButtonProps[] = [];

    if (goal.status === "active") {
      actions.push({
        onClick: () => onStatusChange?.(goal.id, "completed"),
        tooltip: "Mark Complete",
        icon: <Check className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#2d6a4f",
      });
      actions.push({
        onClick: () => onStatusChange?.(goal.id, "paused"),
        tooltip: "Pause",
        icon: <Pause className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#a66321",
      });
      actions.push({
        onClick: () => onStatusChange?.(goal.id, "abandoned"),
        tooltip: "Abandon",
        icon: <X className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#9b2c3d",
      });
    }

    if (goal.status === "paused") {
      actions.push({
        onClick: () => onStatusChange?.(goal.id, "active"),
        tooltip: "Resume",
        icon: <Play className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#3d5a80",
      });
    }

    actions.push({
      onClick: () => onEdit?.(goal),
      tooltip: "Edit",
      icon: <Edit2 className="h-4 w-4" />,
      color: "var(--accent)",
      hoverColor: "var(--foreground)",
    });

    actions.push({
      onClick: () => onDelete?.(goal.id),
      tooltip: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      color: "var(--accent)",
      hoverColor: "#9b2c3d",
    });

    return actions;
  };

  const actions = getActions();
  const strategiesCount = goal._count?.strategies ?? 0;
  const tasksCount = goal._count?.tasks ?? 0;

  return (
    <motion.div
      layout
      layoutId={goal.id}
      initial={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
      animate={{
        opacity: 1,
        height: "auto",
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: isHighlighted ? "var(--shadow-light)" : "transparent",
      }}
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{
        layout: { type: "tween", duration: 0.2 },
        height: { duration: 0.2 },
        paddingTop: { duration: 0.2 },
        paddingBottom: { duration: 0.2 },
        opacity: { duration: 0.15 },
        backgroundColor: { duration: 0.2 },
      }}
      className="relative px-4 -mx-4 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Progress indicator on left */}
      {goal.status === "active" && goal.progress > 0 && (
        <div
          className="absolute left-0 top-2 bottom-2 w-1 rounded-full overflow-hidden"
          style={{ background: "var(--shadow-dark)" }}
        >
          <div
            className="w-full rounded-full"
            style={{
              height: `${goal.progress}%`,
              background: "linear-gradient(180deg, #7eb88e 0%, #5a9a6a 100%)",
            }}
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="truncate"
              style={{
                color: "var(--foreground)",
                fontWeight: isNew ? 700 : 500,
              }}
            >
              {goal.title}
            </h3>
            {isNew && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: "#dbeafe", color: "#1d4ed8" }}
              >
                NEW
              </span>
            )}
            <Badge variant={statusColors[goal.status]} className="text-[10px]">
              {goal.status}
            </Badge>
            {goal.progress > 0 && goal.status === "active" && (
              <span className="text-xs" style={{ color: "var(--accent)" }}>
                {goal.progress}%
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-3 flex-wrap">
            <span className="text-xs" style={{ color: "var(--accent)" }}>
              {relativeAge}
            </span>
            {strategiesCount > 0 && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--accent)" }}
              >
                <Lightbulb className="h-3 w-3" />
                {strategiesCount} {strategiesCount === 1 ? "strategy" : "strategies"}
              </span>
            )}
            {tasksCount > 0 && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--accent)" }}
              >
                <CheckSquare className="h-3 w-3" />
                {tasksCount} {tasksCount === 1 ? "task" : "tasks"}
              </span>
            )}
            {goal.why && (
              <span
                className="text-xs truncate max-w-[200px]"
                style={{ color: "var(--accent)" }}
              >
                — {goal.why}
              </span>
            )}
          </div>

          {goal.description && (
            <p
              className="mt-2 text-sm line-clamp-2"
              style={{ color: "var(--accent)" }}
            >
              {goal.description}
            </p>
          )}
        </div>

        {/* Action icons - appear on hover */}
        <motion.div
          className="flex items-center gap-1 flex-shrink-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        >
          {actions.map((action, index) => (
            <ActionButton key={index} {...action} />
          ))}
        </motion.div>
      </div>

      {/* Divider line */}
      {!isLast && (
        <div
          className="absolute bottom-0 left-4 right-4 h-[1px]"
          style={{
            background: "linear-gradient(90deg, transparent, var(--shadow-dark), transparent)",
          }}
        />
      )}
    </motion.div>
  );
}
