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
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { getRelativeTime } from "@/lib/utils/relative-time";
import { Commitment, CommitmentStatus } from "@prisma/client";

interface CommitmentListItemProps {
  commitment: Commitment;
  onStatusChange?: (id: string, status: CommitmentStatus) => void;
  onEdit?: (commitment: Commitment) => void;
  onDelete?: (id: string) => void;
  isLast?: boolean;
}

const statusColors: Record<CommitmentStatus, "default" | "success" | "warning" | "danger" | "info"> = {
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

export function CommitmentListItem({
  commitment,
  onStatusChange,
  onEdit,
  onDelete,
  isLast = false,
}: CommitmentListItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const relativeAge = getRelativeTime(new Date(commitment.createdAt));

  const dueDate = commitment.dueDate
    ? new Date(commitment.dueDate)
    : null;

  const isOverdue =
    dueDate && commitment.status === "active" && dueDate < new Date();

  // Define actions based on commitment status
  const getActions = () => {
    const actions: ActionButtonProps[] = [];

    if (commitment.status === "active") {
      actions.push({
        onClick: () => onStatusChange?.(commitment.id, "completed"),
        tooltip: "Mark Complete",
        icon: <Check className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#2d6a4f",
      });
      actions.push({
        onClick: () => onStatusChange?.(commitment.id, "paused"),
        tooltip: "Pause",
        icon: <Pause className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#a66321",
      });
      actions.push({
        onClick: () => onStatusChange?.(commitment.id, "abandoned"),
        tooltip: "Abandon",
        icon: <X className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#9b2c3d",
      });
    }

    if (commitment.status === "paused") {
      actions.push({
        onClick: () => onStatusChange?.(commitment.id, "active"),
        tooltip: "Resume",
        icon: <Play className="h-4 w-4" />,
        color: "var(--accent)",
        hoverColor: "#3d5a80",
      });
    }

    actions.push({
      onClick: () => onEdit?.(commitment),
      tooltip: "Edit",
      icon: <Edit2 className="h-4 w-4" />,
      color: "var(--accent)",
      hoverColor: "var(--foreground)",
    });

    actions.push({
      onClick: () => onDelete?.(commitment.id),
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
      {/* Overdue indicator */}
      {isOverdue && (
        <div
          className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
          style={{ background: "linear-gradient(180deg, #e89a9a 0%, #d88888 100%)" }}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="font-medium truncate"
              style={{ color: "var(--foreground)" }}
            >
              {commitment.what}
            </h3>
            <Badge variant={statusColors[commitment.status]} className="text-[10px]">
              {commitment.status}
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
            {commitment.why && (
              <span
                className="text-xs truncate max-w-[200px]"
                style={{ color: "var(--accent)" }}
              >
                — {commitment.why}
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
