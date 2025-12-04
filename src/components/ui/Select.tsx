"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  value,
  onChange,
  disabled = false,
  className = "",
  id,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange?.({ target: { value: optionValue } });
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown" && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex((opt) => opt.value === value);
      const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
      handleSelect(options[nextIndex].value);
    } else if (e.key === "ArrowUp" && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex((opt) => opt.value === value);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
      handleSelect(options[prevIndex].value);
    }
  };

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-3 block text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {/* Select trigger */}
        <div
          id={selectId}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => !isOpen && setIsFocused(false)}
          className={`
            w-full cursor-pointer rounded-xl px-4 py-2.5 pr-10 text-sm
            transition-shadow duration-200 select-none
            ${disabled ? "cursor-not-allowed opacity-50" : ""}
            ${className}
          `}
          style={{
            background: "var(--background)",
            color: selectedOption ? "var(--foreground)" : "var(--accent)",
            boxShadow: error
              ? "inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light), 0 0 0 2px #ef4444"
              : isFocused || isOpen
              ? "var(--neu-shadow-inset), 0 0 0 2px var(--accent)"
              : "var(--neu-shadow-inset)",
          }}
        >
          {selectedOption?.label || placeholder || "Select..."}
        </div>

        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          style={{ color: "var(--accent)" }}
        />

        {/* Dropdown options */}
        {isOpen && (
          <div
            role="listbox"
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl py-2"
            style={{
              background: "var(--background)",
              boxShadow: "8px 8px 20px var(--shadow-dark), -8px -8px 20px var(--shadow-light)",
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onClick={() => handleSelect(option.value)}
                className="cursor-pointer px-4 py-2.5 text-sm transition-colors"
                style={{
                  background: option.value === value ? "var(--shadow-dark)" : "transparent",
                  color: option.value === value ? "var(--foreground)" : "var(--accent)",
                }}
                onMouseEnter={(e) => {
                  if (option.value !== value) {
                    e.currentTarget.style.background = "var(--shadow-light)";
                    e.currentTarget.style.color = "var(--foreground)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (option.value !== value) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--accent)";
                  }
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}
