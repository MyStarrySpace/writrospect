"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, ThumbsUp, ThumbsDown, HelpCircle, Flag, Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

interface StrategyGoal {
  id: string;
  title: string;
  status: string;
}

interface StrategyWithGoal {
  id: string;
  strategy: string;
  context: string;
  complexity: number;
  worked: boolean | null;
  notes: string | null;
  timesTried: number;
  lastTried: Date;
  goalId: string | null;
  goal: StrategyGoal | null;
  createdAt: Date;
  updatedAt: Date;
}

interface GoalOption {
  id: string;
  title: string;
}

const complexityOptions = [
  { value: "1", label: "1 - Simple" },
  { value: "2", label: "2 - Easy" },
  { value: "3", label: "3 - Moderate" },
  { value: "4", label: "4 - Complex" },
  { value: "5", label: "5 - Very Complex" },
];

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<StrategyWithGoal[]>([]);
  const [goals, setGoals] = useState<GoalOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingStrategy, setLinkingStrategy] = useState<StrategyWithGoal | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    strategy: "",
    context: "",
    complexity: 3,
    notes: "",
    goalId: "",
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

  const fetchGoals = useCallback(async () => {
    try {
      const response = await fetch("/api/goals?status=active");
      const data = await response.json();
      if (response.ok) {
        setGoals(data.goals.map((g: { id: string; title: string }) => ({
          id: g.id,
          title: g.title,
        })));
      }
    } catch (err) {
      console.error("Failed to fetch goals:", err);
    }
  }, []);

  useEffect(() => {
    fetchStrategies();
    fetchGoals();
  }, [fetchStrategies, fetchGoals]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          goalId: formData.goalId || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStrategies((prev) => [data.strategy, ...prev]);
        setShowForm(false);
        setFormData({ strategy: "", context: "", complexity: 3, notes: "", goalId: "" });
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

  const handleLinkToGoal = async () => {
    if (!linkingStrategy) return;

    try {
      const response = await fetch(`/api/strategies/${linkingStrategy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: selectedGoalId || null }),
      });

      const data = await response.json();

      if (response.ok) {
        setStrategies((prev) =>
          prev.map((s) => (s.id === linkingStrategy.id ? data.strategy : s))
        );
        setShowLinkModal(false);
        setLinkingStrategy(null);
        setSelectedGoalId("");
        addToast("success", selectedGoalId ? "Strategy linked to goal" : "Strategy unlinked from goal");
      }
    } catch {
      addToast("error", "Failed to link strategy");
    }
  };

  const openLinkModal = (strategy: StrategyWithGoal) => {
    setLinkingStrategy(strategy);
    setSelectedGoalId(strategy.goalId || "");
    setShowLinkModal(true);
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
      <PageHeader
        title="Strategies"
        description="Track what approaches work for you and which ones don't."
        action={
          <Button onClick={() => setShowForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
            New Strategy
          </Button>
        }
      />

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
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "var(--background)",
            boxShadow: "var(--neu-shadow-inset)",
          }}
        >
          <p style={{ color: "var(--accent)" }}>
            No strategies yet. Start tracking what works for you!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Working Strategies */}
          {workingStrategies.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold" style={{ color: "#2d6a4f" }}>
                <ThumbsUp className="h-5 w-5" />
                What Works ({workingStrategies.length})
              </h2>
              <div className="space-y-3">
                {workingStrategies.map((strategy) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    onEffectivenessChange={handleEffectivenessUpdate}
                    onLinkToGoal={openLinkModal}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Not Working Strategies */}
          {notWorkingStrategies.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold" style={{ color: "#9b2c3d" }}>
                <ThumbsDown className="h-5 w-5" />
                What Doesn't Work ({notWorkingStrategies.length})
              </h2>
              <div className="space-y-3">
                {notWorkingStrategies.map((strategy) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    onEffectivenessChange={handleEffectivenessUpdate}
                    onLinkToGoal={openLinkModal}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Untested Strategies */}
          {untestedStrategies.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                <HelpCircle className="h-5 w-5" />
                Untested ({untestedStrategies.length})
              </h2>
              <div className="space-y-3">
                {untestedStrategies.map((strategy) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    onEffectivenessChange={handleEffectivenessUpdate}
                    onLinkToGoal={openLinkModal}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Complexity"
              value={formData.complexity.toString()}
              onChange={(e) =>
                setFormData({ ...formData, complexity: parseInt(e.target.value) })
              }
              options={complexityOptions}
            />

            <Select
              label="Link to Goal (optional)"
              value={formData.goalId}
              onChange={(e) =>
                setFormData({ ...formData, goalId: e.target.value })
              }
              options={[
                { value: "", label: "No goal selected" },
                ...goals.map((g) => ({ value: g.id, label: g.title })),
              ]}
            />
          </div>

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

      {/* Link to Goal Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setLinkingStrategy(null);
          setSelectedGoalId("");
        }}
        title="Link Strategy to Goal"
        size="md"
      >
        <div className="space-y-4">
          {linkingStrategy && (
            <div
              className="rounded-xl p-3"
              style={{
                background: "var(--shadow-light)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {linkingStrategy.strategy}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--accent)" }}>
                Context: {linkingStrategy.context}
              </p>
            </div>
          )}

          <Select
            label="Select a goal to link this strategy to"
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
            options={[
              { value: "", label: "No goal (unlink)" },
              ...goals.map((g) => ({ value: g.id, label: g.title })),
            ]}
          />

          {goals.length === 0 && (
            <p className="text-sm" style={{ color: "var(--accent)" }}>
              No active goals found. Create a goal first to link strategies to it.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowLinkModal(false);
                setLinkingStrategy(null);
                setSelectedGoalId("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleLinkToGoal}>
              {selectedGoalId ? "Link to Goal" : "Unlink"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StrategyCard({
  strategy,
  onEffectivenessChange,
  onLinkToGoal,
}: {
  strategy: StrategyWithGoal;
  onEffectivenessChange: (id: string, worked: boolean | null) => void;
  onLinkToGoal: (strategy: StrategyWithGoal) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="rounded-3xl p-4"
      style={{
        background: "var(--background)",
        boxShadow: "6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light)",
      }}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>
            {strategy.strategy}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--accent)" }}>
            Context: {strategy.context}
          </p>
        </div>
      </div>

      {strategy.notes && (
        <p className="mb-3 text-sm" style={{ color: "var(--foreground)" }}>
          {strategy.notes}
        </p>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="default">Complexity: {strategy.complexity}/5</Badge>
          <Badge variant="default">Tried {strategy.timesTried}x</Badge>
          {strategy.goal ? (
            <button
              onClick={() => onLinkToGoal(strategy)}
              className="flex items-center gap-1"
            >
              <Badge variant="info" className="cursor-pointer hover:opacity-80">
                <Flag className="h-3 w-3 mr-1" />
                {strategy.goal.title}
              </Badge>
            </button>
          ) : (
            <button
              onClick={() => onLinkToGoal(strategy)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all"
              style={{
                background: "var(--shadow-light)",
                color: "var(--accent)",
              }}
            >
              <Link2 className="h-3 w-3" />
              Link to goal
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              onEffectivenessChange(
                strategy.id,
                strategy.worked === true ? null : true
              )
            }
            className="rounded-xl p-2 transition-all"
            style={{
              background: strategy.worked === true ? "#d4f0e0" : "transparent",
              color: strategy.worked === true ? "#2d6a4f" : "var(--accent)",
              boxShadow: strategy.worked === true ? "inset 2px 2px 4px var(--shadow-dark), inset -2px -2px 4px var(--shadow-light)" : "none",
            }}
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
            className="rounded-xl p-2 transition-all"
            style={{
              background: strategy.worked === false ? "#f5d4d4" : "transparent",
              color: strategy.worked === false ? "#9b2c3d" : "var(--accent)",
              boxShadow: strategy.worked === false ? "inset 2px 2px 4px var(--shadow-dark), inset -2px -2px 4px var(--shadow-light)" : "none",
            }}
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
