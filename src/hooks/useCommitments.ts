"use client";

import { useState, useEffect, useCallback } from "react";
import { Commitment, CommitmentStatus, MotivationType } from "@prisma/client";

interface UseCommitmentsReturn {
  commitments: Commitment[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  createCommitment: (data: CreateCommitmentData) => Promise<Commitment | null>;
  updateCommitment: (id: string, data: UpdateCommitmentData) => Promise<Commitment | null>;
  deleteCommitment: (id: string) => Promise<boolean>;
  filterByStatus: (status: CommitmentStatus | null) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface CreateCommitmentData {
  what: string;
  why?: string;
  complexity?: number;
  motivationType?: MotivationType;
  dueDate?: string;
  sourceEntryId?: string;
}

interface UpdateCommitmentData {
  what?: string;
  why?: string;
  complexity?: number;
  motivationType?: MotivationType;
  status?: CommitmentStatus;
  outcome?: string;
  conditionsWhenCompleted?: string[];
  learned?: string;
  dueDate?: string;
}

export function useCommitments(): UseCommitmentsReturn {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<CommitmentStatus | null>(null);
  const limit = 20;

  const fetchCommitments = useCallback(
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
        const response = await fetch(`/api/commitments?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch commitments");
        }

        if (reset) {
          setCommitments(data.commitments);
          setOffset(data.commitments.length);
        } else {
          setCommitments((prev) => [...prev, ...data.commitments]);
          setOffset((prev) => prev + data.commitments.length);
        }

        setHasMore(data.hasMore);
        setTotal(data.total);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch commitments"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [offset, statusFilter]
  );

  useEffect(() => {
    fetchCommitments(true);
  }, [statusFilter]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchCommitments(false);
  }, [hasMore, isLoading, fetchCommitments]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchCommitments(true);
  }, []);

  const filterByStatus = useCallback((status: CommitmentStatus | null) => {
    setStatusFilter(status);
    setOffset(0);
  }, []);

  const createCommitment = useCallback(
    async (data: CreateCommitmentData): Promise<Commitment | null> => {
      try {
        const response = await fetch("/api/commitments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create commitment");
        }

        setCommitments((prev) => [result.commitment, ...prev]);
        setTotal((prev) => prev + 1);
        return result.commitment;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create commitment"
        );
        return null;
      }
    },
    []
  );

  const updateCommitment = useCallback(
    async (
      id: string,
      data: UpdateCommitmentData
    ): Promise<Commitment | null> => {
      try {
        const response = await fetch(`/api/commitments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update commitment");
        }

        setCommitments((prev) =>
          prev.map((c) => (c.id === id ? result.commitment : c))
        );
        return result.commitment;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update commitment"
        );
        return null;
      }
    },
    []
  );

  const deleteCommitment = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/commitments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete commitment");
      }

      setCommitments((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => prev - 1);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete commitment"
      );
      return false;
    }
  }, []);

  return {
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
    refresh,
  };
}
