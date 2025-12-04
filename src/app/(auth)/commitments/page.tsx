"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Filter } from "lucide-react";
import { CommitmentListItem } from "@/components/commitments/CommitmentListItem";
import { CommitmentForm, CommitmentFormData } from "@/components/commitments/CommitmentForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkeletonList } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListContainer } from "@/components/ui/ListItem";
import { useCommitments } from "@/hooks/useCommitments";
import { useToast } from "@/components/ui/Toast";
import { Commitment, CommitmentStatus } from "@prisma/client";

const statusFilters: { value: CommitmentStatus | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "abandoned", label: "Abandoned" },
];

export default function CommitmentsPage() {
  const {
    commitments,
    isLoading,
    error,
    hasMore,
    total,
    createCommitment,
    updateCommitment,
    deleteCommitment,
    filterByStatus,
    loadMore,
  } = useCommitments();
  const { addToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CommitmentStatus | null>(null);

  const handleCreate = async (data: CommitmentFormData) => {
    setIsSubmitting(true);
    const commitment = await createCommitment({
      what: data.what,
      why: data.why,
      complexity: data.complexity,
      motivationType: data.motivationType,
      dueDate: data.dueDate,
    });
    setIsSubmitting(false);

    if (commitment) {
      addToast("success", "Commitment created");
      setShowForm(false);
    } else {
      addToast("error", "Failed to create commitment");
    }
  };

  const handleUpdate = async (data: CommitmentFormData) => {
    if (!editingCommitment) return;

    setIsSubmitting(true);
    const commitment = await updateCommitment(editingCommitment.id, {
      what: data.what,
      why: data.why,
      complexity: data.complexity,
      motivationType: data.motivationType,
      dueDate: data.dueDate,
      outcome: data.outcome,
      learned: data.learned,
    });
    setIsSubmitting(false);

    if (commitment) {
      addToast("success", "Commitment updated");
      setEditingCommitment(null);
    } else {
      addToast("error", "Failed to update commitment");
    }
  };

  const handleStatusChange = async (id: string, status: CommitmentStatus) => {
    // Find the current commitment to get its previous status for undo
    const currentCommitment = commitments.find(c => c.id === id);
    const previousStatus = currentCommitment?.status;

    const commitment = await updateCommitment(id, { status });
    if (commitment) {
      addToast("success", `Commitment marked as ${status}`, {
        duration: 6000,
        action: previousStatus ? {
          label: "Undo",
          onClick: async () => {
            const restored = await updateCommitment(id, { status: previousStatus });
            if (restored) {
              addToast("info", "Status change undone");
            }
          },
        } : undefined,
      });
    } else {
      addToast("error", "Failed to update commitment");
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteCommitment(id);
    if (success) {
      addToast("success", "Commitment deleted");
    } else {
      addToast("error", "Failed to delete commitment");
    }
  };

  const handleFilterChange = (status: CommitmentStatus | null) => {
    setActiveFilter(status);
    filterByStatus(status);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Commitments"
        description="Track what you've committed to and learn from the outcomes."
        action={
          <Button onClick={() => setShowForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
            New Commitment
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex items-center gap-2">
        <Filter className="h-4 w-4" style={{ color: "var(--accent)" }} />
        {statusFilters.map((filter) => (
          <button
            key={filter.value || "all"}
            onClick={() => handleFilterChange(filter.value)}
            className="rounded-full px-3 py-1 text-sm font-medium transition-all"
            style={{
              background: activeFilter === filter.value
                ? "var(--foreground)"
                : "var(--background)",
              color: activeFilter === filter.value
                ? "var(--background)"
                : "var(--accent)",
              boxShadow: activeFilter === filter.value
                ? "var(--neu-shadow-inset-sm)"
                : "var(--neu-shadow-subtle)",
            }}
          >
            {filter.label}
          </button>
        ))}
        {total > 0 && (
          <span className="ml-auto text-sm" style={{ color: "var(--accent)" }}>
            {total} total
          </span>
        )}
      </div>

      {/* Commitments list */}
      <div>
        {isLoading && commitments.length === 0 ? (
          <SkeletonList count={5} />
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : commitments.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: "var(--background)",
              boxShadow: "var(--neu-shadow-inset)",
            }}
          >
            <p style={{ color: "var(--accent)" }}>
              {activeFilter
                ? `No ${activeFilter} commitments found.`
                : "No commitments yet. Create your first one!"}
            </p>
          </div>
        ) : (
          <>
            <ListContainer>
              <AnimatePresence>
                {commitments.map((commitment, index) => (
                  <CommitmentListItem
                    key={commitment.id}
                    commitment={commitment}
                    onStatusChange={handleStatusChange}
                    onEdit={setEditingCommitment}
                    onDelete={handleDelete}
                    isLast={index === commitments.length - 1}
                  />
                ))}
              </AnimatePresence>
            </ListContainer>

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button variant="ghost" onClick={loadMore} isLoading={isLoading}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="New Commitment"
        size="lg"
      >
        <CommitmentForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingCommitment}
        onClose={() => setEditingCommitment(null)}
        title="Edit Commitment"
        size="lg"
      >
        {editingCommitment && (
          <CommitmentForm
            commitment={editingCommitment}
            onSubmit={handleUpdate}
            onCancel={() => setEditingCommitment(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>
    </div>
  );
}
