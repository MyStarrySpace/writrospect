"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import { EntryEditor } from "@/components/journal/EntryEditor";
import { EntryCard } from "@/components/journal/EntryCard";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useEntries } from "@/hooks/useEntries";
import { useToast } from "@/components/ui/Toast";
import { JournalEntry } from "@prisma/client";

export default function JournalPage() {
  const {
    entries,
    isLoading,
    error,
    hasMore,
    createEntry,
    deleteEntry,
    loadMore,
  } = useEntries();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleSubmit = async (content: string, conditions: string[]) => {
    setIsSubmitting(true);
    const entry = await createEntry(content, conditions);
    setIsSubmitting(false);

    if (entry) {
      addToast("success", "Entry created");
      // Optionally auto-open chat for the new entry
      setSelectedEntry(entry);
      setShowChat(true);
    } else {
      addToast("error", "Failed to create entry");
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteEntry(id);
    if (success) {
      addToast("success", "Entry deleted");
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
        setShowChat(false);
      }
    } else {
      addToast("error", "Failed to delete entry");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Journal
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Write freely. The AI will notice patterns and help you track commitments.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Editor and entries */}
        <div className="space-y-6">
          <EntryEditor onSubmit={handleSubmit} isSubmitting={isSubmitting} />

          {/* Entries list */}
          <div className="space-y-4">
            {isLoading && entries.length === 0 ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : error ? (
              <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                <p className="text-zinc-500 dark:text-zinc-400">
                  No entries yet. Write your first journal entry above.
                </p>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onSelect={(e) => {
                        setSelectedEntry(e);
                        setShowChat(true);
                      }}
                      onDelete={handleDelete}
                      isSelected={selectedEntry?.id === entry.id}
                    />
                  ))}
                </AnimatePresence>

                {hasMore && (
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      onClick={loadMore}
                      isLoading={isLoading}
                    >
                      Load more
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right column: Chat panel */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-[calc(100vh-180px)] rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              {selectedEntry ? (
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                        Chat about this entry
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {new Date(selectedEntry.date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEntry(null);
                        setShowChat(false);
                      }}
                      className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <ChatInterface
                    entryId={selectedEntry.id}
                    initialMessage={`I just wrote this journal entry:\n\n"${selectedEntry.content}"\n\nWhat patterns do you notice? Are there any commitments to track?`}
                  />
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
                    <MessageSquare className="h-8 w-8 text-zinc-400" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                    Select an entry
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Click on a journal entry to start chatting about it with your
                    AI accountability partner.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile chat overlay */}
      <AnimatePresence>
        {showChat && selectedEntry && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 lg:hidden"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                    Chat about this entry
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {new Date(selectedEntry.date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ChatInterface
                entryId={selectedEntry.id}
                initialMessage={`I just wrote this journal entry:\n\n"${selectedEntry.content}"\n\nWhat patterns do you notice? Are there any commitments to track?`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile chat FAB */}
      {selectedEntry && !showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-20 right-4 z-40 rounded-full bg-zinc-900 p-4 text-white shadow-lg lg:hidden dark:bg-zinc-100 dark:text-zinc-900"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
