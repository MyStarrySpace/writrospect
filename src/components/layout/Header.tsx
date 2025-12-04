"use client";

import Link from "next/link";
import { useUser } from "@stackframe/stack";
import { LogOut, User } from "lucide-react";
import { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { neuSubtle, neuDropdown, neuRaisedSm, neuInsetSm, neuClasses } from "@/lib/styles/neu";

function UserMenu() {
  const user = useUser();
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

  if (!user) {
    return (
      <Link
        href="/handler/sign-in"
        className={`rounded-xl px-4 py-2 text-sm font-medium ${neuClasses.interactive}`}
        style={{
          ...neuRaisedSm,
          background: "linear-gradient(145deg, var(--shadow-light), var(--background))",
        }}
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex items-center gap-2 rounded-xl p-1.5 ${neuClasses.transition}`}
        style={neuSubtle}
      >
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={user.displayName || "User"}
            className="h-8 w-8 rounded-xl"
            style={{ boxShadow: "var(--neu-shadow-sm)" }}
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={neuInsetSm}
          >
            <User className="h-4 w-4" style={{ color: "var(--accent)" }} />
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
            className="absolute right-0 mt-2 w-56 py-1"
            style={neuDropdown}
          >
            <div
              className="mx-2 mb-1 rounded-xl px-3 py-3"
              style={neuInsetSm}
            >
              <p
                className="text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
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
  );
}

function UserMenuFallback() {
  return (
    <div
      className="h-9 w-9 animate-pulse rounded-xl"
      style={neuInsetSm}
    />
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-30">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Logo for mobile */}
        <Link
          href="/journal"
          className="text-lg font-semibold lg:hidden"
          style={{ color: "var(--foreground)" }}
        >
          Writrospect
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User dropdown with Suspense */}
        <Suspense fallback={<UserMenuFallback />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
