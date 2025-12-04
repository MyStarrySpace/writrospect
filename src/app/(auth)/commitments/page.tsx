"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Filter } from "lucide-react";
import { CommitmentCard } from "@/components/commitments/CommitmentCard";
import { CommitmentForm, CommitmentFormData } from "@/components/commitments/CommitmentForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
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
    const commitment = await updateCommitment(id, { status });
    if (commitment) {
      addToast("success", `Commitment marked as ${status}`);
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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Commitments
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Track what you've committed to and learn from the outcomes.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
          New Commitment
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-2">
        <Filter className="h-4 w-4 text-zinc-500" />
        {statusFilters.map((filter) => (
          <button
            key={filter.value || "all"}
            onClick={() => handleFilterChange(filter.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeFilter === filter.value
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {filter.label}
          </button>
        ))}
        {total > 0 && (
          <span className="ml-auto text-sm text-zinc-500 dark:text-zinc-400">
            {total} total
          </span>
        )}
      </div>

      {/* Commitments list */}
      <div className="space-y-4">
        {isLoading && commitments.length === 0 ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : commitments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">
              {activeFilter
                ? `No ${activeFilter} commitments found.`
                : "No commitments yet. Create your first one!"}
            </p>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {commitments.map((commitment) => (
                <CommitmentCard
                  key={commitment.id}
                  commitment={commitment}
                  onStatusChange={handleStatusChange}
                  onEdit={setEditingCommitment}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>

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
