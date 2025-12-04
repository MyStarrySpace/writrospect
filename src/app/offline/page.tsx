import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
          <WifiOff className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          You're offline
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Please check your internet connection and try again.
        </p>
      </div>
    </div>
  );
}
