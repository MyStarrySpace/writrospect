"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Habit, MotivationType } from "@prisma/client";

interface HabitFormProps {
  habit?: Habit;
  onSubmit: (data: HabitFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface HabitFormData {
  what: string;
  why?: string;
  complexity: number;
  motivationType: MotivationType;
  dueDate?: string;
  outcome?: string;
  learned?: string;
}

const motivationOptions = [
  { value: "intrinsic", label: "Intrinsic - Self-motivated" },
  { value: "extrinsic", label: "Extrinsic - External pressure" },
  { value: "obligation", label: "Obligation - Duty-bound" },
  { value: "curiosity", label: "Curiosity - Interest-driven" },
  { value: "growth", label: "Growth - Development-focused" },
  { value: "maintenance", label: "Maintenance - Sustaining existing" },
];

const complexityOptions = [
  { value: "1", label: "1 - Simple" },
  { value: "2", label: "2 - Easy" },
  { value: "3", label: "3 - Moderate" },
  { value: "4", label: "4 - Complex" },
  { value: "5", label: "5 - Very Complex" },
];

export function HabitForm({
  habit,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: HabitFormProps) {
  const [formData, setFormData] = useState<HabitFormData>({
    what: habit?.what || "",
    why: habit?.why || "",
    complexity: habit?.complexity || 3,
    motivationType: habit?.motivationType || "intrinsic",
    dueDate: habit?.dueDate
      ? new Date(habit.dueDate).toISOString().split("T")[0]
      : "",
    outcome: habit?.outcome || "",
    learned: habit?.learned || "",
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
      <Textarea
        label="What habit are you building?"
        value={formData.what}
        onChange={(e) => setFormData({ ...formData, what: e.target.value })}
        placeholder="Be specific about what you'll do regularly..."
        required
      />

      <Textarea
        label="Why? (optional)"
        value={formData.why || ""}
        onChange={(e) => setFormData({ ...formData, why: e.target.value })}
        placeholder="What's the underlying motivation?"
        className="min-h-[80px]"
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
          label="Motivation Type"
          value={formData.motivationType}
          onChange={(e) =>
            setFormData({
              ...formData,
              motivationType: e.target.value as MotivationType,
            })
          }
          options={motivationOptions}
        />
      </div>

      <Input
        label="Target Date (optional)"
        type="date"
        value={formData.dueDate || ""}
        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
      />

      {habit && (habit.status === "completed" || habit.status === "abandoned") && (
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
          {habit ? "Update" : "Create"} Habit
        </Button>
      </div>
    </motion.form>
  );
}
