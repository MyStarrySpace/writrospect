"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  Target,
  CheckCircle,
  XCircle,
  Lightbulb,
  TrendingUp,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { JournalEntry, Commitment } from "@prisma/client";
import { getTimeContextLabel } from "@/lib/utils/time";

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Your accountability overview at a glance.
        </p>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Journal Entries
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {stats.totalEntries}
                  </p>
                </div>
                <div className="rounded-full bg-blue-200 p-3 dark:bg-blue-800">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    Active Commitments
                  </p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {stats.activeCommitments}
                  </p>
                </div>
                <div className="rounded-full bg-purple-200 p-3 dark:bg-purple-800">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Completion Rate
                  </p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {stats.completionRate}%
                  </p>
                </div>
                <div className="rounded-full bg-green-200 p-3 dark:bg-green-800">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                {stats.completedCommitments} of {stats.totalCommitments} completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Strategy Success
                  </p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                    {stats.strategySuccessRate}%
                  </p>
                </div>
                <div className="rounded-full bg-amber-200 p-3 dark:bg-amber-800">
                  <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
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
                className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentEntries.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No entries yet.{" "}
                  <Link href="/journal" className="text-blue-600 hover:underline">
                    Write your first one
                  </Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {recentEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50"
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <Clock className="h-3 w-3" />
                        {new Date(entry.date).toLocaleDateString()}
                        <Badge variant="default" className="text-[10px]">
                          {getTimeContextLabel(entry.timeContext)}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        {entry.content.length > 100
                          ? `${entry.content.slice(0, 100)}...`
                          : entry.content}
                      </p>
                    </div>
                  ))}
                </div>
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
                className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentCommitments.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No active commitments.{" "}
                  <Link
                    href="/commitments"
                    className="text-blue-600 hover:underline"
                  >
                    Create one
                  </Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {recentCommitments.map((commitment) => {
                    const daysOld = Math.floor(
                      (Date.now() - new Date(commitment.createdAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    return (
                      <div
                        key={commitment.id}
                        className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50"
                      >
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {commitment.what}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="info">{commitment.status}</Badge>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {daysOld} days old
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
