"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

function Banner() {
  const { bannerUrl, currentTheme } = useTheme();

  return (
    <div
      className="relative h-32 w-full overflow-hidden lg:h-40"
      style={{
        background: `linear-gradient(135deg, var(--shadow-dark) 0%, var(--accent-primary) 100%)`,
      }}
    >
      <Image
        src={bannerUrl}
        alt={currentTheme.name}
        fill
        className="object-cover"
        priority
        onError={(e) => {
          // Hide image if it fails to load, gradient will show through
          (e.target as HTMLImageElement).style.opacity = "0";
        }}
      />
      {/* Gradient overlay for better text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, var(--background) 0%, transparent 50%)",
        }}
      />
    </div>
  );
}

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
      <Banner />
      <Header />
      <main className="px-6 py-6">{children}</main>
    </motion.div>
  );
}

function MobileContent({ children }: { children: ReactNode }) {
  return (
    <div className="lg:hidden">
      <Banner />
      <Header />
      <main className="px-4 py-6 pb-24">{children}</main>
    </div>
  );
}

function LayoutContent({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar />
      <MainContent>{children}</MainContent>
      <MobileContent>{children}</MobileContent>
      <MobileNav />
    </div>
  );
}

export function AuthLayoutClient({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </ThemeProvider>
  );
}
