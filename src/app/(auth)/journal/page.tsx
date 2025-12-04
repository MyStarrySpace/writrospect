"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import { EntryEditor } from "@/components/journal/EntryEditor";
import { EntryCard } from "@/components/journal/EntryCard";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
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
      <PageHeader
        title="Journal"
        description="Write freely. The AI will notice patterns and help you track commitments."
      />

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
              <div
                className="rounded-2xl p-8 text-center"
                style={{
                  background: "var(--background)",
                  boxShadow: "var(--neu-shadow-inset)",
                }}
              >
                <p style={{ color: "var(--accent)" }}>
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
              className="h-[calc(100vh-180px)] rounded-2xl overflow-hidden"
              style={{
                background: "var(--background)",
                boxShadow: "var(--neu-shadow)",
              }}
            >
              {selectedEntry ? (
                <div className="flex h-full flex-col">
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1px solid var(--shadow-dark)" }}
                  >
                    <div>
                      <h3 className="font-medium" style={{ color: "var(--foreground)" }}>
                        Chat about this entry
                      </h3>
                      <p className="text-xs" style={{ color: "var(--accent)" }}>
                        {new Date(selectedEntry.date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEntry(null);
                        setShowChat(false);
                      }}
                      className="rounded-xl p-2 transition-shadow"
                      style={{ color: "var(--accent)" }}
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
                  <div
                    className="mb-4"
                  >
                    <MessageSquare className="h-8 w-8" style={{ color: "var(--accent)" }} />
                  </div>
                  <h3 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
                    Select an entry
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: "var(--accent)" }}>
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
            className="fixed inset-0 z-50 lg:hidden"
            style={{ background: "var(--background)" }}
          >
            <div className="flex h-full flex-col">
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid var(--shadow-dark)" }}
              >
                <div>
                  <h3 className="font-medium" style={{ color: "var(--foreground)" }}>
                    Chat about this entry
                  </h3>
                  <p className="text-xs" style={{ color: "var(--accent)" }}>
                    {new Date(selectedEntry.date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="rounded-xl p-2"
                  style={{ color: "var(--accent)" }}
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
          className="fixed bottom-20 right-4 z-40 rounded-2xl p-4 lg:hidden"
          style={{
            background: "var(--background)",
            boxShadow: "var(--neu-shadow)",
            color: "var(--foreground)",
          }}
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
