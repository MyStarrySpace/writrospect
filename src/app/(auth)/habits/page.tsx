"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Filter } from "lucide-react";
import { HabitListItem } from "@/components/habits/HabitListItem";
import { HabitForm, HabitFormData } from "@/components/habits/HabitForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkeletonList } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListContainer } from "@/components/ui/ListItem";
import { ChangesSummary, itemMatchesFilter } from "@/components/ui/ChangesSummary";
import { useHabits } from "@/hooks/useHabits";
import { useToast } from "@/components/ui/Toast";
import { Habit, HabitStatus } from "@prisma/client";
import {
  markAsViewed,
  getLastViewed,
} from "@/lib/utils/last-viewed";

const statusFilters: { value: HabitStatus | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "abandoned", label: "Abandoned" },
];

export default function HabitsPage() {
  const {
    habits,
    isLoading,
    error,
    hasMore,
    total,
    createHabit,
    updateHabit,
    deleteHabit,
    filterByStatus,
    loadMore,
  } = useHabits();
  const { addToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<HabitStatus | null>(null);
  const [showSummary, setShowSummary] = useState(true);
  const [filterBy, setFilterBy] = useState<string | null>(null);
  const [hoverHighlight, setHoverHighlight] = useState<string | null>(null);
  const [lastViewedAt] = useState(() => getLastViewed("habits"));

  // Helper to check if item is new using cached lastViewedAt
  const isItemNew = useCallback((createdAt: Date | string) => {
    if (!lastViewedAt) return true; // First visit, everything is new
    return new Date(createdAt) > lastViewedAt;
  }, [lastViewedAt]);

  // Sort habits: completed/abandoned at bottom, new items first
  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => {
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
  }, [habits, lastViewedAt, isItemNew]);

  // Mark as viewed when component unmounts or after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      markAsViewed("habits");
    }, 2000);

    return () => {
      clearTimeout(timer);
      markAsViewed("habits");
    };
  }, []);

  const handleCreate = async (data: HabitFormData) => {
    setIsSubmitting(true);
    const habit = await createHabit({
      what: data.what,
      why: data.why,
      complexity: data.complexity,
      motivationType: data.motivationType,
      dueDate: data.dueDate,
    });
    setIsSubmitting(false);

    if (habit) {
      addToast("success", "Habit created");
      setShowForm(false);
    } else {
      addToast("error", "Failed to create habit");
    }
  };

  const handleUpdate = async (data: HabitFormData) => {
    if (!editingHabit) return;

    setIsSubmitting(true);
    const habit = await updateHabit(editingHabit.id, {
      what: data.what,
      why: data.why,
      complexity: data.complexity,
      motivationType: data.motivationType,
      dueDate: data.dueDate,
      outcome: data.outcome,
      learned: data.learned,
    });
    setIsSubmitting(false);

    if (habit) {
      addToast("success", "Habit updated");
      setEditingHabit(null);
    } else {
      addToast("error", "Failed to update habit");
    }
  };

  const handleStatusChange = async (id: string, status: HabitStatus) => {
    // Find the current habit to get its previous status for undo
    const currentHabit = habits.find(h => h.id === id);
    const previousStatus = currentHabit?.status;

    const habit = await updateHabit(id, { status });
    if (habit) {
      addToast("success", `Habit marked as ${status}`, {
        duration: 6000,
        action: previousStatus ? {
          label: "Undo",
          onClick: async () => {
            const restored = await updateHabit(id, { status: previousStatus });
            if (restored) {
              addToast("info", "Status change undone");
            }
          },
        } : undefined,
      });
    } else {
      addToast("error", "Failed to update habit");
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteHabit(id);
    if (success) {
      addToast("success", "Habit deleted");
    } else {
      addToast("error", "Failed to delete habit");
    }
  };

  const handleFilterChange = (status: HabitStatus | null) => {
    setActiveFilter(status);
    filterByStatus(status);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Habits"
        description="Track your recurring behaviors and build lasting routines."
        action={
          <Button onClick={() => setShowForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
            <span className="hidden sm:inline">New Habit</span>
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

      {/* Changes Summary Dashboard */}
      {showSummary && habits.length > 0 && (
        <ChangesSummary
          items={habits}
          section="habits"
          onDismiss={() => setShowSummary(false)}
          onFilter={setFilterBy}
          onHover={setHoverHighlight}
          activeFilter={filterBy}
        />
      )}

      {/* Habits list */}
      <div>
        {isLoading && habits.length === 0 ? (
          <SkeletonList count={5} />
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : habits.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: "var(--background)",
              boxShadow: "var(--neu-shadow-inset)",
            }}
          >
            <p style={{ color: "var(--accent)" }}>
              {activeFilter
                ? `No ${activeFilter} habits found.`
                : "No habits yet. Create your first one!"}
            </p>
          </div>
        ) : (
          <>
            <ListContainer>
              {sortedHabits
                .filter((habit) => !filterBy || itemMatchesFilter(habit, filterBy))
                .map((habit, index, filtered) => (
                <HabitListItem
                  key={habit.id}
                  habit={habit}
                  onStatusChange={handleStatusChange}
                  onEdit={setEditingHabit}
                  onDelete={handleDelete}
                  isLast={index === filtered.length - 1}
                  isNew={isItemNew(habit.createdAt)}
                  isHighlighted={!filterBy && itemMatchesFilter(habit, hoverHighlight)}
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
        title="New Habit"
        size="lg"
      >
        <HabitForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        title="Edit Habit"
        size="lg"
      >
        {editingHabit && (
          <HabitForm
            habit={editingHabit}
            onSubmit={handleUpdate}
            onCancel={() => setEditingHabit(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>
    </div>
  );
}
