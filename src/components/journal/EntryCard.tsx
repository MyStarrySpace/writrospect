"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, MessageSquare, MoreHorizontal, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/Badge";
import { JournalEntry } from "@prisma/client";
import { getTimeContextLabel } from "@/lib/utils/time";

interface EntryCardProps {
  entry: JournalEntry;
  onSelect?: (entry: JournalEntry) => void;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
}

export function EntryCard({
  entry,
  onSelect,
  onDelete,
  isSelected = false,
}: EntryCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formattedDate = new Date(entry.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const formattedTime = new Date(entry.time).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => onSelect?.(entry)}
      className={`rounded-3xl cursor-pointer ${isSelected ? "p-[2px]" : ""}`}
      style={{
        background: isSelected
          ? "linear-gradient(135deg, var(--accent-soft) 0%, var(--accent) 100%)"
          : "var(--background)",
        boxShadow: "6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light)",
      }}
    >
      <div
        className="rounded-[22px] p-4"
        style={{
          background: "var(--background)",
          boxShadow: isSelected
            ? "inset 2px 2px 6px var(--shadow-dark), inset -2px -2px 6px var(--shadow-light)"
            : "none",
        }}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--accent)" }}>
            <Clock className="h-4 w-4" />
            <span>{formattedDate}</span>
            <span>•</span>
            <span>{formattedTime}</span>
            <Badge variant="default" className="ml-1">
              {getTimeContextLabel(entry.timeContext)}
            </Badge>
          </div>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="rounded-xl p-1.5 transition-shadow"
              style={{ color: "var(--accent)" }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full z-10 mt-1 rounded-xl py-1"
                style={{
                  background: "var(--background)",
                  boxShadow: "var(--neu-shadow)",
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(entry.id);
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

        {/* Content */}
        <div
          className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-inherit prose-em:text-inherit"
          style={{ color: "var(--foreground)" }}
        >
          <ReactMarkdown>
            {entry.content.length > 300
              ? `${entry.content.slice(0, 300)}...`
              : entry.content}
          </ReactMarkdown>
        </div>

        {/* Conditions */}
        {entry.conditionsPresent && entry.conditionsPresent.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {entry.conditionsPresent.map((condition) => (
              <Badge key={condition} variant="default">
                {condition}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        {entry.aiResponse && (
          <div className="mt-3 flex items-center gap-1.5 text-sm" style={{ color: "var(--accent)" }}>
            <MessageSquare className="h-4 w-4" />
            <span>Has AI response</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
