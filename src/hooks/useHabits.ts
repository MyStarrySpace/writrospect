"use client";

import { useState, useEffect, useCallback } from "react";
import { Habit, HabitStatus, MotivationType } from "@prisma/client";

interface UseHabitsReturn {
  habits: Habit[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  createHabit: (data: CreateHabitData) => Promise<Habit | null>;
  updateHabit: (id: string, data: UpdateHabitData) => Promise<Habit | null>;
  deleteHabit: (id: string) => Promise<boolean>;
  filterByStatus: (status: HabitStatus | null) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface CreateHabitData {
  what: string;
  why?: string;
  complexity?: number;
  motivationType?: MotivationType;
  dueDate?: string;
  sourceEntryId?: string;
}

interface UpdateHabitData {
  what?: string;
  why?: string;
  complexity?: number;
  motivationType?: MotivationType;
  status?: HabitStatus;
  outcome?: string;
  conditionsWhenCompleted?: string[];
  learned?: string;
  dueDate?: string;
}

export function useHabits(): UseHabitsReturn {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<HabitStatus | null>(null);
  const limit = 20;

  const fetchHabits = useCallback(
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
        const response = await fetch(`/api/habits?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch habits");
        }

        if (reset) {
          setHabits(data.habits);
          setOffset(data.habits.length);
        } else {
          setHabits((prev) => [...prev, ...data.habits]);
          setOffset((prev) => prev + data.habits.length);
        }

        setHasMore(data.hasMore);
        setTotal(data.total);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch habits"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [offset, statusFilter]
  );

  useEffect(() => {
    fetchHabits(true);
  }, [statusFilter]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchHabits(false);
  }, [hasMore, isLoading, fetchHabits]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchHabits(true);
  }, []);

  const filterByStatus = useCallback((status: HabitStatus | null) => {
    setStatusFilter(status);
    setOffset(0);
  }, []);

  const createHabit = useCallback(
    async (data: CreateHabitData): Promise<Habit | null> => {
      try {
        const response = await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create habit");
        }

        setHabits((prev) => [result.habit, ...prev]);
        setTotal((prev) => prev + 1);
        return result.habit;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create habit"
        );
        return null;
      }
    },
    []
  );

  const updateHabit = useCallback(
    async (
      id: string,
      data: UpdateHabitData
    ): Promise<Habit | null> => {
      try {
        const response = await fetch(`/api/habits/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update habit");
        }

        setHabits((prev) =>
          prev.map((h) => (h.id === id ? result.habit : h))
        );
        return result.habit;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update habit"
        );
        return null;
      }
    },
    []
  );

  const deleteHabit = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/habits/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete habit");
      }

      setHabits((prev) => prev.filter((h) => h.id !== id));
      setTotal((prev) => prev - 1);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete habit"
      );
      return false;
    }
  }, []);

  return {
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
    refresh,
  };
}
