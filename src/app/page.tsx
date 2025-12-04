import { stackServerApp } from "@/stack";
import { redirect } from "next/navigation";
import { BookOpen, Target, Lightbulb, ArrowRight } from "lucide-react";

export default async function Home() {
  const user = await stackServerApp.getUser();

  // If logged in, redirect to journal
  if (user) {
    redirect("/journal");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950" />
        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-6xl">
              Accountabili-Bot
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              An AI-assisted accountability journal that learns your patterns, tracks your
              commitments, and helps you understand what actually works for you.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <a
                href="/handler/sign-in"
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 inline-flex rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
              <BookOpen className="h-6 w-6 text-zinc-700 dark:text-zinc-300" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Journal Your Way
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Write freely without judgment. The AI notices patterns you might miss and reflects
              them back without prescribing solutions.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 inline-flex rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
              <Target className="h-6 w-6 text-zinc-700 dark:text-zinc-300" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Track Commitments
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Your commitments are tracked and gently checked in on. No shame, just honest
              questions about what happened.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 inline-flex rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
              <Lightbulb className="h-6 w-6 text-zinc-700 dark:text-zinc-300" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Learn What Works
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              The system learns which strategies lead to completion for YOU—not generic advice,
              your actual patterns.
            </p>
          </div>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            The Anti-Productivity App
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            This isn't about optimization or hustle culture. It's about understanding how you
            actually work—your rhythms, your blocks, your wins—and building a system that adapts
            to you, not the other way around.
          </p>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
            No cheerleading. No shame. Just honest pattern recognition and suggestions based on
            what's actually worked for you before.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Your data is yours. Your patterns are personal. This tool learns to help, not to
            judge.
          </p>
        </div>
      </footer>
    </div>
  );
}
