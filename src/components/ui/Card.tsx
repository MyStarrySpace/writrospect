"use client";

import { HTMLAttributes, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLMotionProps<"div"> {
  hover?: boolean;
  pressed?: boolean;
  accent?: boolean;
  noPadding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", hover = false, pressed = false, accent = false, noPadding = false, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { scale: 1.01 } : undefined}
        className={`
          rounded-2xl ${noPadding ? "" : "p-8"}
          ${pressed ? "neu-pressed" : "neu-raised"}
          ${className}
        `}
        style={{
          background: "var(--background)",
          boxShadow: pressed ? "var(--neu-shadow-inset)" : "var(--neu-shadow)",
          borderLeft: accent ? "3px solid var(--accent-border)" : undefined,
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className = "", children, ...props }: CardHeaderProps) {
  return (
    <div className={`mb-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className = "", children, ...props }: CardTitleProps) {
  return (
    <h3
      className={`text-lg font-semibold ${className}`}
      style={{ color: "var(--foreground)" }}
      {...props}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className = "", children, ...props }: CardDescriptionProps) {
  return (
    <p
      className={`text-sm ${className}`}
      style={{ color: "var(--accent)" }}
      {...props}
    >
      {children}
    </p>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className = "", children, ...props }: CardContentProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className = "", children, ...props }: CardFooterProps) {
  return (
    <div className={`mt-4 flex items-center gap-2 ${className}`} {...props}>
      {children}
    </div>
  );
}
