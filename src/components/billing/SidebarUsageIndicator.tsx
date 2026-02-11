"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useUser } from "@stackframe/stack";
import { useTokenUsage } from "@/hooks/useTokenUsage";
import { neuDropdown, neuInsetSm, neuClasses } from "@/lib/styles/neu";

interface SidebarUsageIndicatorProps {
  isCollapsed: boolean;
}

export function SidebarUsageIndicator({ isCollapsed }: SidebarUsageIndicatorProps) {
  const user = useUser();
  const { usage, isLoading, percentageUsed, statusColor, tokensRemaining } = useTokenUsage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading || !usage) {
    return null;
  }

  const getColorValues = () => {
    switch (statusColor) {
      case "red":
        return { bg: "#ef4444", text: "#ef4444" };
      case "yellow":
        return { bg: "#f59e0b", text: "#f59e0b" };
      default:
        return { bg: "#22c55e", text: "#22c55e" };
    }
  };

  const colors = getColorValues();

  const formatTokens = (n: number) => {
    if (n >= 1000) {
      return `${(n / 1000).toFixed(1)}k`;
    }
    return n.toString();
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 px-2 py-3" ref={dropdownRef}>
        {/* Token indicator */}
        {usage && (
          <Link
            href="/settings/billing"
            className="block"
            title={`${tokensRemaining} tokens remaining`}
          >
            <div
              className="relative flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: "var(--background)",
                boxShadow: "var(--neu-shadow-sm)",
              }}
            >
              <Zap className="h-5 w-5" style={{ color: colors.text }} />
              <svg className="absolute inset-0" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="var(--shadow-dark)"
                  strokeWidth="3"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke={colors.bg}
                  strokeWidth="3"
                  strokeDasharray={`${(Math.min(100, percentageUsed) / 100) * 113} 113`}
                  strokeLinecap="round"
                  transform="rotate(-90 20 20)"
                  style={{ transition: "stroke-dasharray 0.3s ease" }}
                />
              </svg>
            </div>
          </Link>
        )}

        {/* User avatar */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center justify-center rounded-xl ${neuClasses.transition}`}
              title={user.displayName || "User menu"}
            >
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.displayName || "User"}
                  className="h-10 w-10 rounded-xl"
                  style={{ boxShadow: "var(--neu-shadow-sm)" }}
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background: "var(--background)",
                    boxShadow: "var(--neu-shadow-sm)",
                  }}
                >
                  <User className="h-5 w-5" style={{ color: "var(--accent)" }} />
                </div>
              )}
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-full mb-2 ml-2 w-56 py-1"
                  style={neuDropdown}
                >
                  <div className="mx-2 mb-1 rounded-xl px-3 py-3" style={neuInsetSm}>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {user.displayName || "User"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--accent)" }}>
                      {user.primaryEmail}
                    </p>
                  </div>
                  <button
                    onClick={() => user.signOut()}
                    className={`mx-2 flex w-[calc(100%-16px)] items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${neuClasses.transition}`}
                    style={{ color: "var(--foreground)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "var(--neu-shadow-inset-sm)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <LogOut className="h-4 w-4" style={{ color: "var(--accent)" }} />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-3 mb-3 space-y-3" ref={dropdownRef}>
      {/* Token usage */}
      {usage && (
        <Link
          href="/settings/billing"
          className="block rounded-xl p-3 transition-all hover:opacity-80"
          style={{
            background: "var(--background)",
            boxShadow: "var(--neu-shadow-sm)",
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" style={{ color: colors.text }} />
              <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                Tokens
              </span>
            </div>
            <span className="text-xs" style={{ color: "var(--accent)" }}>
              {formatTokens(tokensRemaining)} left
            </span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: "var(--shadow-dark)" }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, percentageUsed)}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ background: colors.bg }}
            />
          </div>
        </Link>
      )}

      {/* User section */}
      {user && (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex w-full items-center gap-3 rounded-xl p-2 ${neuClasses.transition}`}
            style={{
              background: "var(--background)",
              boxShadow: "var(--neu-shadow-sm)",
            }}
          >
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.displayName || "User"}
                className="h-8 w-8 rounded-lg"
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={neuInsetSm}
              >
                <User className="h-4 w-4" style={{ color: "var(--accent)" }} />
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                {user.displayName || "User"}
              </p>
            </div>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 right-0 mb-2 py-1"
                style={neuDropdown}
              >
                <div className="mx-2 mb-1 rounded-xl px-3 py-3" style={neuInsetSm}>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {user.displayName || "User"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--accent)" }}>
                    {user.primaryEmail}
                  </p>
                </div>
                <button
                  onClick={() => user.signOut()}
                  className={`mx-2 flex w-[calc(100%-16px)] items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${neuClasses.transition}`}
                  style={{ color: "var(--foreground)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "var(--neu-shadow-inset-sm)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <LogOut className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
