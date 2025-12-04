"use client";

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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ListItem, ListContainer } from "@/components/ui/ListItem";
import { PageHeader } from "@/components/ui/PageHeader";
import { JournalEntry, Commitment } from "@prisma/client";
import { getTimeContextLabel } from "@/lib/utils/time";
import { getRelativeTime } from "@/lib/utils/relative-time";

interface DashboardClientProps {
  stats: {
    totalEntries: number;
    totalCommitments: number;
    completedCommitments: number;
    activeCommitments: number;
    abandonedCommitments: number;
    totalStrategies: number;
    workingStrategies: number;
    completionRate: number;
    strategySuccessRate: number;
  };
  recentEntries: JournalEntry[];
  recentCommitments: Commitment[];
}

export function DashboardClient({
  stats,
  recentEntries,
  recentCommitments,
}: DashboardClientProps) {
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
        <motion.div variants={item}>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#3d5a80" }}>
                    Journal Entries
                  </p>
                  <p className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
                    {stats.totalEntries}
                  </p>
                </div>
                <div
                  className="rounded-2xl p-3"
                  style={{
                    background: "linear-gradient(135deg, #d6e5f5 0%, #b3cce6 100%)",
                  }}
                >
                  <BookOpen className="h-6 w-6" style={{ color: "#3d5a80" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#6b5b8a" }}>
                    Active Commitments
                  </p>
                  <p className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
                    {stats.activeCommitments}
                  </p>
                </div>
                <div
                  className="rounded-2xl p-3"
                  style={{
                    background: "linear-gradient(135deg, #e8dff5 0%, #d4c8e8 100%)",
                  }}
                >
                  <Target className="h-6 w-6" style={{ color: "#6b5b8a" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#2d6a4f" }}>
                    Completion Rate
                  </p>
                  <p className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
                    {stats.completionRate}%
                  </p>
                </div>
                <div
                  className="rounded-2xl p-3"
                  style={{
                    background: "linear-gradient(135deg, #d4f0e0 0%, #a8dbc4 100%)",
                  }}
                >
                  <CheckCircle className="h-6 w-6" style={{ color: "#2d6a4f" }} />
                </div>
              </div>
              <p className="mt-2 text-xs" style={{ color: "#2d6a4f" }}>
                {stats.completedCommitments} of {stats.totalCommitments} completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#a66321" }}>
                    Strategy Success
                  </p>
                  <p className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
                    {stats.strategySuccessRate}%
                  </p>
                </div>
                <div
                  className="rounded-2xl p-3"
                  style={{
                    background: "linear-gradient(135deg, #ffecd2 0%, #f5d0a9 100%)",
                  }}
                >
                  <Lightbulb className="h-6 w-6" style={{ color: "#a66321" }} />
                </div>
              </div>
              <p className="mt-2 text-xs" style={{ color: "#a66321" }}>
                {stats.workingStrategies} of {stats.totalStrategies} working
              </p>
            </CardContent>
          </Card>
        </motion.div>
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

        {/* Active Commitments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Commitments</CardTitle>
              <Link
                href="/commitments"
                className="flex items-center gap-1 text-sm transition-colors"
                style={{ color: "var(--accent)" }}
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentCommitments.length === 0 ? (
                <p className="text-center text-sm" style={{ color: "var(--accent)" }}>
                  No active commitments.{" "}
                  <Link href="/commitments" style={{ color: "var(--accent-primary)" }}>
                    Create one
                  </Link>
                </p>
              ) : (
                <ListContainer>
                  {recentCommitments.map((commitment, index) => (
                    <ListItem
                      key={commitment.id}
                      isLast={index === recentCommitments.length - 1}
                    >
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {commitment.what}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="info">{commitment.status}</Badge>
                        <span className="text-xs" style={{ color: "var(--accent)" }}>
                          {getRelativeTime(new Date(commitment.createdAt))}
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

      {/* Insights placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
              Pattern Insights Coming Soon
            </h3>
            <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
              As you journal more, we'll surface patterns about when you're most
              productive, which strategies work best, and what conditions lead to
              success.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
