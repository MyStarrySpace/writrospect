"use client";

import { useState, useEffect, useCallback } from "react";
import { JournalEntry } from "@prisma/client";

interface UseEntriesReturn {
  entries: JournalEntry[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  createEntry: (content: string, conditionsPresent?: string[], specificDateTime?: string) => Promise<JournalEntry | null>;
  updateEntry: (id: string, data: Partial<JournalEntry>) => Promise<JournalEntry | null>;
  deleteEntry: (id: string) => Promise<boolean>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useEntries(): UseEntriesReturn {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchEntries = useCallback(async (reset = false) => {
    setIsLoading(true);
    setError(null);

    const currentOffset = reset ? 0 : offset;

    try {
      const response = await fetch(
        `/api/entries?limit=${limit}&offset=${currentOffset}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch entries");
      }

      if (reset) {
        setEntries(data.entries);
        setOffset(data.entries.length);
      } else {
        setEntries((prev) => [...prev, ...data.entries]);
        setOffset((prev) => prev + data.entries.length);
      }

      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch entries");
    } finally {
      setIsLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    fetchEntries(true);
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchEntries(false);
  }, [hasMore, isLoading, fetchEntries]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchEntries(true);
  }, []);

  const createEntry = useCallback(
    async (
      content: string,
      conditionsPresent?: string[],
      specificDateTime?: string
    ): Promise<JournalEntry | null> => {
      try {
        const response = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, conditionsPresent, specificDateTime }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create entry");
        }

        setEntries((prev) => [data.entry, ...prev]);
        setTotal((prev) => prev + 1);
        return data.entry;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create entry");
        return null;
      }
    },
    []
  );

  const updateEntry = useCallback(
    async (
      id: string,
      data: Partial<JournalEntry>
    ): Promise<JournalEntry | null> => {
      try {
        const response = await fetch(`/api/entries/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update entry");
        }

        setEntries((prev) =>
          prev.map((e) => (e.id === id ? result.entry : e))
        );
        return result.entry;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update entry");
        return null;
      }
    },
    []
  );

  const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete entry");
      }

      setEntries((prev) => prev.filter((e) => e.id !== id));
      setTotal((prev) => prev - 1);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
      return false;
    }
  }, []);

  return {
    entries,
    isLoading,
    error,
    hasMore,
    total,
    createEntry,
    updateEntry,
    deleteEntry,
    loadMore,
    refresh,
  };
}
