"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { User, Brain, MessageSquare, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { SaveBanner } from "@/components/ui/SaveBanner";
import { useToast } from "@/components/ui/Toast";
import { useAutoSave } from "@/hooks/useAutoSave";

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

interface AllSettings {
  context: UserContext;
  successModel: UserSuccessModel;
  preferences: UserPreferences;
  timezone: string;
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

const defaultSettings: AllSettings = {
  context: {
    about: "",
    lifeCircumstances: "",
    workingConditions: "",
    failurePatterns: [],
    resourceConstraints: [],
  },
  successModel: {
    complexityPreference: "adaptive",
    completionConditions: [],
    failureConditions: [],
  },
  preferences: {
    interactionMode: "balanced",
    interestTracking: true,
    likes: [],
    dislikes: [],
    topicsTheyShare: [],
  },
  timezone: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AllSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [newItems, setNewItems] = useState({
    failurePatterns: "",
    completionConditions: "",
    likes: "",
  });
  const { addToast } = useToast();

  const saveAllSettings = useCallback(async (data: AllSettings) => {
    const results = await Promise.allSettled([
      fetch("/api/user/context", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.context),
      }),
      fetch("/api/user/success-model", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.successModel),
      }),
      fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.preferences),
      }),
      fetch("/api/user/timezone", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: data.timezone }),
      }),
    ]);

    const failed = results.some(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)
    );

    if (failed) {
      throw new Error("Some settings failed to save");
    }
  }, []);

  const getChangeDescription = useCallback(
    (previous: AllSettings, current: AllSettings): string => {
      // Check context changes
      if (previous.context.about !== current.context.about) {
        return "Description updated";
      }
      if (previous.context.lifeCircumstances !== current.context.lifeCircumstances) {
        return "Life circumstances updated";
      }
      if (previous.context.workingConditions !== current.context.workingConditions) {
        return "Working conditions updated";
      }
      if (JSON.stringify(previous.context.failurePatterns) !== JSON.stringify(current.context.failurePatterns)) {
        const added = current.context.failurePatterns.filter(
          (p) => !previous.context.failurePatterns.includes(p)
        );
        const removed = previous.context.failurePatterns.filter(
          (p) => !current.context.failurePatterns.includes(p)
        );
        if (added.length > 0) return `Added failure pattern: ${added[0]}`;
        if (removed.length > 0) return `Removed failure pattern: ${removed[0]}`;
      }

      // Check success model changes
      if (previous.successModel.complexityPreference !== current.successModel.complexityPreference) {
        return "Complexity preference updated";
      }
      if (JSON.stringify(previous.successModel.completionConditions) !== JSON.stringify(current.successModel.completionConditions)) {
        const added = current.successModel.completionConditions.filter(
          (c) => !previous.successModel.completionConditions.includes(c)
        );
        const removed = previous.successModel.completionConditions.filter(
          (c) => !current.successModel.completionConditions.includes(c)
        );
        if (added.length > 0) return `Added completion condition: ${added[0]}`;
        if (removed.length > 0) return `Removed completion condition: ${removed[0]}`;
      }

      // Check preferences changes
      if (previous.preferences.interactionMode !== current.preferences.interactionMode) {
        return "Interaction mode updated";
      }
      if (previous.preferences.interestTracking !== current.preferences.interestTracking) {
        return current.preferences.interestTracking
          ? "Interest tracking enabled"
          : "Interest tracking disabled";
      }
      if (JSON.stringify(previous.preferences.likes) !== JSON.stringify(current.preferences.likes)) {
        const added = current.preferences.likes.filter(
          (l) => !previous.preferences.likes.includes(l)
        );
        const removed = previous.preferences.likes.filter(
          (l) => !current.preferences.likes.includes(l)
        );
        if (added.length > 0) return `Added topic: ${added[0]}`;
        if (removed.length > 0) return `Removed topic: ${removed[0]}`;
      }

      // Check timezone changes
      if (previous.timezone !== current.timezone) {
        return "Timezone updated";
      }

      return "Settings saved";
    },
    []
  );

  const {
    showBanner,
    timeRemaining,
    bannerDuration,
    changeDescription,
    undo,
    dismissBanner,
  } = useAutoSave(settings, {
    onSave: saveAllSettings,
    getChangeDescription,
    debounceMs: 800,
    bannerDurationMs: 5000,
  });

  const handleUndo = useCallback(async () => {
    const previousSettings = await undo();
    if (previousSettings) {
      setSettings(previousSettings);
    }
  }, [undo]);

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

      setSettings({
        context: contextData.context || defaultSettings.context,
        successModel: modelData.successModel || defaultSettings.successModel,
        preferences: prefsData.preferences || defaultSettings.preferences,
        timezone: timezoneData.timezone || defaultSettings.timezone,
      });
    } catch (error) {
      addToast("error", "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const updateContext = useCallback((updates: Partial<UserContext>) => {
    setSettings((prev) => ({
      ...prev,
      context: { ...prev.context, ...updates },
    }));
  }, []);

  const updateSuccessModel = useCallback((updates: Partial<UserSuccessModel>) => {
    setSettings((prev) => ({
      ...prev,
      successModel: { ...prev.successModel, ...updates },
    }));
  }, []);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setSettings((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates },
    }));
  }, []);

  const updateTimezone = useCallback((timezone: string) => {
    setSettings((prev) => ({ ...prev, timezone }));
  }, []);

  const addToList = (
    listKey: "failurePatterns" | "completionConditions" | "likes",
    section: "context" | "successModel" | "preferences"
  ) => {
    const value = newItems[listKey];
    if (!value.trim()) return;

    const currentList = settings[section][listKey as keyof typeof settings[typeof section]] as string[];
    if (currentList.includes(value.trim())) return;

    if (section === "context") {
      updateContext({ [listKey]: [...currentList, value.trim()] });
    } else if (section === "successModel") {
      updateSuccessModel({ [listKey]: [...currentList, value.trim()] });
    } else {
      updatePreferences({ [listKey]: [...currentList, value.trim()] });
    }
    setNewItems((prev) => ({ ...prev, [listKey]: "" }));
  };

  const removeFromList = (
    item: string,
    listKey: keyof UserContext | keyof UserSuccessModel | keyof UserPreferences,
    section: "context" | "successModel" | "preferences"
  ) => {
    const currentList = settings[section][listKey as keyof typeof settings[typeof section]] as string[];
    const newList = currentList.filter((i) => i !== item);

    if (section === "context") {
      updateContext({ [listKey]: newList });
    } else if (section === "successModel") {
      updateSuccessModel({ [listKey]: newList });
    } else {
      updatePreferences({ [listKey]: newList });
    }
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
      <SaveBanner
        show={showBanner}
        message={changeDescription}
        timeRemaining={timeRemaining}
        duration={bannerDuration}
        onUndo={handleUndo}
        onDismiss={dismissBanner}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Settings
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Help the AI understand you better by sharing context about yourself.
          Changes are saved automatically.
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
                value={settings.context.about || ""}
                onChange={(e) => updateContext({ about: e.target.value })}
                placeholder="A brief description of yourself, your goals, what matters to you..."
              />

              <Textarea
                label="Life circumstances"
                value={settings.context.lifeCircumstances || ""}
                onChange={(e) =>
                  updateContext({ lifeCircumstances: e.target.value })
                }
                placeholder="Current situation - work, family, health, constraints..."
              />

              <Textarea
                label="Working conditions"
                value={settings.context.workingConditions || ""}
                onChange={(e) =>
                  updateContext({ workingConditions: e.target.value })
                }
                placeholder="What helps you focus and get things done..."
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Known failure patterns
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {settings.context.failurePatterns.map((pattern) => (
                    <Badge
                      key={pattern}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() =>
                        removeFromList(pattern, "failurePatterns", "context")
                      }
                    >
                      {pattern} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newItems.failurePatterns}
                    onChange={(e) =>
                      setNewItems((prev) => ({
                        ...prev,
                        failurePatterns: e.target.value,
                      }))
                    }
                    placeholder="Add a pattern..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToList("failurePatterns", "context");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addToList("failurePatterns", "context")}
                  >
                    Add
                  </Button>
                </div>
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
                value={settings.successModel.complexityPreference}
                onChange={(e) =>
                  updateSuccessModel({ complexityPreference: e.target.value })
                }
                options={complexityOptions}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  What helps you complete things
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {settings.successModel.completionConditions.map((condition) => (
                    <Badge
                      key={condition}
                      variant="success"
                      className="cursor-pointer"
                      onClick={() =>
                        removeFromList(
                          condition,
                          "completionConditions",
                          "successModel"
                        )
                      }
                    >
                      {condition} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newItems.completionConditions}
                    onChange={(e) =>
                      setNewItems((prev) => ({
                        ...prev,
                        completionConditions: e.target.value,
                      }))
                    }
                    placeholder="Add a condition..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToList("completionConditions", "successModel");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      addToList("completionConditions", "successModel")
                    }
                  >
                    Add
                  </Button>
                </div>
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
                value={settings.preferences.interactionMode}
                onChange={(e) =>
                  updatePreferences({ interactionMode: e.target.value })
                }
                options={interactionModeOptions}
              />

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="interestTracking"
                  checked={settings.preferences.interestTracking}
                  onChange={(e) =>
                    updatePreferences({ interestTracking: e.target.checked })
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
                  {settings.preferences.likes.map((like) => (
                    <Badge
                      key={like}
                      variant="info"
                      className="cursor-pointer"
                      onClick={() =>
                        removeFromList(like, "likes", "preferences")
                      }
                    >
                      {like} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newItems.likes}
                    onChange={(e) =>
                      setNewItems((prev) => ({
                        ...prev,
                        likes: e.target.value,
                      }))
                    }
                    placeholder="Add a topic..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToList("likes", "preferences");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addToList("likes", "preferences")}
                  >
                    Add
                  </Button>
                </div>
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
                Set your timezone to accurately tag entries with time of day
                (morning, afternoon, evening, etc.)
              </p>
              <Select
                label="Your timezone"
                value={settings.timezone}
                onChange={(e) => updateTimezone(e.target.value)}
                options={timezoneOptions}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
