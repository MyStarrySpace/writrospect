import { BASE_SYSTEM_PROMPT } from "./system-prompt";
import { buildModularPrompt, PromptMode } from "./prompt-router";
import { getTimeContext, getTimeContextLabel } from "@/lib/utils/time";
import {
  User,
  UserContext,
  UserSuccessModel,
  UserEngagementPreferences,
  JournalEntry,
  Habit,
  Task,
  Strategy,
  Person,
  PersonSentiment,
  TonePreference,
} from "@prisma/client";

interface PersonWithSentiment extends Person {
  sentimentHistory: PersonSentiment[];
  daysSilent?: number;
}

interface SessionContext {
  user: User & {
    context: UserContext | null;
    successModel: UserSuccessModel | null;
    preferences: UserEngagementPreferences | null;
  };
  recentEntries: JournalEntry[];
  openHabits: Habit[];
  pendingTasks?: Task[];
  recentStrategies: Strategy[];
  recentPeople?: PersonWithSentiment[];
  silentPeople?: PersonWithSentiment[];
  tonePreferences?: TonePreference[];
  // The specific entry the user is currently chatting about
  currentEntry?: {
    id: string;
    content: string;
    date: Date;
    timeContext: string;
  };
  // For modular prompt system
  currentMessage?: string;
  promptMode?: PromptMode;
  useModularPrompt?: boolean;
}

export function buildSessionPrompt(context: SessionContext): string {
  const { user, recentEntries, openHabits, pendingTasks, recentStrategies, recentPeople, silentPeople, tonePreferences, currentEntry, currentMessage, promptMode, useModularPrompt } = context;
  const currentTimeContext = getTimeContext(new Date());

  // Use modular prompt system if enabled
  let basePrompt: string;
  if (useModularPrompt && currentMessage) {
    basePrompt = buildModularPrompt({
      messageContent: currentMessage,
      hasOpenHabits: openHabits.length > 0,
      hasPeople: (recentPeople?.length || 0) > 0,
      hasSilentPeople: (silentPeople?.length || 0) > 0,
      hasRecentEntries: recentEntries.length > 0,
      interactionMode: user.preferences?.interactionMode || "balanced",
      complexityPreference: user.successModel?.complexityPreference || "adaptive",
      timeContext: currentTimeContext,
      mode: promptMode,
    });
  } else {
    basePrompt = BASE_SYSTEM_PROMPT;
  }

  const sections: string[] = [basePrompt];

  // CRITICAL: Add the current entry being discussed FIRST and prominently
  // This is the entry the user clicked on to chat about - it should be the primary focus
  if (currentEntry) {
    const entryDateStr = new Date(currentEntry.date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    // Cast timeContext string to TimeContext enum for the label function
    const timeContextLabel = getTimeContextLabel(currentEntry.timeContext as Parameters<typeof getTimeContextLabel>[0]);
    sections.push(`
## ⭐ THE ENTRY BEING DISCUSSED

This is the specific journal entry the user is chatting about RIGHT NOW. Your response should primarily address THIS entry's content.

Date: ${entryDateStr} (${timeContextLabel})

Entry content:
"""
${currentEntry.content}
"""

IMPORTANT: Focus your response on this entry. Previous entries below are background context only - do not confuse them with the current topic.`);
  }

  // Add user context if available
  if (user.context) {
    const ctx = user.context;
    const contextParts: string[] = [];

    if (ctx.about) contextParts.push(`Background: ${ctx.about}`);
    if (ctx.lifeCircumstances)
      contextParts.push(`Current circumstances: ${ctx.lifeCircumstances}`);
    if (ctx.workingConditions)
      contextParts.push(`Work situation: ${ctx.workingConditions}`);
    if (ctx.failurePatterns && ctx.failurePatterns.length > 0)
      contextParts.push(
        `Known challenge patterns: ${ctx.failurePatterns.join(", ")}`
      );
    if (ctx.resourceConstraints && ctx.resourceConstraints.length > 0)
      contextParts.push(
        `Resource constraints: ${ctx.resourceConstraints.join(", ")}`
      );

    if (contextParts.length > 0) {
      sections.push(`
## About This User

${contextParts.join("\n")}`);
    }
  }

  // Add success model
  if (user.successModel) {
    const model = user.successModel;
    const modelParts: string[] = [];

    modelParts.push(`Complexity preference: ${model.complexityPreference}`);
    if (model.completionConditions && model.completionConditions.length > 0)
      modelParts.push(
        `What helps them complete things: ${model.completionConditions.join("; ")}`
      );
    if (model.failureConditions && model.failureConditions.length > 0)
      modelParts.push(
        `What causes abandonment: ${model.failureConditions.join("; ")}`
      );

    sections.push(`
## User's Success Model

${modelParts.join("\n")}`);
  }

  // Add engagement preferences
  if (user.preferences) {
    const prefs = user.preferences;
    const prefParts: string[] = [];

    prefParts.push(`Interaction mode: ${prefs.interactionMode}`);
    prefParts.push(
      `Interest tracking: ${prefs.interestTracking ? "engaged" : "functional only"}`
    );
    if (prefs.likes && prefs.likes.length > 0)
      prefParts.push(`Engages well with: ${prefs.likes.join(", ")}`);
    if (prefs.dislikes && prefs.dislikes.length > 0)
      prefParts.push(`Prefers to avoid: ${prefs.dislikes.join(", ")}`);
    if (prefs.topicsTheyShare && prefs.topicsTheyShare.length > 0)
      prefParts.push(`Topics they share: ${prefs.topicsTheyShare.join(", ")}`);

    sections.push(`
## Interaction Style

${prefParts.join("\n")}`);
  }

  // Add current time context
  sections.push(`
## Current Session

Time context: ${getTimeContextLabel(currentTimeContext)}
Date: ${new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })}`);

  // Add recent entries summary (excluding the current entry being discussed)
  const otherRecentEntries = currentEntry
    ? recentEntries.filter(e => e.id !== currentEntry.id)
    : recentEntries;

  if (otherRecentEntries.length > 0) {
    const entrySummaries = otherRecentEntries
      .slice(0, 5)
      .map((entry) => {
        const dateStr = new Date(entry.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const preview =
          entry.content.length > 150
            ? entry.content.slice(0, 150) + "..."
            : entry.content;
        return `- ${dateStr} (${getTimeContextLabel(entry.timeContext)}): ${preview}`;
      })
      .join("\n");

    sections.push(`
## Previous Journal Entries (Background Context Only)

These are older entries for background context. Do NOT confuse these with the current entry being discussed above.

${entrySummaries}`);
  }

  // Add open habits
  if (openHabits.length > 0) {
    const habitList = openHabits
      .map((h) => {
        const daysOld = Math.floor(
          (Date.now() - new Date(h.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return `- [${h.status}] ${h.what} (complexity: ${h.complexity}/5, motivation: ${h.motivationType}, ${daysOld} days old)`;
      })
      .join("\n");

    sections.push(`
## Active Habits (Recurring Behaviors)

${habitList}`);
  }

  // Add pending tasks
  if (pendingTasks && pendingTasks.length > 0) {
    const taskList = pendingTasks
      .map((t) => {
        const urgencyLabel = {
          now: "URGENT",
          today: "Today",
          this_week: "This week",
          whenever: "Whenever",
        }[t.urgency] || t.urgency;
        const dueInfo = t.dueTime ? ` (${t.dueTime})` : t.dueDate ? ` (by ${new Date(t.dueDate).toLocaleDateString()})` : "";
        return `- [${urgencyLabel}] ${t.what}${dueInfo}`;
      })
      .join("\n");

    const urgentCount = pendingTasks.filter((t) => t.urgency === "now" || t.urgency === "today").length;
    const urgentNote = urgentCount > 0 ? `\n\n⚠️ ${urgentCount} task(s) need attention today.` : "";

    sections.push(`
## Pending Tasks (Specific Actions)

${taskList}${urgentNote}`);
  }

  // Add recent strategies
  if (recentStrategies.length > 0) {
    const strategyList = recentStrategies
      .slice(0, 10)
      .map((s) => {
        const effectiveness =
          s.worked === null ? "untested" : s.worked ? "worked" : "didn't work";
        return `- ${s.strategy} (${effectiveness}) - Context: ${s.context}`;
      })
      .join("\n");

    sections.push(`
## Strategies They've Tried

${strategyList}`);
  }

  // Add people they've mentioned recently
  if (recentPeople && recentPeople.length > 0) {
    const peopleList = recentPeople
      .slice(0, 10)
      .map((p) => {
        const lastSentiment = p.sentimentHistory[0]?.sentiment || "neutral";
        const daysSince = Math.floor(
          (Date.now() - new Date(p.lastMentioned).getTime()) / (1000 * 60 * 60 * 24)
        );
        return `- ${p.name} (${p.relationship}): mentioned ${p.mentionCount} times, last ${daysSince} days ago, recent sentiment: ${lastSentiment}`;
      })
      .join("\n");

    sections.push(`
## People In Their Life

${peopleList}`);
  }

  // Add silent people (those they haven't mentioned in a while)
  if (silentPeople && silentPeople.length > 0) {
    const silentList = silentPeople
      .slice(0, 5)
      .map((p) => {
        const daysSilent = p.daysSilent || Math.floor(
          (Date.now() - new Date(p.lastMentioned).getTime()) / (1000 * 60 * 60 * 24)
        );
        const lastSentiment = p.sentimentHistory[0]?.sentiment || "unknown";
        return `- ${p.name} (${p.relationship}): ${daysSilent} days since last mention (last sentiment: ${lastSentiment})`;
      })
      .join("\n");

    sections.push(`
## People They Haven't Mentioned Recently

These are relationships that may benefit from a check-in. Only bring these up naturally if relevant to the conversation.

${silentList}`);
  }

  // Add tone preferences learned from feedback
  if (tonePreferences && tonePreferences.length > 0) {
    const likedTones = tonePreferences
      .filter((t) => t.score > 0 && t.sampleCount >= 2)
      .map((t) => `${t.toneType} (score: +${t.score})`);

    const dislikedTones = tonePreferences
      .filter((t) => t.score < 0 && t.sampleCount >= 2)
      .map((t) => `${t.toneType} (score: ${t.score})`);

    if (likedTones.length > 0 || dislikedTones.length > 0) {
      const toneParts: string[] = [];
      if (likedTones.length > 0) {
        toneParts.push(`Preferred communication styles: ${likedTones.join(", ")}`);
      }
      if (dislikedTones.length > 0) {
        toneParts.push(`Styles to avoid: ${dislikedTones.join(", ")}`);
      }

      sections.push(`
## Learned Communication Preferences

Based on past feedback:
${toneParts.join("\n")}`);
    }
  }

  return sections.join("\n\n---\n\n");
}
