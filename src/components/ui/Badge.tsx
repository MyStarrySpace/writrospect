"use client";

import { HTMLAttributes } from "react";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

// Soft gradient colors that align with lavender color scheme
const variantStyles: Record<BadgeVariant, { gradient: string; text: string }> = {
  default: {
    gradient: "linear-gradient(135deg, var(--shadow-light) 0%, var(--background) 100%)",
    text: "var(--foreground)"
  },
  secondary: {
    gradient: "linear-gradient(135deg, #e8dff5 0%, #d4c8e8 100%)",
    text: "#6b5b8a"
  },
  success: {
    gradient: "linear-gradient(135deg, #d4f0e0 0%, #a8dbc4 100%)",
    text: "#2d6a4f"
  },
  warning: {
    gradient: "linear-gradient(135deg, #ffecd2 0%, #f5d0a9 100%)",
    text: "#a66321"
  },
  danger: {
    gradient: "linear-gradient(135deg, #fde2e4 0%, #f5c6cb 100%)",
    text: "#9b2c3d"
  },
  info: {
    gradient: "linear-gradient(135deg, #d6e5f5 0%, #b3cce6 100%)",
    text: "#3d5a80"
  },
};

export function Badge({ variant = "default", className = "", children, style, ...props }: BadgeProps) {
  const variantStyle = variantStyles[variant];
  const isNeutral = variant === "default" || variant === "secondary";

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-3 py-1 text-xs font-medium
        transition-all duration-200
        ${className}
      `}
      style={{
        background: variantStyle.gradient,
        color: variantStyle.text,
        boxShadow: isNeutral
          ? "var(--neu-shadow-subtle)"
          : "2px 2px 6px rgba(0,0,0,0.08), -1px -1px 3px rgba(255,255,255,0.6)",
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
