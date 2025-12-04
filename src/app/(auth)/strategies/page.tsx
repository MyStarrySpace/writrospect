"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Strategy } from "@prisma/client";

const complexityOptions = [
  { value: "1", label: "1 - Simple" },
  { value: "2", label: "2 - Easy" },
  { value: "3", label: "3 - Moderate" },
  { value: "4", label: "4 - Complex" },
  { value: "5", label: "5 - Very Complex" },
];

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    strategy: "",
    context: "",
    complexity: 3,
    notes: "",
  });

  const fetchStrategies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/strategies");
      const data = await response.json();
      if (response.ok) {
        setStrategies(data.strategies);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch strategies");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStrategies((prev) => [data.strategy, ...prev]);
        setShowForm(false);
        setFormData({ strategy: "", context: "", complexity: 3, notes: "" });
        addToast("success", "Strategy created");
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      addToast("error", "Failed to create strategy");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEffectivenessUpdate = async (id: string, worked: boolean | null) => {
    try {
      const response = await fetch(`/api/strategies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worked }),
      });

      const data = await response.json();

      if (response.ok) {
        setStrategies((prev) =>
          prev.map((s) => (s.id === id ? data.strategy : s))
        );
        addToast("success", "Strategy updated");
      }
    } catch {
      addToast("error", "Failed to update strategy");
    }
  };

  const workingStrategies = strategies.filter((s) => s.worked === true);
  const notWorkingStrategies = strategies.filter((s) => s.worked === false);
  const untestedStrategies = strategies.filter((s) => s.worked === null);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Strategies
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Track what approaches work for you and which ones don't.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
          New Strategy
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : strategies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              No strategies yet. Start tracking what works for you!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Working Strategies */}
          {workingStrategies.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-green-700 dark:text-green-400">
                <ThumbsUp className="h-5 w-5" />
                What Works ({workingStrategies.length})
              </h2>
              <div className="space-y-3">
                {workingStrategies.map((strategy) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    onEffectivenessChange={handleEffectivenessUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Not Working Strategies */}
          {notWorkingStrategies.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-700 dark:text-red-400">
                <ThumbsDown className="h-5 w-5" />
                What Doesn't Work ({notWorkingStrategies.length})
              </h2>
              <div className="space-y-3">
                {notWorkingStrategies.map((strategy) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    onEffectivenessChange={handleEffectivenessUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Untested Strategies */}
          {untestedStrategies.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                <HelpCircle className="h-5 w-5" />
                Untested ({untestedStrategies.length})
              </h2>
              <div className="space-y-3">
                {untestedStrategies.map((strategy) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    onEffectivenessChange={handleEffectivenessUpdate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="New Strategy"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Textarea
            label="Strategy"
            value={formData.strategy}
            onChange={(e) =>
              setFormData({ ...formData, strategy: e.target.value })
            }
            placeholder="Describe the approach or technique..."
            required
          />

          <Textarea
            label="Context"
            value={formData.context}
            onChange={(e) =>
              setFormData({ ...formData, context: e.target.value })
            }
            placeholder="When/where does this strategy apply?"
            required
          />

          <Select
            label="Complexity"
            value={formData.complexity.toString()}
            onChange={(e) =>
              setFormData({ ...formData, complexity: parseInt(e.target.value) })
            }
            options={complexityOptions}
          />

          <Textarea
            label="Notes (optional)"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Any observations or additional context..."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Strategy
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StrategyCard({
  strategy,
  onEffectivenessChange,
}: {
  strategy: Strategy;
  onEffectivenessChange: (id: string, worked: boolean | null) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
            {strategy.strategy}
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Context: {strategy.context}
          </p>
        </div>
      </div>

      {strategy.notes && (
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
          {strategy.notes}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="default">Complexity: {strategy.complexity}/5</Badge>
          <Badge variant="default">Tried {strategy.timesTried}x</Badge>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              onEffectivenessChange(
                strategy.id,
                strategy.worked === true ? null : true
              )
            }
            className={`rounded-lg p-2 transition-colors ${
              strategy.worked === true
                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                : "text-zinc-400 hover:bg-zinc-100 hover:text-green-600 dark:hover:bg-zinc-800"
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              onEffectivenessChange(
                strategy.id,
                strategy.worked === false ? null : false
              )
            }
            className={`rounded-lg p-2 transition-colors ${
              strategy.worked === false
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
            }`}
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
