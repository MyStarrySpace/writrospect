"use client";

import { forwardRef, InputHTMLAttributes, useId, ReactNode } from "react";
import { motion } from "framer-motion";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
  description?: string;
  icon?: ReactNode;
  size?: "sm" | "md";
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, icon, size = "md", className = "", id: providedId, checked, disabled, onChange, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;

    const sizes = {
      sm: { track: "h-5 w-9", thumb: "h-3.5 w-3.5", translate: 16 },
      md: { track: "h-6 w-11", thumb: "h-4 w-4", translate: 20 },
    };

    const { track, thumb, translate } = sizes[size];

    const handleClick = () => {
      if (!disabled && onChange) {
        const syntheticEvent = {
          target: { checked: !checked },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div
        className={`flex items-center justify-between gap-3 ${disabled ? "opacity-50" : ""} ${className}`}
      >
        <input
          ref={ref}
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="sr-only"
          {...props}
        />

        {(icon || label || description) && (
          <label
            htmlFor={id}
            className={`flex flex-1 items-center gap-3 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            {icon}
            {(label || description) && (
              <div>
                {label && (
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    {label}
                  </span>
                )}
                {description && (
                  <p
                    className="text-xs"
                    style={{ color: "var(--accent)" }}
                  >
                    {description}
                  </p>
                )}
              </div>
            )}
          </label>
        )}

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={handleClick}
          disabled={disabled}
          className={`relative flex-shrink-0 ${track} rounded-full transition-colors disabled:cursor-not-allowed`}
          style={{
            background: checked ? "var(--foreground)" : "var(--shadow-dark)",
            boxShadow: "var(--neu-shadow-inset-sm)",
          }}
        >
          <motion.div
            className={`absolute top-1 ${thumb} rounded-full`}
            style={{
              background: "var(--background)",
              boxShadow: "var(--neu-shadow-sm)",
            }}
            animate={{ x: checked ? translate : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
    );
  }
);

Switch.displayName = "Switch";
