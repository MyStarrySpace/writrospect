"use client";

import { useState, useEffect, useCallback } from "react";

// Define types locally since Prisma types might not be generated yet
type GoalStatus = "active" | "completed" | "paused" | "abandoned";

interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  why: string | null;
  obstacle: string | null;
  status: GoalStatus;
  progress: number;
  outcome: string | null;
  learned: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    strategies: number;
    tasks: number;
  };
}

interface UseGoalsReturn {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  createGoal: (data: CreateGoalData) => Promise<Goal | null>;
  updateGoal: (id: string, data: UpdateGoalData) => Promise<Goal | null>;
  deleteGoal: (id: string) => Promise<boolean>;
  filterByStatus: (status: GoalStatus | null) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface CreateGoalData {
  title: string;
  description?: string;
  why?: string;
  obstacle?: string;
}

interface UpdateGoalData {
  title?: string;
  description?: string;
  why?: string;
  obstacle?: string;
  status?: GoalStatus;
  progress?: number;
  outcome?: string;
  learned?: string;
}

export function useGoals(): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<GoalStatus | null>(null);
  const limit = 20;

  const fetchGoals = useCallback(
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
        const response = await fetch(`/api/goals?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch goals");
        }

        if (reset) {
          setGoals(data.goals);
          setOffset(data.goals.length);
        } else {
          setGoals((prev) => [...prev, ...data.goals]);
          setOffset((prev) => prev + data.goals.length);
        }

        setHasMore(data.hasMore);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch goals");
      } finally {
        setIsLoading(false);
      }
    },
    [offset, statusFilter]
  );

  useEffect(() => {
    fetchGoals(true);
  }, [statusFilter]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchGoals(false);
  }, [hasMore, isLoading, fetchGoals]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchGoals(true);
  }, []);

  const filterByStatus = useCallback((status: GoalStatus | null) => {
    setStatusFilter(status);
    setOffset(0);
  }, []);

  const createGoal = useCallback(
    async (data: CreateGoalData): Promise<Goal | null> => {
      try {
        const response = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create goal");
        }

        setGoals((prev) => [result.goal, ...prev]);
        setTotal((prev) => prev + 1);
        return result.goal;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create goal");
        return null;
      }
    },
    []
  );

  const updateGoal = useCallback(
    async (id: string, data: UpdateGoalData): Promise<Goal | null> => {
      try {
        const response = await fetch(`/api/goals/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update goal");
        }

        setGoals((prev) => prev.map((g) => (g.id === id ? result.goal : g)));
        return result.goal;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update goal");
        return null;
      }
    },
    []
  );

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete goal");
      }

      setGoals((prev) => prev.filter((g) => g.id !== id));
      setTotal((prev) => prev - 1);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete goal");
      return false;
    }
  }, []);

  return {
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
    refresh,
  };
}
