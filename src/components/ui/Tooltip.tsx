"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 300,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    let x = 0;
    let y = 0;

    switch (position) {
      case "top":
        x = rect.left + rect.width / 2;
        y = rect.top - 8;
        break;
      case "bottom":
        x = rect.left + rect.width / 2;
        y = rect.bottom + 8;
        break;
      case "left":
        x = rect.left - 8;
        y = rect.top + rect.height / 2;
        break;
      case "right":
        x = rect.right + 8;
        y = rect.top + rect.height / 2;
        break;
    }

    setCoords({ x, y });
  };

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "fixed",
      zIndex: 9999,
      background: "var(--background)",
      color: "var(--foreground)",
      boxShadow: "4px 4px 12px var(--shadow-dark), -4px -4px 12px var(--shadow-light)",
    };

    switch (position) {
      case "top":
        return {
          ...base,
          left: coords.x,
          top: coords.y,
          transform: "translateX(-50%) translateY(-100%)",
        };
      case "bottom":
        return {
          ...base,
          left: coords.x,
          top: coords.y,
          transform: "translateX(-50%)",
        };
      case "left":
        return {
          ...base,
          left: coords.x,
          top: coords.y,
          transform: "translateX(-100%) translateY(-50%)",
        };
      case "right":
        return {
          ...base,
          left: coords.x,
          top: coords.y,
          transform: "translateY(-50%)",
        };
    }
  };

  const animationOrigin = {
    top: { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } },
    bottom: { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: 4 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: -4 }, animate: { opacity: 1, x: 0 } },
  };

  const tooltipContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={animationOrigin[position].initial}
          animate={animationOrigin[position].animate}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium pointer-events-none"
          style={getTooltipStyle()}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {mounted && createPortal(tooltipContent, document.body)}
    </div>
  );
}
