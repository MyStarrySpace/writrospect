"use client";

import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface ListItemProps {
  children: ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  isLast?: boolean;
}

export function ListItem({
  children,
  isSelected = false,
  onClick,
  isLast = false,
}: ListItemProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      animate={{
        boxShadow: isSelected
          ? "4px 4px 12px var(--shadow-dark), -4px -4px 12px var(--shadow-light)"
          : "none",
      }}
      transition={{ duration: 0.2 }}
      className={`
        relative py-3 rounded-xl
        ${onClick ? "cursor-pointer" : ""}
      `}
      style={{
        background: isSelected ? "var(--background)" : "transparent",
      }}
    >
      {children}
      {!isLast && !isSelected && (
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

interface ListContainerProps {
  children: ReactNode;
  className?: string;
}

export function ListContainer({ children, className = "" }: ListContainerProps) {
  return (
    <div className={className}>
      <LayoutGroup>
        <AnimatePresence mode="sync">
          {children}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
