"use client";

import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = "",
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const isPrimary = variant === "primary";
    const isDanger = variant === "danger";
    const isGhost = variant === "ghost";
    const isDisabled = disabled || isLoading;

    // Neomorphism styles based on variant
    const getNeuStyles = (): React.CSSProperties => {
      if (isGhost) {
        return {
          background: "transparent",
          boxShadow: "none",
          color: "var(--foreground)",
        };
      }

      if (isDanger) {
        return {
          background: "linear-gradient(145deg, #ef5350, #c62828)",
          boxShadow: "var(--neu-shadow-sm)",
          color: "#ffffff",
        };
      }

      if (isPrimary) {
        // When enabled, use dark background with light text to stand out
        if (!isDisabled) {
          return {
            background: "var(--foreground)",
            boxShadow: "var(--neu-shadow-sm)",
            color: "var(--background)",
          };
        }
        // When disabled, use subtle style
        return {
          background: "linear-gradient(145deg, var(--shadow-light), var(--background))",
          boxShadow: "var(--neu-shadow-sm)",
          color: "var(--accent)",
        };
      }

      // Secondary
      return {
        background: "var(--background)",
        boxShadow: "var(--neu-shadow-sm)",
        color: "var(--foreground)",
      };
    };

    const getHoverStyles = (): React.CSSProperties => {
      if (isGhost) {
        return {
          background: "var(--background)",
          boxShadow: "var(--neu-shadow-subtle)",
        };
      }
      return {
        boxShadow: "var(--neu-shadow)",
      };
    };

    const getActiveStyles = (): React.CSSProperties => {
      return {
        boxShadow: "var(--neu-shadow-inset-sm)",
      };
    };

    return (
      <motion.button
        ref={ref}
        whileHover={disabled || isLoading ? undefined : { scale: 1.02 }}
        whileTap={disabled || isLoading ? undefined : { scale: 0.98 }}
        className={`
          inline-flex items-center justify-center gap-2 font-medium
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          ${sizeStyles[size]}
          ${className}
        `}
        style={{
          ...getNeuStyles(),
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isLoading) {
            Object.assign(e.currentTarget.style, getHoverStyles());
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isLoading) {
            Object.assign(e.currentTarget.style, getNeuStyles());
          }
        }}
        onMouseDown={(e) => {
          if (!disabled && !isLoading) {
            Object.assign(e.currentTarget.style, getActiveStyles());
          }
        }}
        onMouseUp={(e) => {
          if (!disabled && !isLoading) {
            Object.assign(e.currentTarget.style, getHoverStyles());
          }
        }}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : leftIcon ? (
          leftIcon
        ) : null}
        {children as React.ReactNode}
        {!isLoading && rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
