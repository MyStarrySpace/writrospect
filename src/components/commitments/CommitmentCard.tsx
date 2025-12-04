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
      whileHover={{ scale: 1.01 }}
      className={`rounded-3xl ${isOverdue ? "p-[2px]" : ""}`}
      style={{
        background: isOverdue
          ? "linear-gradient(135deg, #e89a9a 0%, #d88888 100%)"
          : "var(--background)",
        boxShadow: "6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light)",
      }}
    >
      <div
        className="rounded-[22px] p-4"
        style={{
          background: "var(--background)",
          boxShadow: isOverdue
            ? "inset 2px 2px 6px var(--shadow-dark), inset -2px -2px 6px var(--shadow-light)"
            : "none",
        }}
      >
        {/* Header */}
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-medium" style={{ color: "var(--foreground)" }}>
              {commitment.what}
            </h3>
            {commitment.why && (
              <p className="mt-1 text-sm" style={{ color: "var(--accent)" }}>
                {commitment.why}
              </p>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-xl p-1.5 transition-shadow"
              style={{ color: "var(--accent)" }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-xl py-1"
                style={{
                  background: "var(--background)",
                  boxShadow: "var(--neu-shadow)",
                }}
              >
                {commitment.status === "active" && (
                  <>
                    <button
                      onClick={() => {
                        onStatusChange?.(commitment.id, "completed");
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
                      style={{ color: "#2d6a4f" }}
                    >
                      <Check className="h-4 w-4" />
                      Mark Complete
                    </button>
                    <button
                      onClick={() => {
                        onStatusChange?.(commitment.id, "paused");
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
                      style={{ color: "#a66321" }}
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </button>
                    <button
                      onClick={() => {
                        onStatusChange?.(commitment.id, "abandoned");
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
                      style={{ color: "var(--accent)" }}
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
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
                    style={{ color: "#3d5a80" }}
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
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
                  style={{ color: "var(--foreground)" }}
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete?.(commitment.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
                  style={{ color: "#9b2c3d" }}
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
          <span className="text-xs" style={{ color: "var(--accent)" }}>
            {daysOld} days old
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
        </div>

        {/* Outcome/Learned (for completed/abandoned) */}
        {(commitment.outcome || commitment.learned) && (
          <div
            className="mt-3 space-y-2 border-t pt-3"
            style={{ borderColor: "var(--shadow-dark)" }}
          >
            {commitment.outcome && (
              <div>
                <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                  Outcome:
                </span>
                <p className="text-sm" style={{ color: "var(--foreground)" }}>
                  {commitment.outcome}
                </p>
              </div>
            )}
            {commitment.learned && (
              <div>
                <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                  Learned:
                </span>
                <p className="text-sm" style={{ color: "var(--foreground)" }}>
                  {commitment.learned}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
