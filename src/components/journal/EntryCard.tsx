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
      className={`
        relative cursor-pointer rounded-xl border p-4 transition-colors
        ${
          isSelected
            ? "border-zinc-400 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800/50"
            : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        }
      `}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
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
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(entry.id);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-inherit prose-em:text-inherit text-zinc-900 dark:text-zinc-100">
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
        <div className="mt-3 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          <MessageSquare className="h-4 w-4" />
          <span>Has AI response</span>
        </div>
      )}
    </motion.div>
  );
}
