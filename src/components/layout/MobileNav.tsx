"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckSquare,
  Target,
  Lightbulb,
  LayoutDashboard,
  Flag,
} from "lucide-react";
import { neuInsetSm, neuClasses } from "@/lib/styles/neu";

const navItems = [
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/goals", label: "Goals", icon: Flag },
  { href: "/commitments", label: "Commits", icon: Target },
  { href: "/strategies", label: "Strategies", icon: Lightbulb },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 pb-safe lg:hidden"
      style={{
        background: "var(--background)",
        boxShadow: "0 -4px 10px -2px var(--shadow-dark)",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
      }}
    >
      <div className="flex h-16 items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex flex-col items-center gap-1 rounded-xl px-3 py-2
                ${neuClasses.transition}
              `}
              style={isActive ? neuInsetSm : undefined}
            >
              <Icon
                className="relative z-10 h-5 w-5"
                style={{ color: isActive ? "var(--foreground)" : "var(--accent)" }}
              />
              <span
                className="relative z-10 text-[10px] font-medium"
                style={{ color: isActive ? "var(--foreground)" : "var(--accent)" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
