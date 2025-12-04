"use client";

import { useState, useEffect, useCallback } from "react";
import { Person, PersonSentiment, RelationshipType, Sentiment } from "@prisma/client";

interface PersonWithSentiment extends Person {
  sentimentHistory: PersonSentiment[];
}

interface UsePeopleReturn {
  people: PersonWithSentiment[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  createPerson: (
    name: string,
    relationship?: RelationshipType,
    notes?: string
  ) => Promise<PersonWithSentiment | null>;
  updatePerson: (
    id: string,
    data: Partial<Person>
  ) => Promise<PersonWithSentiment | null>;
  deletePerson: (id: string) => Promise<boolean>;
  addSentiment: (
    personId: string,
    sentiment: Sentiment,
    context?: string,
    entryId?: string
  ) => Promise<PersonSentiment | null>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  findByName: (name: string) => PersonWithSentiment | undefined;
}

export function usePeople(
  sortBy: "lastMentioned" | "mentionCount" | "name" = "lastMentioned"
): UsePeopleReturn {
  const [people, setPeople] = useState<PersonWithSentiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchPeople = useCallback(
    async (reset = false) => {
      setIsLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;

      try {
        const response = await fetch(
          `/api/people?limit=${limit}&offset=${currentOffset}&sortBy=${sortBy}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch people");
        }

        if (reset) {
          setPeople(data.people);
          setOffset(data.people.length);
        } else {
          setPeople((prev) => [...prev, ...data.people]);
          setOffset((prev) => prev + data.people.length);
        }

        setHasMore(data.hasMore);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch people");
      } finally {
        setIsLoading(false);
      }
    },
    [offset, sortBy]
  );

  useEffect(() => {
    fetchPeople(true);
  }, [sortBy]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchPeople(false);
  }, [hasMore, isLoading, fetchPeople]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchPeople(true);
  }, []);

  const createPerson = useCallback(
    async (
      name: string,
      relationship?: RelationshipType,
      notes?: string
    ): Promise<PersonWithSentiment | null> => {
      try {
        const response = await fetch("/api/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, relationship, notes }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create person");
        }

        setPeople((prev) => [data.person, ...prev]);
        setTotal((prev) => prev + 1);
        return data.person;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create person");
        return null;
      }
    },
    []
  );

  const updatePerson = useCallback(
    async (
      id: string,
      data: Partial<Person>
    ): Promise<PersonWithSentiment | null> => {
      try {
        const response = await fetch(`/api/people/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update person");
        }

        setPeople((prev) =>
          prev.map((p) => (p.id === id ? result.person : p))
        );
        return result.person;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update person");
        return null;
      }
    },
    []
  );

  const deletePerson = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/people/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete person");
      }

      setPeople((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => prev - 1);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete person");
      return false;
    }
  }, []);

  const addSentiment = useCallback(
    async (
      personId: string,
      sentiment: Sentiment,
      context?: string,
      entryId?: string
    ): Promise<PersonSentiment | null> => {
      try {
        const response = await fetch(`/api/people/${personId}/sentiment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sentiment, context, entryId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to add sentiment");
        }

        // Update local state with new sentiment
        setPeople((prev) =>
          prev.map((p) =>
            p.id === personId
              ? {
                  ...p,
                  lastMentioned: new Date(),
                  mentionCount: p.mentionCount + 1,
                  sentimentHistory: [data.sentimentEntry, ...p.sentimentHistory],
                }
              : p
          )
        );

        return data.sentimentEntry;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add sentiment");
        return null;
      }
    },
    []
  );

  const findByName = useCallback(
    (name: string): PersonWithSentiment | undefined => {
      return people.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
    },
    [people]
  );

  return {
    people,
    isLoading,
    error,
    hasMore,
    total,
    createPerson,
    updatePerson,
    deletePerson,
    addSentiment,
    loadMore,
    refresh,
    findByName,
  };
}
