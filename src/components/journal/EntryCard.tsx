"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MessageSquare, Trash2, Edit2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { JournalEntry } from "@prisma/client";
import { getTimeContextLabel } from "@/lib/utils/time";

interface EntryCardProps {
  entry: JournalEntry;
  onSelect?: (entry: JournalEntry) => void;
  onEdit?: (entry: JournalEntry) => void;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
}

export function EntryCard({
  entry,
  onSelect,
  onEdit,
  onDelete,
  isSelected = false,
}: EntryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

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

  // Calculate if content is long enough to need truncation
  const isLongContent = entry.content.length > 300;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={() => onSelect?.(entry)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`rounded-3xl cursor-pointer transition-all duration-300 ${isSelected ? "p-[2px]" : ""}`}
      style={{
        background: isSelected
          ? "linear-gradient(135deg, var(--accent-soft) 0%, var(--accent) 100%)"
          : "var(--background)",
        boxShadow: isSelected
          ? "8px 8px 16px var(--shadow-dark), -8px -8px 16px var(--shadow-light)"
          : "6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light)",
        transform: !isSelected && isHovered ? "scale(1.01)" : "scale(1)",
      }}
    >
      <div
        className="rounded-[22px] p-4 transition-shadow duration-300"
        style={{
          background: "var(--background)",
          boxShadow: isSelected
            ? "inset 2px 2px 6px var(--shadow-dark), inset -2px -2px 6px var(--shadow-light)"
            : "none",
        }}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between relative">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--accent)" }}>
            <Clock className="h-4 w-4" />
            <span>{formattedDate}</span>
            <span>•</span>
            <span>{formattedTime}</span>
            <Badge variant="default" className="ml-1">
              {getTimeContextLabel(entry.timeContext)}
            </Badge>
          </div>

          {/* Action buttons - appear on hover, absolutely positioned to avoid layout shift */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-0 flex items-center gap-1"
              >
                <Tooltip content="Edit" position="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(entry);
                    }}
                    className="rounded-xl p-1.5 transition-colors duration-200"
                    style={{ color: "var(--accent)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent)")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip content="Delete" position="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(entry.id);
                    }}
                    className="rounded-xl p-1.5 transition-colors duration-200"
                    style={{ color: "var(--accent)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#9b2c3d")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent)")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content with animated height clipping */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: isSelected ? "2000px" : isLongContent ? "120px" : "2000px",
          }}
        >
          <div
            className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-inherit prose-em:text-inherit"
            style={{ color: "var(--foreground)" }}
          >
            <ReactMarkdown>{entry.content}</ReactMarkdown>
          </div>
        </div>

        {/* Fade overlay for truncated content */}
        {isLongContent && !isSelected && (
          <div
            className="relative h-8 -mt-8 pointer-events-none transition-opacity duration-300"
            style={{
              background: "linear-gradient(transparent, var(--background))",
            }}
          />
        )}

        {/* "Read more" indicator for truncated content */}
        {isLongContent && !isSelected && (
          <p className="text-xs mt-1" style={{ color: "var(--accent)" }}>
            Click to read more...
          </p>
        )}

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

        {/* Footer - AI response indicator */}
        {entry.aiResponse && !isSelected && (
          <div
            className="mt-3 flex items-center gap-1.5 text-sm"
            style={{ color: "var(--accent)" }}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Has AI response</span>
          </div>
        )}

        {/* Expanded view - show AI response preview when selected */}
        <AnimatePresence>
          {isSelected && entry.aiResponse && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div
                className="mt-4 pt-4"
                style={{ borderTop: "1px solid var(--shadow-dark)" }}
              >
                <p className="mb-2 text-xs font-medium" style={{ color: "var(--accent)" }}>
                  AI Response Preview
                </p>
                <div
                  className="prose prose-sm max-w-none prose-p:my-1"
                  style={{ color: "var(--foreground)", opacity: 0.8 }}
                >
                  <ReactMarkdown>
                    {entry.aiResponse.length > 200
                      ? `${entry.aiResponse.slice(0, 200)}...`
                      : entry.aiResponse}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
