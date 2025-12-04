"use client";

import { Loader2 } from "lucide-react";
import { neuRaised } from "@/lib/styles/neu";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <Loader2
      className={`animate-spin ${sizeStyles[size]} ${className}`}
      style={{ color: "var(--accent)" }}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "var(--background)" }}
    >
      <div
        className="rounded-2xl p-6"
        style={neuRaised}
      >
        <Spinner size="lg" />
      </div>
    </div>
  );
}
