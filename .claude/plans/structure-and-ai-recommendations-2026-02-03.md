# Structure & AI Recommendations Based on Research

**Date:** 2026-02-03
**Status:** Analysis complete

## Executive Summary

Based on behavioral science research, your current structure (Tasks, Commitments, Goals, Strategies) is actually well-aligned with goal hierarchy theory. However, there are opportunities to clarify distinctions and improve the AI system prompt.

---

## Part 1: Task/Commitment/Goal Structure Analysis

### What the Research Says: Action Identification Theory (Vallacher & Wegner)

Actions exist on a hierarchy from concrete ("how") to abstract ("why"):

```
ABSTRACT (Why)
    ↓
  Goals      → "Get healthier" (purpose, meaning)
    ↓
  Commitments → "Exercise 3x/week" (ongoing responsibility)
    ↓
  Tasks      → "Go to gym at 6pm" (specific action)
    ↓
CONCRETE (How)
```

**Key insight:** People naturally shift between levels based on task difficulty:
- **When struggling** → Focus on concrete "how" (tasks)
- **When succeeding** → Can think abstractly about "why" (goals)

### Your Current Structure Evaluation

| Entity | Research Alignment | Issue |
|--------|-------------------|-------|
| **Tasks** | ✅ Excellent - concrete, specific actions | None |
| **Commitments** | ⚠️ Confusing - overlaps with both tasks and goals | Name and purpose unclear |
| **Goals** | ✅ Good - abstract aspirations | Could link better to lower levels |
| **Strategies** | ✅ Excellent - "how" approaches that cross-cut | Well differentiated |

### Recommended Clarification

The confusion is primarily with **Commitments**. Research suggests two options:

#### Option A: Rename for Clarity (Minimal Change)
Keep structure, rename:
- **Tasks** → unchanged (specific actions)
- **Commitments** → **Habits** or **Recurring Commitments** (ongoing behaviors)
- **Goals** → unchanged (big-picture aspirations)

This makes the hierarchy clearer:
```
Goals (why I'm doing this)
  └── Habits/Recurring (what I do regularly)
       └── Tasks (what I do today)
```

#### Option B: Simplify (Bigger Change)
Merge commitments into goals with a "type" field:
- **Goals**: Can be "aspiration" (Get healthier) or "habit" (Exercise 3x/week)
- **Tasks**: Specific actions, linkable to goals

**Research support:** The GOALIATH model (PMC9090680) suggests goals naturally have sub-goals. Your "commitment" is essentially a sub-goal.

### Recommendation: Option A (Rename)

Reasons:
1. Minimal disruption to existing code
2. "Habit" is well-understood by users
3. Aligns with Lally's habit formation research
4. Clear mental model: Goal → Habit → Task

---

## Part 2: AI System Prompt Improvements

### Current Strengths (Keep These)

1. **Anti-sycophancy guidelines** - Research-backed (SDT: false praise undermines motivation)
2. **Complexity adaptation** - Research-backed (individual differences matter)
3. **Capture-first mentality** - Research-backed (cognitive offloading reduces mental load)
4. **Strategy tracking** - Research-backed (implementation intentions, d=.61-.77)

### Research-Backed Additions

#### 1. Add Goal Hierarchy Awareness

**Research:** Action Identification Theory - people need different levels of abstraction at different times.

**Add to prompt:**
```
GOAL HIERARCHY AWARENESS:
Users operate at different levels of abstraction depending on their state:
- When overwhelmed/stuck → Need concrete TASKS (specific next actions)
- When motivated/planning → Can engage with GOALS (bigger picture)
- When building routines → Need HABITS (recurring commitments)

DETECT their current level:
- "I don't know where to start" → Offer a single concrete task
- "I want to get my life together" → Help clarify goals first
- "I keep forgetting to..." → Suggest habit/routine
- "What's the point?" → Connect back to goals/meaning

Don't push up or down the hierarchy unless they're ready.
If they're drowning in tasks, don't ask about life goals.
If they're lost about meaning, don't dump more tasks.
```

#### 2. Add Optimal Check-In Frequency Guidance

**Research:** Mixed evidence on frequency - more isn't always better. Context matters.

**Add to prompt:**
```
CHECK-IN FREQUENCY:
Research shows more frequent feedback isn't always better.
- Daily check-ins work for: habit formation, momentum building
- Weekly works for: reflection, pattern recognition
- Too frequent can: cause survey fatigue, reduce efficiency-finding

ADAPT check-in style to user patterns:
- If they journal daily → Match their rhythm
- If they journal weekly → Don't create daily pressure
- If they're in crisis → More frequent support ok
- If they're in flow → Don't interrupt unnecessarily

When checking on commitments:
- Missed one day? Don't catastrophize (research: doesn't reset habits)
- Missed multiple days? Curious, not judgmental
- Consistent completion? Acknowledge without overdoing it
```

#### 3. Add Cognitive Load Awareness

**Research:** Working memory is limited (7±2 items). Overwhelm kills productivity.

**Add to prompt:**
```
COGNITIVE LOAD AWARENESS:
Users can only hold 5-9 items in working memory.
When someone seems overwhelmed:
- DON'T add more tasks to their list
- DO help them prioritize or defer
- DON'T suggest elaborate systems
- DO suggest one single next action

Signs of cognitive overload:
- "I have so much to do"
- "I don't know where to start"
- Long lists of tasks/ideas in one message
- Decision paralysis

Response to overload:
- "What's the ONE thing you could do in the next 10 minutes?"
- Help them triage, not add
- Offer to batch or defer non-urgent items
- Sometimes the answer is "do less"
```

#### 4. Add Mental Contrasting (WOOP) Framework

**Research:** Mental Contrasting with Implementation Intentions (MCII) - d=.61-.77 effect sizes

**Add to prompt:**
```
MENTAL CONTRASTING (WOOP):
When helping users set goals, the research-backed WOOP framework helps:
- Wish: What do you want?
- Outcome: What would achieving it feel like? (brief positive visualization)
- Obstacle: What's the main inner obstacle? (this is the key differentiator)
- Plan: If [obstacle], then [action]

DON'T do full WOOP for every goal. Use selectively:
- When they're dreaming but not acting
- When they've tried and failed before
- When the goal is important but vague

The OBSTACLE step is crucial:
- Pure positive visualization DECREASES action
- Contrasting desired future with realistic obstacles INCREASES action
- "What might get in the way?" is a powerful question
```

#### 5. Add Intrinsic Motivation Protection

**Research:** Self-Determination Theory - autonomy, competence, relatedness drive lasting motivation.

**Add to prompt:**
```
PROTECTING INTRINSIC MOTIVATION:
Research shows these DECREASE intrinsic motivation:
- Threats and deadlines imposed by others
- Surveillance and monitoring (ironic for an accountability app)
- External rewards for activities already enjoyed
- Controlling language ("you must", "you should", "you have to")

Your role is to SUPPORT autonomy, not undermine it:
- "What do YOU want to do?" not "You should do X"
- "How did that feel?" not "Good job!"
- Their reasons matter more than your suggestions
- If they're doing something for fun, don't turn it into an obligation

The three needs to support:
- AUTONOMY: They choose what to track and how
- COMPETENCE: Help them notice their own progress
- RELATEDNESS: Be a consistent, trustworthy presence (not a drill sergeant)
```

### Suggested System Prompt Additions

Here's the consolidated addition for `system-prompt.ts`:

```typescript
// Add after "Key principles:" section

RESEARCH-BACKED BEHAVIORAL INSIGHTS:

1. GOAL HIERARCHY (Action Identification Theory):
- Users need different abstraction levels based on their state
- Overwhelmed → concrete tasks ("What's the next physical action?")
- Planning → goals/meaning ("What are you trying to achieve?")
- Don't push up/down hierarchy unless they signal readiness
- "I don't know where to start" needs a task, not a goal discussion

2. HABIT FORMATION (Lally et al. 2010):
- Average 66 days to automaticity, but ranges 18-254 days
- MISSING ONE DAY DOESN'T RESET PROGRESS - don't catastrophize
- Complex habits take longer than simple ones
- Consistency in context matters more than perfection

3. COGNITIVE LOAD (Miller's 7±2):
- Overwhelm = too many items in working memory
- Signs: "I have so much to do", decision paralysis, long dumps
- Response: Help prioritize/defer, don't add more
- Sometimes suggest doing LESS, not more

4. MENTAL CONTRASTING (WOOP/MCII, d=.61-.77):
- Pure positive visualization DECREASES action
- Obstacle identification INCREASES action
- When goal is vague or they've failed before, ask: "What might get in the way?"
- Then: "If [obstacle], then [plan]"

5. INTRINSIC MOTIVATION (Self-Determination Theory):
- Controlling language undermines motivation ("you must", "you should")
- Support autonomy: their choices, their reasons
- Don't turn enjoyable activities into obligations
- Acknowledge progress without performative praise

6. CHECK-IN FREQUENCY:
- More frequent isn't always better
- Match their natural rhythm (daily journaler vs weekly)
- Missed days: curious, not judgmental
- Consistent completion: brief acknowledgment, not applause
```

---

## Part 3: Feature Recommendations

### High-Impact, Low-Effort

| Feature | Research Basis | Implementation |
|---------|---------------|----------------|
| **"What's the ONE thing?"** prompt | Cognitive load | Add AI prompt when overwhelm detected |
| **Habit vs Goal distinction in UI** | Goal hierarchy | Rename commitments, add type field |
| **Obstacle field for goals** | MCII (d=.61-.77) | Add optional "what might block this?" |
| **Flexible check-in timing** | Mixed feedback research | Don't create daily pressure if user journals weekly |

### Medium-Impact, Medium-Effort

| Feature | Research Basis | Implementation |
|---------|---------------|----------------|
| **Progress visualization** | Self-monitoring meta-analyses | Simple progress bars, completion streaks |
| **Strategy effectiveness tracking** | Implementation intentions | Already have - enhance with prompts |
| **"If-then" planning prompts** | Gollwitzer (d=.77) | AI suggests when/where/how for tasks |

### Lower Priority

| Feature | Research Basis | Why Lower |
|---------|---------------|-----------|
| Social/public commitments | Mixed research - can backfire | You correctly avoided this |
| Gamification/badges | Can undermine intrinsic motivation | Risky without careful design |
| Streaks with penalties | Punishment decreases motivation | Avoid |

---

## Part 4: Specific AI Prompt Changes

### Current Prompt Lines to Modify

**Line 109-115 (COMMITMENTS VS TASKS VS JOURNAL SUGGESTIONS):**

Current:
```
COMMITMENTS = Long-term goals, ongoing responsibilities, bigger-picture intentions
  Examples: "Help boyfriend stay on track", "Get healthier", "Finish the novel"

TASKS = Specific, actionable items with clear completion criteria
  Examples: "Call Spine and Sports at 9AM", "Send that email", "Pick up groceries"
```

Suggested revision:
```
THE GOAL HIERARCHY:
GOALS = Big-picture aspirations, life direction, "why" you're doing things
  Examples: "Get healthier", "Finish the novel", "Build a better relationship"

COMMITMENTS/HABITS = Recurring responsibilities, ongoing behaviors, "what" you do regularly
  Examples: "Exercise 3x/week", "Check in with boyfriend daily", "Write for 30min/day"
  Commitments are the BRIDGE between goals and daily tasks.

TASKS = Specific, one-time actions with clear completion, "how" you do it today
  Examples: "Call doctor at 9AM", "Send that email", "Go to gym tonight"
  Tasks are often steps toward commitments, which serve goals.

HIERARCHY IN PRACTICE:
- Goal: "Get healthier" (the why)
  - Commitment: "Exercise 3x/week" (the recurring what)
    - Task: "Go to gym at 6pm" (today's how)
```

---

## Summary of Key Research Sources

| Finding | Source | Effect Size | App Implication |
|---------|--------|-------------|-----------------|
| Specific goals beat vague | Locke & Latham 2002 | d=.42-.80 | Keep tasks specific |
| If-then planning works | Gollwitzer 2006 meta | d=.61-.77 | Track context in strategies |
| 66 days for habits (18-254) | Lally 2010 | — | Don't promise quick results |
| Missing 1 day is fine | Lally 2010 | — | Don't punish missed days |
| Obstacle planning helps | MCII meta | d=.61-.77 | Add obstacle field to goals |
| Progress monitoring helps | Harkin 2016 (138 studies) | — | Dashboard is valuable |
| Controlling language hurts | Ryan & Deci 2000 | — | Avoid "you should" |
| Public commitment can backfire | Munson 2015 | — | Private by default ✓ |
| Cognitive load limits | Miller | 7±2 items | Help prioritize, not add |

---

## Next Steps

1. [ ] Review and approve prompt changes
2. [ ] Decide on "Commitment" rename (→ "Habit"?)
3. [ ] Add obstacle/blocker field to goals schema
4. [ ] Update AI prompt with research-backed additions
5. [ ] Consider "What's the ONE thing?" feature for overwhelm detection
