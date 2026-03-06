"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Pause,
  Calendar,
  Trash2,
  Edit2,
  Play,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { getRelativeTime } from "@/lib/utils/relative-time";
import { Habit, HabitStatus } from "@prisma/client";

interface HabitListItemProps {
  habit: Habit;
  onStatusChange?: (id: string, status: HabitStatus) => void;
  onEdit?: (habit: Habit) => void;
  onDelete?: (id: string) => void;
  isLast?: boolean;
  isNew?: boolean;
  isHighlighted?: boolean;
}

const statusColors: Record<HabitStatus, "default" | "success" | "warning" | "danger" | "info"> = {
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

export function HabitListItem({
  habit,
  onStatusChange,
  onEdit,
  onDelete,
  isLast = false,
  isNew = false,
  isHighlighted = false,
}: HabitListItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const relativeAge = getRelativeTime(new Date(habit.createdAt));

  const dueDate = habit.dueDate
    ? new Date(habit.dueDate)
    : null;

  const isOverdue =
    dueDate && habit.status === "active" && dueDate < new Date();

  // Define actions based on habit status
  const getActions = () => {
    const actions: ActionButtonProps[] = [];

    if (habit.status === "active") {
      actions.push({
        onClick: () => onStatusChange?.(habit.id, "completed"),
        tooltip: "Mark Complete",
        icon: <Check className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#2d6a4f",
      });
      actions.push({
        onClick: () => onStatusChange?.(habit.id, "paused"),
        tooltip: "Pause",
        icon: <Pause className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#a66321",
      });
      actions.push({
        onClick: () => onStatusChange?.(habit.id, "abandoned"),
        tooltip: "Abandon",
        icon: <X className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#9b2c3d",
      });
    }

    if (habit.status === "paused") {
      actions.push({
        onClick: () => onStatusChange?.(habit.id, "active"),
        tooltip: "Resume",
        icon: <Play className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#3d5a80",
      });
    }

    if (habit.status === "completed" || habit.status === "abandoned") {
      actions.push({
        onClick: () => onStatusChange?.(habit.id, "active"),
        tooltip: "Reopen",
        icon: <RotateCcw className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#3d5a80",
      });
    }

    actions.push({
      onClick: () => onEdit?.(habit),
      tooltip: "Edit",
      icon: <Edit2 className="h-4 w-4" />,
      color: "var(--accent)",
      hoverColor: "var(--foreground)",
    });

    actions.push({
      onClick: () => onDelete?.(habit.id),
      tooltip: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      color: "var(--accent)",
      hoverColor: "#9b2c3d",
    });

    return actions;
  };

  const actions = getActions();

  return (
    <motion.div
      layout
      layoutId={habit.id}
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
              {habit.what}
            </h3>
            {isNew && (
              <Badge variant="info" className="text-[10px] !px-1.5 !py-0.5">
                NEW
              </Badge>
            )}
            <Badge variant={statusColors[habit.status]} className="text-[10px]">
              {habit.status}
            </Badge>
          </div>

          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: "var(--accent)" }}>
              {relativeAge}
            </span>
            {dueDate && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: isOverdue ? "#9b2c3d" : "var(--accent)" }}
              >
                <Calendar className="h-3 w-3" />
                Due {dueDate.toLocaleDateString()}
              </span>
            )}
            {habit.why && (
              <span
                className="text-xs truncate max-w-[200px]"
                style={{ color: "var(--accent)" }}
              >
                — {habit.why}
              </span>
            )}
          </div>
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
