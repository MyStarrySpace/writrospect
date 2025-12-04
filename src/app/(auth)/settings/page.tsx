"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, User, Brain, MessageSquare, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface UserContext {
  about: string | null;
  lifeCircumstances: string | null;
  workingConditions: string | null;
  failurePatterns: string[];
  resourceConstraints: string[];
}

interface UserSuccessModel {
  complexityPreference: string;
  completionConditions: string[];
  failureConditions: string[];
}

interface UserPreferences {
  interactionMode: string;
  interestTracking: boolean;
  likes: string[];
  dislikes: string[];
  topicsTheyShare: string[];
}

const complexityOptions = [
  { value: "simple", label: "Simple - Minimal friction" },
  { value: "moderate", label: "Moderate - Balanced approach" },
  { value: "complex", label: "Complex - Detailed systems" },
  { value: "adaptive", label: "Adaptive - Depends on context" },
];

const interactionModeOptions = [
  { value: "thinking_partner", label: "Thinking Partner - Engage with ideas" },
  { value: "functional", label: "Functional - Task-focused only" },
  { value: "balanced", label: "Balanced - Mix of both" },
];

// Common timezones for the dropdown
const timezoneOptions = [
  { value: "", label: "Select timezone..." },
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
  { value: "Europe/London", label: "London (UK)" },
  { value: "Europe/Paris", label: "Central European Time" },
  { value: "Europe/Helsinki", label: "Eastern European Time" },
  { value: "Asia/Dubai", label: "Dubai (UAE)" },
  { value: "Asia/Kolkata", label: "India Standard Time" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Tokyo", label: "Japan Standard Time" },
  { value: "Australia/Sydney", label: "Sydney (Australia)" },
  { value: "Pacific/Auckland", label: "Auckland (New Zealand)" },
];

export default function SettingsPage() {
  const [context, setContext] = useState<UserContext>({
    about: "",
    lifeCircumstances: "",
    workingConditions: "",
    failurePatterns: [],
    resourceConstraints: [],
  });

  const [successModel, setSuccessModel] = useState<UserSuccessModel>({
    complexityPreference: "adaptive",
    completionConditions: [],
    failureConditions: [],
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    interactionMode: "balanced",
    interestTracking: true,
    likes: [],
    dislikes: [],
    topicsTheyShare: [],
  });

  const [timezone, setTimezone] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newItem, setNewItem] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const [contextRes, modelRes, prefsRes, timezoneRes] = await Promise.all([
        fetch("/api/user/context"),
        fetch("/api/user/success-model"),
        fetch("/api/user/preferences"),
        fetch("/api/user/timezone"),
      ]);

      const [contextData, modelData, prefsData, timezoneData] = await Promise.all([
        contextRes.json(),
        modelRes.json(),
        prefsRes.json(),
        timezoneRes.json(),
      ]);

      if (contextData.context) setContext(contextData.context);
      if (modelData.successModel) setSuccessModel(modelData.successModel);
      if (prefsData.preferences) setPreferences(prefsData.preferences);
      if (timezoneData.timezone) setTimezone(timezoneData.timezone);
    } catch (error) {
      addToast("error", "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const saveContext = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/context", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context),
      });

      if (response.ok) {
        addToast("success", "Context saved");
      } else {
        throw new Error();
      }
    } catch {
      addToast("error", "Failed to save context");
    } finally {
      setIsSaving(false);
    }
  };

  const saveSuccessModel = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/success-model", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(successModel),
      });

      if (response.ok) {
        addToast("success", "Success model saved");
      } else {
        throw new Error();
      }
    } catch {
      addToast("error", "Failed to save success model");
    } finally {
      setIsSaving(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        addToast("success", "Preferences saved");
      } else {
        throw new Error();
      }
    } catch {
      addToast("error", "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const saveTimezone = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/timezone", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      });

      if (response.ok) {
        addToast("success", "Timezone saved");
      } else {
        throw new Error();
      }
    } catch {
      addToast("error", "Failed to save timezone");
    } finally {
      setIsSaving(false);
    }
  };

  const addToList = (
    list: string[],
    setList: (items: string[]) => void
  ) => {
    if (newItem.trim() && !list.includes(newItem.trim())) {
      setList([...list, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeFromList = (
    item: string,
    list: string[],
    setList: (items: string[]) => void
  ) => {
    setList(list.filter((i) => i !== item));
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Settings
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Help the AI understand you better by sharing context about yourself.
        </p>
      </div>

      <div className="space-y-6">
        {/* User Context */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                About You
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="Brief description"
                value={context.about || ""}
                onChange={(e) =>
                  setContext({ ...context, about: e.target.value })
                }
                placeholder="A brief description of yourself, your goals, what matters to you..."
              />

              <Textarea
                label="Life circumstances"
                value={context.lifeCircumstances || ""}
                onChange={(e) =>
                  setContext({ ...context, lifeCircumstances: e.target.value })
                }
                placeholder="Current situation - work, family, health, constraints..."
              />

              <Textarea
                label="Working conditions"
                value={context.workingConditions || ""}
                onChange={(e) =>
                  setContext({ ...context, workingConditions: e.target.value })
                }
                placeholder="What helps you focus and get things done..."
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Known failure patterns
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {context.failurePatterns.map((pattern) => (
                    <Badge
                      key={pattern}
                      variant="danger"
                      className="cursor-pointer"
                      onClick={() =>
                        removeFromList(
                          pattern,
                          context.failurePatterns,
                          (items) =>
                            setContext({ ...context, failurePatterns: items })
                        )
                      }
                    >
                      {pattern} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add a pattern..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToList(context.failurePatterns, (items) =>
                          setContext({ ...context, failurePatterns: items })
                        );
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      addToList(context.failurePatterns, (items) =>
                        setContext({ ...context, failurePatterns: items })
                      )
                    }
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={saveContext}
                  isLoading={isSaving}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Save Context
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Success Model */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Success Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Complexity preference"
                value={successModel.complexityPreference}
                onChange={(e) =>
                  setSuccessModel({
                    ...successModel,
                    complexityPreference: e.target.value,
                  })
                }
                options={complexityOptions}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  What helps you complete things
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {successModel.completionConditions.map((condition) => (
                    <Badge
                      key={condition}
                      variant="success"
                      className="cursor-pointer"
                      onClick={() =>
                        removeFromList(
                          condition,
                          successModel.completionConditions,
                          (items) =>
                            setSuccessModel({
                              ...successModel,
                              completionConditions: items,
                            })
                        )
                      }
                    >
                      {condition} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add a condition..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToList(successModel.completionConditions, (items) =>
                          setSuccessModel({
                            ...successModel,
                            completionConditions: items,
                          })
                        );
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      addToList(successModel.completionConditions, (items) =>
                        setSuccessModel({
                          ...successModel,
                          completionConditions: items,
                        })
                      )
                    }
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={saveSuccessModel}
                  isLoading={isSaving}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Save Success Model
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interaction Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Interaction Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Interaction mode"
                value={preferences.interactionMode}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    interactionMode: e.target.value,
                  })
                }
                options={interactionModeOptions}
              />

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="interestTracking"
                  checked={preferences.interestTracking}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      interestTracking: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                />
                <label
                  htmlFor="interestTracking"
                  className="text-sm text-zinc-700 dark:text-zinc-300"
                >
                  Let AI engage with my interests and make connections
                </label>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Topics you enjoy discussing
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {preferences.likes.map((like) => (
                    <Badge
                      key={like}
                      variant="info"
                      className="cursor-pointer"
                      onClick={() =>
                        removeFromList(like, preferences.likes, (items) =>
                          setPreferences({ ...preferences, likes: items })
                        )
                      }
                    >
                      {like} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add a topic..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToList(preferences.likes, (items) =>
                          setPreferences({ ...preferences, likes: items })
                        );
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      addToList(preferences.likes, (items) =>
                        setPreferences({ ...preferences, likes: items })
                      )
                    }
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={savePreferences}
                  isLoading={isSaving}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Timezone Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Timezone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Set your timezone to accurately tag entries with time of day (morning, afternoon, evening, etc.)
              </p>
              <Select
                label="Your timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                options={timezoneOptions}
              />

              <div className="flex justify-end">
                <Button
                  onClick={saveTimezone}
                  isLoading={isSaving}
                  disabled={!timezone}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Save Timezone
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
