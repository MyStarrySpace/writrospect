"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

function MainContent({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <motion.div
      initial={false}
      animate={{
        paddingLeft: isCollapsed ? 96 : 240, // 72 + 24 margin when collapsed, 240 when expanded
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden lg:block"
    >
      <Header />
      <main className="px-6 py-6">{children}</main>
    </motion.div>
  );
}

function MobileContent({ children }: { children: ReactNode }) {
  return (
    <div className="lg:hidden">
      <Header />
      <main className="px-4 py-6 pb-24">{children}</main>
    </div>
  );
}

export function AuthLayoutClient({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <Sidebar />
        <MainContent>{children}</MainContent>
        <MobileContent>{children}</MobileContent>
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}
