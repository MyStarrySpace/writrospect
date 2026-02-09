"use client";

import { forwardRef, InputHTMLAttributes, useId } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = "", id: providedId, checked, disabled, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;

    return (
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-start gap-3 ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
      >
        <div className="relative flex-shrink-0 pt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <motion.div
            className="flex h-5 w-5 items-center justify-center rounded-md"
            style={{
              background: "var(--background)",
              boxShadow: checked ? "var(--neu-shadow-inset-sm)" : "var(--neu-shadow-sm)",
            }}
            whileTap={disabled ? undefined : { scale: 0.95 }}
          >
            <motion.div
              initial={false}
              animate={{
                scale: checked ? 1 : 0,
                opacity: checked ? 1 : 0,
              }}
              transition={{ duration: 0.15 }}
            >
              <Check
                className="h-3.5 w-3.5"
                style={{ color: "var(--foreground)" }}
                strokeWidth={3}
              />
            </motion.div>
          </motion.div>
        </div>
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <span
                className="text-sm"
                style={{ color: "var(--foreground)" }}
              >
                {label}
              </span>
            )}
            {description && (
              <p
                className="mt-0.5 text-xs"
                style={{ color: "var(--accent)" }}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
