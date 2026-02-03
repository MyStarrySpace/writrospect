"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Filter } from "lucide-react";
import { GoalListItem, Goal } from "@/components/goals/GoalListItem";
import { GoalForm, GoalFormData } from "@/components/goals/GoalForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkeletonList } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListContainer } from "@/components/ui/ListItem";
import { ChangesSummary, itemMatchesFilter } from "@/components/ui/ChangesSummary";
import { useGoals } from "@/hooks/useGoals";
import { useToast } from "@/components/ui/Toast";
import {
  markAsViewed,
  getLastViewed,
} from "@/lib/utils/last-viewed";

type GoalStatus = "active" | "completed" | "paused" | "abandoned";

const statusFilters: { value: GoalStatus | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "abandoned", label: "Abandoned" },
];

export default function GoalsPage() {
  const {
    goals,
    isLoading,
    error,
    hasMore,
    total,
    createGoal,
    updateGoal,
    deleteGoal,
    filterByStatus,
    loadMore,
  } = useGoals();
  const { addToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<GoalStatus | null>(null);
  const [showSummary, setShowSummary] = useState(true);
  const [highlightFilter, setHighlightFilter] = useState<string | null>(null);
  const [lastViewedAt] = useState(() => getLastViewed("goals"));

  // Helper to check if item is new using cached lastViewedAt
  const isItemNew = useCallback((createdAt: Date | string) => {
    if (!lastViewedAt) return true; // First visit, everything is new
    return new Date(createdAt) > lastViewedAt;
  }, [lastViewedAt]);

  // Sort goals: completed/abandoned at bottom, new items first
  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      // Completed/abandoned items go to the bottom
      const aCompleted = a.status === "completed" || a.status === "abandoned";
      const bCompleted = b.status === "completed" || b.status === "abandoned";

      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      // Within non-completed items, new items come first
      if (!aCompleted && !bCompleted && lastViewedAt) {
        const aIsNew = isItemNew(a.createdAt);
        const bIsNew = isItemNew(b.createdAt);

        if (aIsNew && !bIsNew) return -1;
        if (!aIsNew && bIsNew) return 1;
      }

      return 0;
    });
  }, [goals, lastViewedAt, isItemNew]);

  // Mark as viewed when component unmounts or after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      markAsViewed("goals");
    }, 2000);

    return () => {
      clearTimeout(timer);
      markAsViewed("goals");
    };
  }, []);

  const handleCreate = async (data: GoalFormData) => {
    setIsSubmitting(true);
    const goal = await createGoal({
      title: data.title,
      description: data.description,
      why: data.why,
    });
    setIsSubmitting(false);

    if (goal) {
      addToast("success", "Goal created");
      setShowForm(false);
    } else {
      addToast("error", "Failed to create goal");
    }
  };

  const handleUpdate = async (data: GoalFormData) => {
    if (!editingGoal) return;

    setIsSubmitting(true);
    const goal = await updateGoal(editingGoal.id, {
      title: data.title,
      description: data.description,
      why: data.why,
      progress: data.progress,
      outcome: data.outcome,
      learned: data.learned,
    });
    setIsSubmitting(false);

    if (goal) {
      addToast("success", "Goal updated");
      setEditingGoal(null);
    } else {
      addToast("error", "Failed to update goal");
    }
  };

  const handleStatusChange = async (id: string, status: GoalStatus) => {
    // Find the current goal to get its previous status for undo
    const currentGoal = goals.find((g) => g.id === id);
    const previousStatus = currentGoal?.status;

    const goal = await updateGoal(id, { status });
    if (goal) {
      addToast("success", `Goal marked as ${status}`, {
        duration: 6000,
        action: previousStatus
          ? {
              label: "Undo",
              onClick: async () => {
                const restored = await updateGoal(id, { status: previousStatus });
                if (restored) {
                  addToast("info", "Status change undone");
                }
              },
            }
          : undefined,
      });
    } else {
      addToast("error", "Failed to update goal");
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteGoal(id);
    if (success) {
      addToast("success", "Goal deleted");
    } else {
      addToast("error", "Failed to delete goal");
    }
  };

  const handleFilterChange = (status: GoalStatus | null) => {
    setActiveFilter(status);
    filterByStatus(status);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Goals"
        description="Define your high-level aspirations. Link strategies and tasks to see how they contribute."
        action={
          <Button onClick={() => setShowForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
            New Goal
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
              background:
                activeFilter === filter.value
                  ? "var(--foreground)"
                  : "var(--background)",
              color:
                activeFilter === filter.value
                  ? "var(--background)"
                  : "var(--accent)",
              boxShadow:
                activeFilter === filter.value
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

      {/* Changes Summary Dashboard */}
      {showSummary && goals.length > 0 && (
        <ChangesSummary
          items={goals}
          section="goals"
          onDismiss={() => setShowSummary(false)}
          onHighlight={setHighlightFilter}
          activeHighlight={highlightFilter}
        />
      )}

      {/* Goals list */}
      <div>
        {isLoading && goals.length === 0 ? (
          <SkeletonList count={5} />
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : goals.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: "var(--background)",
              boxShadow: "var(--neu-shadow-inset)",
            }}
          >
            <p style={{ color: "var(--accent)" }}>
              {activeFilter
                ? `No ${activeFilter} goals found.`
                : "No goals yet. Create your first one!"}
            </p>
          </div>
        ) : (
          <>
            <ListContainer>
              {sortedGoals.map((goal, index) => (
                <GoalListItem
                  key={goal.id}
                  goal={goal}
                  onStatusChange={handleStatusChange}
                  onEdit={setEditingGoal}
                  onDelete={handleDelete}
                  isLast={index === sortedGoals.length - 1}
                  isNew={isItemNew(goal.createdAt)}
                  isHighlighted={itemMatchesFilter(goal, highlightFilter)}
                />
              ))}
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
        title="New Goal"
        size="lg"
      >
        <GoalForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        title="Edit Goal"
        size="lg"
      >
        {editingGoal && (
          <GoalForm
            goal={editingGoal}
            onSubmit={handleUpdate}
            onCancel={() => setEditingGoal(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>
    </div>
  );
}
