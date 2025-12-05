"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Filter } from "lucide-react";
import { TaskListItem } from "@/components/tasks/TaskListItem";
import { TaskForm, TaskFormData } from "@/components/tasks/TaskForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkeletonList } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListContainer } from "@/components/ui/ListItem";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/components/ui/Toast";
import { Task, TaskStatus } from "@prisma/client";

const statusFilters: { value: TaskStatus | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "skipped", label: "Skipped" },
  { value: "deferred", label: "Deferred" },
];

export default function TasksPage() {
  const {
    tasks,
    isLoading,
    error,
    hasMore,
    total,
    createTask,
    updateTask,
    deleteTask,
    filterByStatus,
    loadMore,
  } = useTasks();
  const { addToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TaskStatus | null>(null);

  const handleCreate = async (data: TaskFormData) => {
    setIsSubmitting(true);
    const task = await createTask({
      what: data.what,
      context: data.context,
      urgency: data.urgency,
      dueDate: data.dueDate,
      dueTime: data.dueTime,
    });
    setIsSubmitting(false);

    if (task) {
      addToast("success", "Task created");
      setShowForm(false);
    } else {
      addToast("error", "Failed to create task");
    }
  };

  const handleUpdate = async (data: TaskFormData) => {
    if (!editingTask) return;

    setIsSubmitting(true);
    const task = await updateTask(editingTask.id, {
      what: data.what,
      context: data.context,
      urgency: data.urgency,
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      outcome: data.outcome,
      skippedReason: data.skippedReason,
    });
    setIsSubmitting(false);

    if (task) {
      addToast("success", "Task updated");
      setEditingTask(null);
    } else {
      addToast("error", "Failed to update task");
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    // Find the current task to get its previous status for undo
    const currentTask = tasks.find(t => t.id === id);
    const previousStatus = currentTask?.status;

    const task = await updateTask(id, { status });
    if (task) {
      addToast("success", `Task marked as ${status}`, {
        duration: 6000,
        action: previousStatus ? {
          label: "Undo",
          onClick: async () => {
            const restored = await updateTask(id, { status: previousStatus });
            if (restored) {
              addToast("info", "Status change undone");
            }
          },
        } : undefined,
      });
    } else {
      addToast("error", "Failed to update task");
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteTask(id);
    if (success) {
      addToast("success", "Task deleted");
    } else {
      addToast("error", "Failed to delete task");
    }
  };

  const handleFilterChange = (status: TaskStatus | null) => {
    setActiveFilter(status);
    filterByStatus(status);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Tasks"
        description="Track specific actions and to-dos with deadlines and urgency."
        action={
          <Button onClick={() => setShowForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
            New Task
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

      {/* Tasks list */}
      <div>
        {isLoading && tasks.length === 0 ? (
          <SkeletonList count={5} />
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : tasks.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: "var(--background)",
              boxShadow: "var(--neu-shadow-inset)",
            }}
          >
            <p style={{ color: "var(--accent)" }}>
              {activeFilter
                ? `No ${activeFilter} tasks found.`
                : "No tasks yet. Create your first one!"}
            </p>
          </div>
        ) : (
          <>
            <ListContainer>
              <AnimatePresence>
                {tasks.map((task, index) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onEdit={setEditingTask}
                    onDelete={handleDelete}
                    isLast={index === tasks.length - 1}
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
        title="New Task"
        size="lg"
      >
        <TaskForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Edit Task"
        size="lg"
      >
        {editingTask && (
          <TaskForm
            task={editingTask}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTask(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>
    </div>
  );
}
