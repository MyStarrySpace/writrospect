"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--foreground)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-xl border-none px-4 py-2.5 text-sm
            placeholder:opacity-50
            focus:outline-none
            disabled:cursor-not-allowed disabled:opacity-50
            transition-shadow duration-200
            ${className}
          `}
          style={{
            background: "var(--background)",
            color: "var(--foreground)",
            boxShadow: error
              ? "inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light), 0 0 0 2px #ef4444"
              : "var(--neu-shadow-inset)",
          }}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.boxShadow =
                "var(--neu-shadow-inset), 0 0 0 2px var(--accent)";
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.currentTarget.style.boxShadow = "var(--neu-shadow-inset)";
            }
          }}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm" style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm" style={{ color: "var(--accent)" }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
