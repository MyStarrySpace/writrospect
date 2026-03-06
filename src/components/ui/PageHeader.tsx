"use client";

import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--foreground)" }}
        >
          {title}
        </h1>
        {description && (
          <p className="hidden sm:block" style={{ color: "var(--accent)" }}>{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
