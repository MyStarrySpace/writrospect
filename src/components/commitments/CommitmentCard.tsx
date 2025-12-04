"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MoreHorizontal,
  Check,
  X,
  Pause,
  Calendar,
  Trash2,
  Edit2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Commitment, CommitmentStatus } from "@prisma/client";

interface CommitmentCardProps {
  commitment: Commitment;
  onStatusChange?: (id: string, status: CommitmentStatus) => void;
  onEdit?: (commitment: Commitment) => void;
  onDelete?: (id: string) => void;
}

const statusColors: Record<CommitmentStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  active: "info",
  completed: "success",
  abandoned: "danger",
  paused: "warning",
};

const complexityLabels = ["", "Simple", "Easy", "Moderate", "Complex", "Very Complex"];

export function CommitmentCard({
  commitment,
  onStatusChange,
  onEdit,
  onDelete,
}: CommitmentCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const daysOld = Math.floor(
    (Date.now() - new Date(commitment.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const dueDate = commitment.dueDate
    ? new Date(commitment.dueDate)
    : null;

  const isOverdue =
    dueDate && commitment.status === "active" && dueDate < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl border p-4 transition-colors
        ${
          isOverdue
            ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/10"
            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        }
      `}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
            {commitment.what}
          </h3>
          {commitment.why && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {commitment.why}
            </p>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
              {commitment.status === "active" && (
                <>
                  <button
                    onClick={() => {
                      onStatusChange?.(commitment.id, "completed");
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <Check className="h-4 w-4" />
                    Mark Complete
                  </button>
                  <button
                    onClick={() => {
                      onStatusChange?.(commitment.id, "paused");
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </button>
                  <button
                    onClick={() => {
                      onStatusChange?.(commitment.id, "abandoned");
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    <X className="h-4 w-4" />
                    Abandon
                  </button>
                </>
              )}
              {commitment.status === "paused" && (
                <button
                  onClick={() => {
                    onStatusChange?.(commitment.id, "active");
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Check className="h-4 w-4" />
                  Resume
                </button>
              )}
              <button
                onClick={() => {
                  onEdit?.(commitment);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete?.(commitment.id);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={statusColors[commitment.status]}>
          {commitment.status}
        </Badge>
        <Badge variant="default">
          {complexityLabels[commitment.complexity]} ({commitment.complexity}/5)
        </Badge>
        <Badge variant="default">{commitment.motivationType}</Badge>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {daysOld} days old
        </span>
        {dueDate && (
          <span
            className={`flex items-center gap-1 text-xs ${
              isOverdue
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <Calendar className="h-3 w-3" />
            Due {dueDate.toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Outcome/Learned (for completed/abandoned) */}
      {(commitment.outcome || commitment.learned) && (
        <div className="mt-3 space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          {commitment.outcome && (
            <div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Outcome:
              </span>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {commitment.outcome}
              </p>
            </div>
          )}
          {commitment.learned && (
            <div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Learned:
              </span>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {commitment.learned}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
