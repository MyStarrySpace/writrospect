"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, TaskStatus, TaskUrgency } from "@prisma/client";

interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  createTask: (data: CreateTaskData) => Promise<Task | null>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  filterByStatus: (status: TaskStatus | null) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface CreateTaskData {
  what: string;
  context?: string;
  urgency?: TaskUrgency;
  dueDate?: string;
  dueTime?: string;
  relatedCommitmentId?: string;
  relatedPersonId?: string;
  sourceEntryId?: string;
}

interface UpdateTaskData {
  what?: string;
  context?: string;
  status?: TaskStatus;
  urgency?: TaskUrgency;
  dueDate?: string;
  dueTime?: string;
  outcome?: string;
  skippedReason?: string;
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);
  const limit = 20;

  const fetchTasks = useCallback(
    async (reset = false) => {
      setIsLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
      });

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      try {
        const response = await fetch(`/api/tasks?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch tasks");
        }

        if (reset) {
          setTasks(data.tasks);
          setOffset(data.tasks.length);
        } else {
          setTasks((prev) => [...prev, ...data.tasks]);
          setOffset((prev) => prev + data.tasks.length);
        }

        setHasMore(data.hasMore);
        setTotal(data.total);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch tasks"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [offset, statusFilter]
  );

  useEffect(() => {
    fetchTasks(true);
  }, [statusFilter]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchTasks(false);
  }, [hasMore, isLoading, fetchTasks]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchTasks(true);
  }, []);

  const filterByStatus = useCallback((status: TaskStatus | null) => {
    setStatusFilter(status);
    setOffset(0);
  }, []);

  const createTask = useCallback(
    async (data: CreateTaskData): Promise<Task | null> => {
      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create task");
        }

        setTasks((prev) => [result.task, ...prev]);
        setTotal((prev) => prev + 1);
        return result.task;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create task"
        );
        return null;
      }
    },
    []
  );

  const updateTask = useCallback(
    async (
      id: string,
      data: UpdateTaskData
    ): Promise<Task | null> => {
      try {
        const response = await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update task");
        }

        setTasks((prev) =>
          prev.map((t) => (t.id === id ? result.task : t))
        );
        return result.task;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update task"
        );
        return null;
      }
    },
    []
  );

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete task");
      }

      setTasks((prev) => prev.filter((t) => t.id !== id));
      setTotal((prev) => prev - 1);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete task"
      );
      return false;
    }
  }, []);

  return {
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
    refresh,
  };
}
