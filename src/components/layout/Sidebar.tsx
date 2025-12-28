"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Target,
  CheckSquare,
  Lightbulb,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flag,
} from "lucide-react";
import { neuInsetSm, neuClasses } from "@/lib/styles/neu";
import { useSidebar } from "@/contexts/SidebarContext";

const navItems = [
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/goals", label: "Goals", icon: Flag },
  { href: "/commitments", label: "Commitments", icon: Target },
  { href: "/strategies", label: "Strategies", icon: Lightbulb },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebar();

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? 72 : 240,
        margin: isCollapsed ? 12 : 0,
        height: isCollapsed ? "calc(100vh - 24px)" : "100vh",
        borderRadius: isCollapsed ? 20 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 z-40 hidden lg:block"
      style={{
        background: "var(--background)",
        boxShadow: isCollapsed
          ? "var(--neu-shadow-lg)"
          : "4px 0 10px -2px var(--shadow-dark)",
      }}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <motion.div
          className="flex items-center px-4"
          animate={{
            height: isCollapsed ? 56 : 64,
            justifyContent: isCollapsed ? "center" : "space-between",
          }}
          style={{ borderBottom: isCollapsed ? "none" : "1px solid var(--shadow-dark)" }}
        >
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Writrospect
            </motion.span>
          )}
          <button
            onClick={toggle}
            className={`rounded-xl p-2 ${neuClasses.transition}`}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" style={{ color: "var(--accent)" }} />
            ) : (
              <ChevronLeft className="h-5 w-5" style={{ color: "var(--accent)" }} />
            )}
          </button>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center rounded-xl text-sm font-medium
                  ${neuClasses.transition}
                  ${isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"}
                `}
                style={isActive ? neuInsetSm : { color: "var(--accent)" }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.boxShadow = "var(--neu-shadow-subtle)";
                    e.currentTarget.style.color = "var(--foreground)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.color = "var(--accent)";
                  }
                }}
              >
                <Icon
                  className="h-5 w-5 flex-shrink-0"
                  style={{ color: isActive ? "var(--foreground)" : "inherit" }}
                />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ color: isActive ? "var(--foreground)" : "inherit" }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.aside>
  );
}
