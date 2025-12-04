"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Undo2 } from "lucide-react";
import { neuRaised, neuSubtle, neuColors, neuClasses } from "@/lib/styles/neu";

interface SaveBannerProps {
  show: boolean;
  message: string;
  timeRemaining: number;
  duration: number;
  onUndo: () => void;
  onDismiss: () => void;
}

export function SaveBanner({
  show,
  message,
  timeRemaining,
  duration,
  onUndo,
  onDismiss,
}: SaveBannerProps) {
  const progress = timeRemaining / duration;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed left-1/2 top-4 z-50 -translate-x-1/2"
        >
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              ...neuRaised,
              background: neuColors.success.background,
            }}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <Check className="h-5 w-5" style={{ color: neuColors.success.color }} />
              <span
                className="text-sm font-medium"
                style={{ color: neuColors.success.color }}
              >
                {message}
              </span>
              <button
                onClick={onUndo}
                className={`ml-2 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium ${neuClasses.transition} ${neuClasses.interactive}`}
                style={neuSubtle}
              >
                <Undo2 className="h-3.5 w-3.5" />
                Undo
              </button>
            </div>
            {/* Shrinking timer bar */}
            <motion.div
              className="h-1"
              style={{ background: neuColors.success.color }}
              initial={{ width: "100%" }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.05, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
