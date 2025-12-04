"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, Mail } from "lucide-react";

const errorMessages: Record<string, { title: string; description: string; action?: string }> = {
  CONTACT_CHANNEL_ALREADY_USED_FOR_AUTH_BY_SOMEONE_ELSE: {
    title: "Email already in use",
    description: "This email is already associated with another account. Try signing in with the method you originally used, or verify your email on the existing account.",
    action: "Try signing in instead",
  },
  EMAIL_NOT_VERIFIED: {
    title: "Email not verified",
    description: "Please check your inbox and verify your email address before continuing.",
  },
  INVALID_CREDENTIALS: {
    title: "Invalid credentials",
    description: "The email or password you entered is incorrect. Please try again.",
  },
  USER_NOT_FOUND: {
    title: "Account not found",
    description: "We couldn't find an account with that email. Would you like to sign up instead?",
    action: "Create an account",
  },
  DEFAULT: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again or contact support if the problem persists.",
  },
};

export default function AuthError({
  searchParams,
}: {
  searchParams: { errorCode?: string; errorMessage?: string };
}) {
  const errorCode = searchParams.errorCode || "DEFAULT";
  const errorInfo = errorMessages[errorCode] || errorMessages.DEFAULT;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Error Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          {/* Error Content */}
          <div className="text-center">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {errorInfo.title}
            </h1>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {errorInfo.description}
            </p>

            {/* Show raw error code for debugging in dev */}
            {process.env.NODE_ENV === "development" && searchParams.errorMessage && (
              <p className="mt-4 rounded-lg bg-zinc-100 p-3 text-left text-xs font-mono text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {searchParams.errorMessage}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-3">
            {errorCode === "CONTACT_CHANNEL_ALREADY_USED_FOR_AUTH_BY_SOMEONE_ELSE" && (
              <Link
                href="/handler/sign-in"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                <Mail className="h-4 w-4" />
                Sign in to existing account
              </Link>
            )}

            {errorCode === "USER_NOT_FOUND" && (
              <Link
                href="/handler/sign-up"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                Create an account
              </Link>
            )}

            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </div>

        {/* Help text */}
        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Need help?{" "}
          <a href="mailto:support@example.com" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
