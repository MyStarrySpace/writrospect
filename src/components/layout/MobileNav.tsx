"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CheckSquare,
  Target,
  Flag,
  Lightbulb,
  LayoutDashboard,
  Zap,
  Settings,
  TrendingUp,
} from "lucide-react";
import { neuInsetSm, neuClasses } from "@/lib/styles/neu";
import { useTokenUsage } from "@/hooks/useTokenUsage";

const growthItems = [
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/goals", label: "Goals", icon: Flag },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/strategies", label: "Strategies", icon: Lightbulb },
];

const growthPaths = growthItems.map((i) => i.href);

export function MobileNav() {
  const pathname = usePathname();
  const [showGrowth, setShowGrowth] = useState(false);
  const growthRef = useRef<HTMLDivElement>(null);
  const { tokensRemaining, isLoading } = useTokenUsage();

  const isGrowthActive = growthPaths.some((p) => pathname === p);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (growthRef.current && !growthRef.current.contains(event.target as Node)) {
        setShowGrowth(false);
      }
    }

    if (showGrowth) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showGrowth]);

  const formatTokens = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  const NavLink = ({
    href,
    label,
    icon: Icon,
    isActive,
    children,
  }: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    isActive: boolean;
    children?: React.ReactNode;
  }) => (
    <Link
      href={href}
      className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 ${neuClasses.transition}`}
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
        {label}
      </span>
      {children}
    </Link>
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{
        background: "var(--background)",
        boxShadow: "0 -4px 10px -2px var(--shadow-dark)",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
      }}
    >
      <div className="flex h-16 items-center justify-around px-1 py-1">
        {/* Journal */}
        <NavLink href="/journal" label="Journal" icon={BookOpen} isActive={pathname === "/journal"} />

        {/* My Growth - popup */}
        <div className="relative" ref={growthRef}>
          <button
            onClick={() => setShowGrowth(!showGrowth)}
            className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 ${neuClasses.transition}`}
            style={isGrowthActive || showGrowth ? neuInsetSm : undefined}
          >
            <TrendingUp
              className="relative z-10 h-5 w-5"
              style={{ color: isGrowthActive || showGrowth ? "var(--foreground)" : "var(--accent)" }}
            />
            <span
              className="relative z-10 text-[10px] font-medium"
              style={{ color: isGrowthActive || showGrowth ? "var(--foreground)" : "var(--accent)" }}
            >
              My Growth
            </span>
          </button>

          <AnimatePresence>
            {showGrowth && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 rounded-2xl p-2 min-w-[160px]"
                style={{
                  background: "var(--background)",
                  boxShadow: "6px 6px 16px var(--shadow-dark), -6px -6px 16px var(--shadow-light)",
                }}
              >
                {growthItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowGrowth(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${neuClasses.transition}`}
                      style={isActive ? neuInsetSm : undefined}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: isActive ? "var(--foreground)" : "var(--accent)" }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: isActive ? "var(--foreground)" : "var(--accent)" }}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dashboard */}
        <NavLink
          href="/dashboard"
          label="Dashboard"
          icon={LayoutDashboard}
          isActive={pathname === "/dashboard"}
        />

        {/* Credits */}
        <NavLink
          href="/settings/billing"
          label={isLoading ? "Credits" : `${formatTokens(tokensRemaining)} credits`}
          icon={Zap}
          isActive={pathname === "/settings/billing"}
        />

        {/* Settings */}
        <NavLink href="/settings" label="Settings" icon={Settings} isActive={pathname === "/settings"} />
      </div>
    </nav>
  );
}
