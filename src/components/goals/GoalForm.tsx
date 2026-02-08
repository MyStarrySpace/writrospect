"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type GoalStatus = "active" | "completed" | "paused" | "abandoned";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  why: string | null;
  obstacle: string | null;
  status: GoalStatus;
  progress: number;
  outcome: string | null;
  learned: string | null;
}

interface GoalFormProps {
  goal?: Goal;
  onSubmit: (data: GoalFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface GoalFormData {
  title: string;
  description?: string;
  why?: string;
  obstacle?: string;
  progress?: number;
  outcome?: string;
  learned?: string;
}

export function GoalForm({
  goal,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: GoalFormProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    title: goal?.title || "",
    description: goal?.description || "",
    why: goal?.why || "",
    obstacle: goal?.obstacle || "",
    progress: goal?.progress || 0,
    outcome: goal?.outcome || "",
    learned: goal?.learned || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <Input
        label="Goal Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="e.g., Develop intellectual rigor"
        required
      />

      <Textarea
        label="Description (optional)"
        value={formData.description || ""}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Describe what achieving this goal looks like..."
        className="min-h-[80px]"
      />

      <Textarea
        label="Why is this important? (optional)"
        value={formData.why || ""}
        onChange={(e) => setFormData({ ...formData, why: e.target.value })}
        placeholder="What's the deeper motivation behind this goal?"
        className="min-h-[80px]"
      />

      <Textarea
        label="What might get in the way? (optional)"
        value={formData.obstacle || ""}
        onChange={(e) => setFormData({ ...formData, obstacle: e.target.value })}
        placeholder="What inner or outer obstacles might block this goal?"
        className="min-h-[80px]"
      />

      {goal && goal.status === "active" && (
        <div>
          <label
            className="mb-2 block text-sm font-medium"
            style={{ color: "var(--foreground)" }}
          >
            Progress ({formData.progress}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) =>
              setFormData({ ...formData, progress: parseInt(e.target.value) })
            }
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--foreground) ${formData.progress}%, var(--shadow-dark) ${formData.progress}%)`,
            }}
          />
        </div>
      )}

      {goal && (goal.status === "completed" || goal.status === "abandoned") && (
        <>
          <Textarea
            label="Outcome"
            value={formData.outcome || ""}
            onChange={(e) =>
              setFormData({ ...formData, outcome: e.target.value })
            }
            placeholder="What actually happened?"
            className="min-h-[80px]"
          />

          <Textarea
            label="What did you learn?"
            value={formData.learned || ""}
            onChange={(e) =>
              setFormData({ ...formData, learned: e.target.value })
            }
            placeholder="Any insights about yourself or your process?"
            className="min-h-[80px]"
          />
        </>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {goal ? "Update" : "Create"} Goal
        </Button>
      </div>
    </motion.form>
  );
}
