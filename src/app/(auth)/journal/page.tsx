"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, HelpCircle } from "lucide-react";
import { EntryEditor } from "@/components/journal/EntryEditor";
import { EntryCard } from "@/components/journal/EntryCard";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
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
    updateEntry,
    deleteEntry,
    loadMore,
  } = useEntries();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntryTop, setSelectedEntryTop] = useState(0);
  const [editorHasContent, setEditorHasContent] = useState(false);
  const [isStuckMode, setIsStuckMode] = useState(false);
  const entryRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const leftColumnRef = useRef<HTMLDivElement>(null);

  // Track position of selected entry
  const handleEntrySelect = (entry: JournalEntry, element: HTMLDivElement | null) => {
    setSelectedEntry(entry);
    setShowChat(true);
    setIsStuckMode(false);
    if (element && leftColumnRef.current) {
      // Get the entry's position relative to the left column's scroll container
      const columnRect = leftColumnRef.current.getBoundingClientRect();
      const entryRect = element.getBoundingClientRect();
      const relativeTop = entryRect.top - columnRect.top + leftColumnRef.current.scrollTop;
      setSelectedEntryTop(relativeTop);
    }
  };

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

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditContent(entry.content);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || !editContent.trim()) return;

    setIsEditing(true);
    const updated = await updateEntry(editingEntry.id, { content: editContent.trim() });
    setIsEditing(false);

    if (updated) {
      addToast("success", "Entry updated");
      setEditingEntry(null);
      setEditContent("");
      // Update selected entry if it was the one being edited
      if (selectedEntry?.id === updated.id) {
        setSelectedEntry(updated);
      }
    } else {
      addToast("error", "Failed to update entry");
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

  const handleAddToEntry = async (content: string) => {
    if (!selectedEntry) return;

    const updated = await updateEntry(selectedEntry.id, {
      content: selectedEntry.content + "\n\n" + content,
    });

    if (updated) {
      addToast("success", "Added to entry");
      setSelectedEntry(updated);
    } else {
      addToast("error", "Failed to update entry");
    }
  };

  const handleCreateEntry = async (content: string, conditions?: string[]) => {
    const entry = await createEntry(content, conditions || []);

    if (entry) {
      addToast("success", "Entry created");
      setSelectedEntry(entry);
    } else {
      addToast("error", "Failed to create entry");
    }
  };

  const handleApplyStyleEdit = async (editId: string, originalText: string, suggestedText: string) => {
    if (!selectedEntry) return;

    // Replace the original text with the suggested text in the entry
    const newContent = selectedEntry.content.replace(originalText, suggestedText);

    if (newContent === selectedEntry.content) {
      // The original text wasn't found - maybe already edited
      addToast("info", "Edit already applied or text not found");
      return;
    }

    const updated = await updateEntry(selectedEntry.id, { content: newContent });

    if (updated) {
      addToast("success", "Style edit applied");
      setSelectedEntry(updated);
    } else {
      addToast("error", "Failed to apply edit");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-3">
      <PageHeader
        title="Journal"
        description="Write freely. The AI will notice patterns and help you track commitments."
      />

      <div className={`grid gap-6 ${(selectedEntry || isStuckMode) ? "lg:grid-cols-2" : "lg:grid-cols-[3fr_1fr]"}`}>
        {/* Left column: Editor and entries */}
        <div
          ref={leftColumnRef}
          className="space-y-6"
        >
          <EntryEditor
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isCompact={selectedEntry !== null || isStuckMode}
            onContentChange={(content) => setEditorHasContent(content.length > 0)}
          />

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
                    <div
                      key={entry.id}
                      ref={(el) => {
                        if (el) entryRefs.current.set(entry.id, el);
                      }}
                    >
                      <EntryCard
                        entry={entry}
                        onSelect={() => handleEntrySelect(entry, entryRefs.current.get(entry.id) || null)}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isSelected={selectedEntry?.id === entry.id}
                      />
                    </div>
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

        {/* Right column: Chat panel - sticky positioning */}
        <div className="hidden lg:block">
          <div
            className={`sticky top-4 ${(selectedEntry || isStuckMode) ? "h-[calc(100vh-100px)]" : ""}`}
          >
            <motion.div
              className="rounded-2xl flex flex-col"
              style={{
                background: "var(--background)",
                boxShadow: "var(--neu-shadow)",
                height: (selectedEntry || isStuckMode) ? "100%" : "auto",
              }}
              initial={false}
              animate={{
                width: "100%",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {selectedEntry ? (
                <div className="flex flex-col h-full">
                  <div
                    className="flex items-center justify-between px-4 py-3 shrink-0"
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
                    initialMessage={`[System: The user has selected their journal entry to discuss. The entry content is already visible to them. Analyze the entry for patterns, potential commitments/tasks to track, and strategies worth capturing. Respond directly without repeating the entry back to them.]`}
                    onAddToEntry={handleAddToEntry}
                    onCreateEntry={handleCreateEntry}
                    onApplyStyleEdit={handleApplyStyleEdit}
                  />
                </div>
              ) : isStuckMode ? (
                <div className="flex flex-col h-full overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 shrink-0"
                    style={{ borderBottom: "1px solid var(--shadow-dark)" }}
                  >
                    <div>
                      <h3 className="font-medium" style={{ color: "var(--foreground)" }}>
                        Let's work through this
                      </h3>
                      <p className="text-xs" style={{ color: "var(--accent)" }}>
                        Tell me what's on your mind
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsStuckMode(false);
                        setShowChat(false);
                      }}
                      className="rounded-xl p-2 transition-shadow"
                      style={{ color: "var(--accent)" }}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <ChatInterface
                    key="stuck-mode"
                    initialMessage={`[System: The user clicked "I'm stuck!" - they want writing prompts and suggestions, NOT therapy or open-ended questions.

YOUR JOB: Give them 3-4 specific things they could write about RIGHT NOW. Be a writing prompt generator, not a counselor.

Based on their data, offer concrete suggestions like:
- "Update on [specific commitment they have]"
- "How [recent entry topic] is going now"
- "What happened with [something they mentioned]"
- "Progress on [pending task]"
- "Try [strategy that worked before] again?"

Format your response as a quick list of clickable-feeling options. Keep it SHORT and actionable. Don't ask "what's on your mind" - TELL them what they could write about based on what you know.

If they have no data yet, suggest starter prompts like: "What's one thing you're working on?", "What went well today?", "What's taking up mental space?"]`}
                    onCreateEntry={handleCreateEntry}
                  />
                </div>
              ) : (
                <div className="flex flex-col p-4 gap-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 flex-shrink-0" style={{ color: "var(--accent)" }} />
                    <p className="text-sm" style={{ color: "var(--accent)" }}>
                      Click an entry to chat
                    </p>
                  </div>
                  <motion.button
                    onClick={() => {
                      setIsStuckMode(true);
                      setSelectedEntry(null);
                      setShowChat(true);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-medium transition-all"
                    style={{
                      background: editorHasContent ? "var(--background)" : "var(--foreground)",
                      color: editorHasContent ? "var(--accent)" : "var(--background)",
                      boxShadow: "var(--neu-shadow-sm)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "var(--neu-shadow)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "var(--neu-shadow-sm)";
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.boxShadow = "var(--neu-shadow-inset-sm)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.boxShadow = "var(--neu-shadow)";
                    }}
                  >
                    <HelpCircle className="h-5 w-5" />
                    I'm stuck!
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile chat overlay - entry selected */}
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
                initialMessage={`[System: The user has selected their journal entry to discuss. The entry content is already visible to them. Analyze the entry for patterns, potential commitments/tasks to track, and strategies worth capturing. Respond directly without repeating the entry back to them.]`}
                onAddToEntry={handleAddToEntry}
                onCreateEntry={handleCreateEntry}
                onApplyStyleEdit={handleApplyStyleEdit}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile chat overlay - stuck mode */}
      <AnimatePresence>
        {showChat && isStuckMode && !selectedEntry && (
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
                    Let's work through this
                  </h3>
                  <p className="text-xs" style={{ color: "var(--accent)" }}>
                    Tell me what's on your mind
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsStuckMode(false);
                    setShowChat(false);
                  }}
                  className="rounded-xl p-2"
                  style={{ color: "var(--accent)" }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ChatInterface
                key="stuck-mode-mobile"
                initialMessage={`[System: The user clicked "I'm stuck!" - they want writing prompts and suggestions, NOT therapy or open-ended questions.

YOUR JOB: Give them 3-4 specific things they could write about RIGHT NOW. Be a writing prompt generator, not a counselor.

Based on their data, offer concrete suggestions like:
- "Update on [specific commitment they have]"
- "How [recent entry topic] is going now"
- "What happened with [something they mentioned]"
- "Progress on [pending task]"
- "Try [strategy that worked before] again?"

Format your response as a quick list of clickable-feeling options. Keep it SHORT and actionable. Don't ask "what's on your mind" - TELL them what they could write about based on what you know.

If they have no data yet, suggest starter prompts like: "What's one thing you're working on?", "What went well today?", "What's taking up mental space?"]`}
                onCreateEntry={handleCreateEntry}
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

      {/* Edit Entry Modal */}
      <Modal
        isOpen={!!editingEntry}
        onClose={() => {
          setEditingEntry(null);
          setEditContent("");
        }}
        title="Edit Entry"
        size="lg"
      >
        <div className="space-y-4">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Edit your journal entry..."
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setEditingEntry(null);
                setEditContent("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              isLoading={isEditing}
              disabled={!editContent.trim() || editContent === editingEntry?.content}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
