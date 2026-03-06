"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  Target,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  ArrowRight,
  Clock,
  Sparkles,
  Moon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ListItem, ListContainer } from "@/components/ui/ListItem";
import { PageHeader } from "@/components/ui/PageHeader";
import { JournalEntry, Habit } from "@prisma/client";
import { getTimeContextLabel } from "@/lib/utils/time";
import { getRelativeTime } from "@/lib/utils/relative-time";
import { useTheme } from "@/contexts/ThemeContext";

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

interface StatCardConfig {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  hue: number; // -1 means use theme hue
}

function getStatStyles(hue: number, themeHsl: [number, number, number], isDark: boolean) {
  const effectiveHue = hue === -1 ? themeHsl[0] : hue;
  if (isDark) {
    const sat = Math.min(themeHsl[1] * 0.7, 60);
    return {
      labelColor: `hsl(${effectiveHue}, ${sat + 10}%, 70%)`,
      subtitleColor: `hsl(${effectiveHue}, ${sat}%, 55%)`,
      iconBox: {
        background: `linear-gradient(135deg, hsla(${effectiveHue}, ${sat}%, 35%, 0.3), hsla(${effectiveHue}, ${sat}%, 25%, 0.2))`,
        boxShadow: `0 0 12px hsla(${effectiveHue}, ${sat}%, 50%, 0.15), inset 0 1px 0 hsla(${effectiveHue}, ${sat}%, 60%, 0.1)`,
        border: `1px solid hsla(${effectiveHue}, ${sat}%, 50%, 0.2)`,
      },
      iconColor: `hsl(${effectiveHue}, ${sat + 15}%, 70%)`,
    };
  }
  // Light mode — keep the existing pastel feel but derive from hue
  return {
    labelColor: `hsl(${effectiveHue}, 35%, 35%)`,
    subtitleColor: `hsl(${effectiveHue}, 30%, 40%)`,
    iconBox: {
      background: `linear-gradient(135deg, hsl(${effectiveHue}, 40%, 88%), hsl(${effectiveHue}, 45%, 80%))`,
    },
    iconColor: `hsl(${effectiveHue}, 35%, 35%)`,
  };
}

export interface PatternInsight {
  icon: "clock" | "sparkles" | "lightbulb" | "target" | "moon" | "trending";
  title: string;
  description: string;
  variant: "default" | "secondary" | "success" | "warning" | "danger" | "info";
}

interface DashboardClientProps {
  stats: {
    totalEntries: number;
    totalHabits: number;
    completedHabits: number;
    activeHabits: number;
    abandonedHabits: number;
    totalStrategies: number;
    workingStrategies: number;
    completionRate: number;
    strategySuccessRate: number;
  };
  recentEntries: JournalEntry[];
  recentHabits: Habit[];
  insights?: PatternInsight[];
}

const insightIcons = {
  clock: Clock,
  sparkles: Sparkles,
  lightbulb: Lightbulb,
  target: Target,
  moon: Moon,
  trending: TrendingUp,
};

export function DashboardClient({
  stats,
  recentEntries,
  recentHabits,
  insights = [],
}: DashboardClientProps) {
  const { effectiveMode, currentColors } = useTheme();
  const isDark = effectiveMode === "dark";

  const themeHsl = useMemo(
    () => hexToHsl(currentColors.accentPrimary),
    [currentColors.accentPrimary]
  );

  const statCards: StatCardConfig[] = [
    {
      label: "Journal Entries",
      value: stats.totalEntries,
      icon: BookOpen,
      hue: 210,
    },
    {
      label: "Active Habits",
      value: stats.activeHabits,
      icon: Target,
      hue: 270,
    },
    {
      label: "Completion Rate",
      value: `${stats.completionRate}%`,
      subtitle: `${stats.completedHabits} of ${stats.totalHabits} completed`,
      icon: CheckCircle,
      hue: 155,
    },
    {
      label: "Strategy Success",
      value: `${stats.strategySuccessRate}%`,
      subtitle: `${stats.workingStrategies} of ${stats.totalStrategies} working`,
      icon: Lightbulb,
      hue: 38,
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Dashboard"
        description="Your accountability overview at a glance."
      />

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((card) => {
          const styles = getStatStyles(card.hue, themeHsl, isDark);
          const Icon = card.icon;
          return (
            <motion.div key={card.label} variants={item} className="h-full">
              <Card className="h-full">
                <CardContent className="flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: styles.labelColor }}>
                        {card.label}
                      </p>
                      <p className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
                        {card.value}
                      </p>
                    </div>
                    <div
                      className="rounded-2xl p-3"
                      style={styles.iconBox}
                    >
                      <Icon className="h-6 w-6" style={{ color: styles.iconColor }} />
                    </div>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: styles.subtitleColor, visibility: card.subtitle ? "visible" : "hidden" }}>
                    {card.subtitle || "\u00A0"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Entries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Entries</CardTitle>
              <Link
                href="/journal"
                className="flex items-center gap-1 text-sm transition-colors"
                style={{ color: "var(--accent)" }}
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentEntries.length === 0 ? (
                <p className="text-center text-sm" style={{ color: "var(--accent)" }}>
                  No entries yet.{" "}
                  <Link href="/journal" style={{ color: "var(--accent-primary)" }}>
                    Write your first one
                  </Link>
                </p>
              ) : (
                <ListContainer>
                  {recentEntries.map((entry, index) => (
                    <ListItem
                      key={entry.id}
                      isLast={index === recentEntries.length - 1}
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs" style={{ color: "var(--accent)" }}>
                        <Clock className="h-3 w-3" />
                        {new Date(entry.date).toLocaleDateString()}
                        <Badge variant="default" className="text-[10px]">
                          {getTimeContextLabel(entry.timeContext)}
                        </Badge>
                      </div>
                      <p className="text-sm" style={{ color: "var(--foreground)" }}>
                        {entry.content.length > 100
                          ? `${entry.content.slice(0, 100)}...`
                          : entry.content}
                      </p>
                    </ListItem>
                  ))}
                </ListContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Habits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Habits</CardTitle>
              <Link
                href="/habits"
                className="flex items-center gap-1 text-sm transition-colors"
                style={{ color: "var(--accent)" }}
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentHabits.length === 0 ? (
                <p className="text-center text-sm" style={{ color: "var(--accent)" }}>
                  No active habits.{" "}
                  <Link href="/habits" style={{ color: "var(--accent-primary)" }}>
                    Create one
                  </Link>
                </p>
              ) : (
                <ListContainer>
                  {recentHabits.map((habit, index) => (
                    <ListItem
                      key={habit.id}
                      isLast={index === recentHabits.length - 1}
                    >
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {habit.what}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="info">{habit.status}</Badge>
                        <span className="text-xs" style={{ color: "var(--accent)" }}>
                          {getRelativeTime(new Date(habit.createdAt))}
                        </span>
                      </div>
                    </ListItem>
                  ))}
                </ListContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pattern Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" style={{ color: "var(--accent-primary)" }} />
                Pattern Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {insights.map((insight, index) => {
                  const Icon = insightIcons[insight.icon];
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex gap-3 rounded-xl p-3"
                      style={{
                        background: "var(--background)",
                        boxShadow: "var(--neu-shadow-inset-sm)",
                      }}
                    >
                      <div className="flex-shrink-0 pt-0.5">
                        <Badge variant={insight.variant} className="!p-2">
                          <Icon className="h-4 w-4" />
                        </Badge>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                          {insight.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--accent)" }}>
                          {insight.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
