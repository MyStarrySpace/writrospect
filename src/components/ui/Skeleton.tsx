"use client";

import { HTMLAttributes } from "react";
import { neuInsetSm, neuRaised } from "@/lib/styles/neu";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className = "", style, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{
        background: "var(--background)",
        boxShadow: "var(--neu-shadow-inset-sm)",
        ...style,
      }}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5"
      style={neuRaised}
    >
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4">
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}
