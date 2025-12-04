"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-3 block text-sm font-medium"
            style={{ color: "var(--foreground)" }}
          >
            {label}
          </label>
        )}
        {/* Outer container with raised shadow */}
        <div
          className="rounded-3xl p-[2px] transition-all duration-200"
          style={{
            background: error
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : "linear-gradient(135deg, #DED0DD 0%, #E0D2DF 100%)",
            boxShadow: "6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light)",
          }}
        >
          {/* Inner container with inset shadow */}
          <div
            className="rounded-[22px] px-4 py-3"
            style={{
              background: "var(--background)",
              boxShadow: "inset 4px 4px 12px var(--shadow-dark), inset -4px -4px 12px var(--shadow-light)",
            }}
          >
            <textarea
              ref={ref}
              id={textareaId}
              className={`
                w-full border-none text-sm
                placeholder:opacity-60 resize-y
                focus:outline-none
                disabled:cursor-not-allowed disabled:opacity-50
                ${className}
              `}
              style={{
                background: "transparent",
                color: "var(--foreground)",
                minHeight: "120px",
              }}
              onFocus={(e) => {
                if (!error) {
                  const wrapper = e.currentTarget.parentElement?.parentElement;
                  if (wrapper) {
                    wrapper.style.background = "linear-gradient(135deg, var(--accent-soft) 0%, var(--accent) 100%)";
                  }
                }
              }}
              onBlur={(e) => {
                if (!error) {
                  const wrapper = e.currentTarget.parentElement?.parentElement;
                  if (wrapper) {
                    wrapper.style.background = "linear-gradient(135deg, #DED0DD 0%, #E0D2DF 100%)";
                  }
                }
              }}
              {...props}
            />
          </div>
        </div>
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

Textarea.displayName = "Textarea";
