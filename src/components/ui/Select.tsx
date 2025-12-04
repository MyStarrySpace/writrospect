"use client";

import { forwardRef, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--foreground)" }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full appearance-none rounded-xl border-none px-4 py-2.5 pr-10 text-sm
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
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--accent)" }}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm" style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
