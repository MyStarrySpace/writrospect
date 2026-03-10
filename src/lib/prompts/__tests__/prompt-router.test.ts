import { describe, it, expect } from "vitest";
import { routePrompt, type PromptMode } from "../prompt-router";

function makeContext(overrides: Record<string, unknown> = {}) {
  return {
    messageContent: "Hello, I had a good day today.",
    hasOpenHabits: false,
    hasPeople: false,
    hasSilentPeople: false,
    hasRecentEntries: false,
    interactionMode: "balanced" as const,
    complexityPreference: "adaptive" as const,
    timeContext: "afternoon" as const,
    ...overrides,
  };
}

describe("routePrompt", () => {
  describe("crisis detection", () => {
    it("detects crisis signals and sets crisis mode", () => {
      const result = routePrompt(
        makeContext({ messageContent: "I want to die, nothing matters" })
      );
      expect(result.mode).toBe("crisis");
      expect(result.reasoning.some((r) => r.includes("Crisis"))).toBe(true);
    });

    it('detects "kill myself" as crisis', () => {
      const result = routePrompt(
        makeContext({ messageContent: "I want to kill myself" })
      );
      expect(result.mode).toBe("crisis");
    });

    it('detects "hopeless" as crisis', () => {
      const result = routePrompt(
        makeContext({ messageContent: "Everything is hopeless" })
      );
      expect(result.mode).toBe("crisis");
    });
  });

  describe("distress detection", () => {
    it("detects distress signals and sets encouragement mode", () => {
      const result = routePrompt(
        makeContext({ messageContent: "I feel overwhelmed and can't cope anymore" })
      );
      expect(result.mode).toBe("encouragement");
    });

    it('detects "burned out" as distress', () => {
      const result = routePrompt(
        makeContext({ messageContent: "I'm completely burned out from work" })
      );
      expect(result.mode).toBe("encouragement");
    });

    it("crisis takes precedence over distress", () => {
      const result = routePrompt(
        makeContext({
          messageContent: "I'm overwhelmed and hopeless, I want to die",
        })
      );
      expect(result.mode).toBe("crisis");
    });
  });

  describe("quick mode detection", () => {
    it("detects quick check-in messages", () => {
      const result = routePrompt(
        makeContext({ messageContent: "Just checking in, had lunch" })
      );
      expect(result.mode).toBe("quick");
    });

    it('detects "update:" prefix', () => {
      const result = routePrompt(
        makeContext({ messageContent: "Update: finished the report" })
      );
      expect(result.mode).toBe("quick");
    });
  });

  describe("cognitive overload detection", () => {
    it("detects overload signals", () => {
      const result = routePrompt(
        makeContext({
          messageContent: "I have so much to do and don't know where to start",
        })
      );
      expect(result.reasoning.some((r) => r.includes("overload"))).toBe(true);
    });
  });

  describe("time context", () => {
    it("adds time awareness for late night entries", () => {
      const result = routePrompt(makeContext({ timeContext: "late_night" }));
      expect(result.reasoning.some((r) => r.includes("Late hour"))).toBe(true);
    });

    it("adds time awareness for early morning entries", () => {
      const result = routePrompt(makeContext({ timeContext: "early_morning" }));
      expect(result.reasoning.some((r) => r.includes("Late hour"))).toBe(true);
    });

    it("does not add time awareness for normal hours", () => {
      const result = routePrompt(makeContext({ timeContext: "afternoon" }));
      expect(result.reasoning.some((r) => r.includes("Late hour"))).toBe(false);
    });
  });

  describe("user context modules", () => {
    it("adds people module when user has relationships", () => {
      const result = routePrompt(makeContext({ hasPeople: true }));
      expect(result.reasoning.some((r) => r.includes("people"))).toBe(true);
    });

    it("adds habit focus when user has open habits", () => {
      const result = routePrompt(makeContext({ hasOpenHabits: true }));
      expect(result.reasoning.some((r) => r.includes("habit"))).toBe(true);
    });

    it("adds interest tracking for thinking partner mode", () => {
      const result = routePrompt(
        makeContext({ interactionMode: "thinking_partner" })
      );
      expect(
        result.reasoning.some((r) => r.includes("thinking partner"))
      ).toBe(true);
    });

    it("adds complexity module for non-adaptive preference", () => {
      const result = routePrompt(
        makeContext({ complexityPreference: "simple" })
      );
      expect(
        result.reasoning.some((r) => r.includes("complexity preference"))
      ).toBe(true);
    });
  });

  describe("identity detection", () => {
    it("detects goal-related language", () => {
      const result = routePrompt(
        makeContext({ messageContent: "I want to set a new goal for this month" })
      );
      expect(
        result.reasoning.some((r) => r.toLowerCase().includes("identity"))
      ).toBe(true);
    });

    it("detects habit-related language", () => {
      const result = routePrompt(
        makeContext({ messageContent: "I need to build a new morning routine" })
      );
      expect(
        result.reasoning.some((r) => r.toLowerCase().includes("identity"))
      ).toBe(true);
    });

    it("detects identity language", () => {
      const result = routePrompt(
        makeContext({
          messageContent:
            "I want to become the kind of person who exercises daily",
        })
      );
      expect(
        result.reasoning.some((r) => r.toLowerCase().includes("identity"))
      ).toBe(true);
    });
  });

  describe("explicit mode override", () => {
    it("respects explicit mode override", () => {
      const result = routePrompt(
        makeContext({ mode: "encouragement" as PromptMode })
      );
      expect(result.mode).toBe("encouragement");
    });
  });

  describe("module composition", () => {
    it("always includes base module", () => {
      const result = routePrompt(makeContext());
      expect(result.modules.length).toBeGreaterThanOrEqual(1);
    });

    it("includes tone module for non-crisis modes", () => {
      const standard = routePrompt(makeContext());
      expect(standard.reasoning.some((r) => r.includes("tone"))).toBe(true);

      const crisis = routePrompt(
        makeContext({ messageContent: "I want to die" })
      );
      expect(crisis.reasoning.some((r) => r.includes("tone"))).toBe(false);
    });
  });

  describe("complexity-based fallback", () => {
    it("adds deeper engagement for substantive messages with nuance indicators", () => {
      // Needs score >= 5, nuance indicators present, but NO identity/crisis/distress/quick/overload signals
      // Avoid: "want to", "goal", "habit", "plan to", "tomorrow", "this week", etc.
      const longReflective =
        "I've been reflecting on something interesting lately. I realized that my tendency toward procrastination runs deeper than I assumed. " +
        "Looking back at the past few months, I notice a clear pattern in how I approach difficult conversations. " +
        "Part of me is frustrated by this, and on one hand I see progress, but it feels inconsistent. " +
        "It occurred to me that maybe the root cause is different from what I originally believed. " +
        "The whole situation makes me think differently about how patterns form over time.";

      const result = routePrompt(makeContext({ messageContent: longReflective }));
      expect(
        result.reasoning.some((r) => r.includes("Complexity fallback"))
      ).toBe(true);
    });

    it("does not trigger fallback for short messages", () => {
      const result = routePrompt(makeContext({ messageContent: "hi" }));
      expect(
        result.reasoning.some((r) => r.includes("Complexity fallback"))
      ).toBe(false);
    });
  });
});
