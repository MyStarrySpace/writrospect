"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Clock,
  Calendar,
  Trash2,
  Edit2,
  SkipForward,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { getRelativeTime } from "@/lib/utils/relative-time";
import { Task, TaskStatus, TaskUrgency } from "@prisma/client";

interface TaskListItemProps {
  task: Task;
  onStatusChange?: (id: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  isLast?: boolean;
}

const statusColors: Record<TaskStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  pending: "info",
  completed: "success",
  skipped: "warning",
  deferred: "default",
};

const urgencyColors: Record<TaskUrgency, "danger" | "warning" | "info" | "default"> = {
  now: "danger",
  today: "warning",
  this_week: "info",
  whenever: "default",
};

const urgencyLabels: Record<TaskUrgency, string> = {
  now: "Now",
  today: "Today",
  this_week: "This Week",
  whenever: "Whenever",
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

export function TaskListItem({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  isLast = false,
}: TaskListItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const relativeAge = getRelativeTime(new Date(task.createdAt));

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;

  const isOverdue =
    dueDate && task.status === "pending" && dueDate < new Date();

  const isUrgent = task.urgency === "now" || task.urgency === "today";

  // Define actions based on task status
  const getActions = () => {
    const actions: ActionButtonProps[] = [];

    if (task.status === "pending") {
      actions.push({
        onClick: () => onStatusChange?.(task.id, "completed"),
        tooltip: "Mark Complete",
        icon: <Check className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#2d6a4f",
      });
      actions.push({
        onClick: () => onStatusChange?.(task.id, "skipped"),
        tooltip: "Skip",
        icon: <SkipForward className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#a66321",
      });
      actions.push({
        onClick: () => onStatusChange?.(task.id, "deferred"),
        tooltip: "Defer",
        icon: <Clock className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#3d5a80",
      });
    }

    actions.push({
      onClick: () => onEdit?.(task),
      tooltip: "Edit",
      icon: <Edit2 className="h-4 w-4" />,
      color: "var(--accent)",
      hoverColor: "var(--foreground)",
    });

    actions.push({
      onClick: () => onDelete?.(task.id),
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative py-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Urgent/Overdue indicator */}
      {(isOverdue || isUrgent) && task.status === "pending" && (
        <div
          className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
          style={{
            background: isOverdue
              ? "linear-gradient(180deg, #e89a9a 0%, #d88888 100%)"
              : "linear-gradient(180deg, #f0ad4e 0%, #ec971f 100%)",
          }}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="font-medium truncate"
              style={{
                color: "var(--foreground)",
                textDecoration: task.status === "completed" ? "line-through" : "none",
                opacity: task.status === "completed" || task.status === "skipped" ? 0.6 : 1,
              }}
            >
              {task.what}
            </h3>
            <Badge variant={statusColors[task.status]} className="text-[10px]">
              {task.status}
            </Badge>
            {task.status === "pending" && (
              <Badge variant={urgencyColors[task.urgency]} className="text-[10px]">
                {task.urgency === "now" && <Zap className="h-2.5 w-2.5 mr-0.5" />}
                {urgencyLabels[task.urgency]}
              </Badge>
            )}
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
                {isOverdue && <AlertTriangle className="h-3 w-3" />}
                {task.dueTime ? `${task.dueTime}, ` : ""}
                {dueDate.toLocaleDateString()}
              </span>
            )}
            {task.context && (
              <span
                className="text-xs truncate max-w-[200px]"
                style={{ color: "var(--accent)" }}
              >
                — {task.context}
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
