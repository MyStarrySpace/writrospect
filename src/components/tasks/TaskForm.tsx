"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Task, TaskUrgency } from "@prisma/client";

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface TaskFormData {
  what: string;
  context?: string;
  urgency: TaskUrgency;
  dueDate?: string;
  dueTime?: string;
  outcome?: string;
  skippedReason?: string;
}

const urgencyOptions = [
  { value: "now", label: "Now - Must do immediately" },
  { value: "today", label: "Today - Should do today" },
  { value: "this_week", label: "This Week - Do this week" },
  { value: "whenever", label: "Whenever - No time pressure" },
];

export function TaskForm({
  task,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    what: task?.what || "",
    context: task?.context || "",
    urgency: task?.urgency || "whenever",
    dueDate: task?.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : "",
    dueTime: task?.dueTime || "",
    outcome: task?.outcome || "",
    skippedReason: task?.skippedReason || "",
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
        label="What needs to be done?"
        value={formData.what}
        onChange={(e) => setFormData({ ...formData, what: e.target.value })}
        placeholder="Be specific about the task..."
        required
      />

      <Textarea
        label="Context (optional)"
        value={formData.context || ""}
        onChange={(e) => setFormData({ ...formData, context: e.target.value })}
        placeholder="Any additional notes or context..."
        className="min-h-[80px]"
      />

      <Select
        label="Urgency"
        value={formData.urgency}
        onChange={(e) =>
          setFormData({
            ...formData,
            urgency: e.target.value as TaskUrgency,
          })
        }
        options={urgencyOptions}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Due Date (optional)"
          type="date"
          value={formData.dueDate || ""}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        />

        <Input
          label="Due Time (optional)"
          type="text"
          value={formData.dueTime || ""}
          onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
          placeholder="e.g., 9AM, morning, when they open"
        />
      </div>

      {task && task.status === "completed" && (
        <Textarea
          label="Outcome"
          value={formData.outcome || ""}
          onChange={(e) =>
            setFormData({ ...formData, outcome: e.target.value })
          }
          placeholder="What was the result?"
          className="min-h-[80px]"
        />
      )}

      {task && task.status === "skipped" && (
        <Textarea
          label="Why was it skipped?"
          value={formData.skippedReason || ""}
          onChange={(e) =>
            setFormData({ ...formData, skippedReason: e.target.value })
          }
          placeholder="What prevented you from doing this?"
          className="min-h-[80px]"
        />
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {task ? "Update" : "Create"} Task
        </Button>
      </div>
    </motion.form>
  );
}
