# Writrospect - Product Specification

## 1. Product Philosophy

### What It Is
A journaling system that helps you remember what matters when you've lost sight of it.

### What It's Not
- Not accountability (surveillance, compliance, "did you do enough")
- Not a task manager
- Not a therapist
- Not a drill sergeant

### The Metaphor
A friend who notices you've disappeared into a project and texts "hey, you alive?" The part of you that remembers what matters, externalized—because you forget when you're deep in it.

### Core Principles

**Methods are neutral—outcomes matter.**
- Intellectual engagement, pop culture references, frameworks aren't inherently bad
- They're bad when they REPLACE action instead of ENABLE it
- Track what works for THIS user, not what "should" work

**The metric isn't tone. It's outcome:**
- Are commitments getting completed?
- Are relationships getting tended?
- Is the gap between "said I'd do" and "did" shrinking?
- Are they living better, not just understanding better?

**What the system does:**
- Notice what's gone quiet
- Orient toward what matters
- Remember for them (the thinking part is loud; the remembering part is quiet)
- Use their language/frameworks IF it helps them act
- Redirect when insight becomes avoidance

**What the system doesn't do:**
- Count things as deficits
- Flag imbalances like a dashboard
- Frame rest or connection as "maintenance work"
- Judge methods—only track results
- Make them feel surveilled or insufficient

---

## 2. Data Schema

### 2.1 User Profile

```json
{
  "user_id": "uuid",
  "created_at": "timestamp",
  
  "context": {
    "about": "string - brief description, goals, what they've shared",
    "life_circumstances": ["work", "caregiving", "health", "etc."],
    "resource_constraints": ["time", "money", "energy", "support"]
  },
  
  "success_model": {
    "complexity_preference": "complex_systems | minimal | varies_by_domain",
    "completion_drivers": ["external_accountability", "intrinsic_motivation", "clear_structure", "simple_action"],
    "failure_patterns": ["vague_tasks", "obligations_without_stake", "managing_others_goals"]
  },
  
  "tone_preference": {
    "default": "gentle | direct | varies_by_state | challenge_me",
    "learned_from": "response tracking over time"
  },
  
  "engagement_style": {
    "interest_tracking": "engaged | functional_only | unknown",
    "topics_shared": ["array of interests they've mentioned"],
    
    "response_preferences": {
      "interests_mentioned": {
        "preference": "likes | dislikes | neutral",
        "notes": "Do they engage more when you reference their hobbies/interests?"
      },
      "stats_and_progress": {
        "preference": "likes | dislikes | neutral",
        "notes": "Do they respond well to 'You've completed 3 of 5 this week' or find it surveillance-y?"
      },
      "streaks_and_milestones": {
        "preference": "likes | dislikes | neutral",
        "notes": "Motivated by '5 days in a row' or finds it gamification pressure?"
      },
      "comparisons_to_past": {
        "preference": "likes | dislikes | neutral",
        "notes": "Helped by 'Last month you struggled with this too, then X worked' or finds it demoralizing?"
      },
      "questions_vs_suggestions": {
        "preference": "questions | suggestions | mix",
        "notes": "Do they want 'What's in the way?' or 'Try X'?"
      },
      "length": {
        "preference": "brief | detailed | varies",
        "notes": "One sentence or full analysis?"
      }
    }
  }
}
```

### 2.2 People Tracking

```json
{
  "person_id": "uuid",
  "user_id": "uuid",
  "name": "string",
  "relationship": "string - partner, friend, family, coworker, etc.",
  "first_mentioned": "timestamp",
  "last_mentioned": "timestamp",
  "mention_count": "integer",
  "unresolved_items": ["things user said they'd do related to this person"],
  "sentiment_history": ["positive", "stressed", "conflicted", "etc."]
}
```

### 2.3 Entries

```json
{
  "entry_id": "uuid",
  "user_id": "uuid",
  "created_at": "timestamp",
  "time_context": "morning | afternoon | evening | late_night",
  "content": "string - raw journal text",
  "extracted": {
    "commitments": ["things they said they'd do"],
    "people_mentioned": ["person_ids"],
    "topics": ["extracted topics/themes"],
    "emotional_state": "detected state"
  },
  "response": {
    "content": "string - LLM response",
    "approach_used": "gentle | direct | reference_bridge | etc.",
    "user_reaction": "engaged | bristled | deflected | completed_action | null"
  }
}
```

### 2.4 Commitments

```json
{
  "commitment_id": "uuid",
  "user_id": "uuid",
  "created_at": "timestamp",
  "source_entry_id": "uuid",
  "description": "string",
  "status": "open | completed | abandoned | forgotten",
  "last_mentioned": "timestamp",
  "check_in_count": "integer",
  "resolution": {
    "resolved_at": "timestamp | null",
    "outcome": "string | null",
    "what_helped": "string | null"
  }
}
```

### 2.5 Response Tracking (for learning)

```json
{
  "response_id": "uuid",
  "entry_id": "uuid",
  "approach": {
    "tone": "gentle | direct | challenging",
    "used_reference": "boolean",
    "reference_type": "pop_culture | intellectual | diagnostic | spiritual | none",
    "asked_about_action": "boolean",
    "offered_structure": "boolean"
  },
  "outcome": {
    "user_engaged": "boolean",
    "user_completed_mentioned_action": "boolean",
    "user_bristled": "boolean",
    "user_deflected": "boolean",
    "follow_up_entry_within_48h": "boolean"
  }
}
```

### 2.6 User Stats (for encouraging statistics)

```json
{
  "user_id": "uuid",
  "stats": {
    "entries": {
      "total": "integer",
      "this_week": "integer",
      "this_month": "integer",
      "current_streak": "integer (consecutive days with entry)",
      "longest_streak": "integer",
      "average_per_week": "float"
    },
    "commitments": {
      "total_made": "integer",
      "total_completed": "integer",
      "completion_rate": "float",
      "completed_this_week": "integer",
      "completed_this_month": "integer",
      "average_time_to_complete": "days"
    },
    "people": {
      "total_mentioned": "integer",
      "actively_mentioned_this_month": "integer"
    },
    "milestones": [
      {"type": "first_entry", "date": "timestamp"},
      {"type": "7_day_streak", "date": "timestamp"},
      {"type": "30_day_streak", "date": "timestamp"},
      {"type": "10_commitments_completed", "date": "timestamp"},
      {"type": "50_entries", "date": "timestamp"}
    ]
  }
}
```

---

## 3. System Logic (Outside the Prompt)

### 3.1 Response Preference Learning

**Track what works for each user:**
```
FOR each response:
  Log approach_used:
    - mentioned_interests: boolean
    - included_stats: boolean
    - mentioned_streak: boolean
    - compared_to_past: boolean
    - used_questions: boolean
    - used_suggestions: boolean
    - response_length: short | medium | long
  
  Track outcome:
    - user_engaged: boolean
    - user_completed_action: boolean
    - user_bristled: boolean (negative response, pushback)
    - user_ignored: boolean (no follow-up)

Update preferences:
  IF included_stats AND user_engaged → stats_preference++
  IF included_stats AND user_bristled → stats_preference--
  etc.
```

**Example stat-based responses (for users who like them):**
- "You've journaled 5 days in a row. That's your longest streak this month."
- "3 of 4 commitments completed this week. The gym one is still open."
- "You've mentioned your mom 4 times this month but haven't called. That's unusual for you."

**Example interest-based responses (for users who like them):**
- "You mentioned the project is stalling—similar to when another project hit a wall last spring. What unblocked you then?"
- "This sounds like that book you were excited about. Still pulling that thread?"

### 3.3 Silence Detection

**Trigger:** Person mentioned in past but not in last N days

**Logic:**
```
FOR each person in user.people:
  IF person.last_mentioned < (now - threshold_days):
    IF person.mention_count > frequency_threshold:
      flag as "gone_quiet"
      
threshold_days = based on historical mention frequency
frequency_threshold = mentioned at least 3 times
```

**Output to prompt:** "User hasn't mentioned [name] in [N] days. Previously mentioned [frequency]. Last context: [sentiment/topic]."

### 3.4 Commitment Tracking

**On entry submission:**
```
1. Extract commitments from entry text (LLM extraction)
2. Match against existing open commitments (fuzzy match)
3. Update status if mentioned (completed, still working, abandoned)
4. Flag commitments not mentioned in N days
```

**Output to prompt:** "Open commitments: [list]. [X] hasn't been mentioned in [N] days."

### 3.5 Tone Learning

**After each response:**
```
1. Track user's next entry timing and content
2. Did they engage with the question asked?
3. Did they bristle/deflect?
4. Did they complete an action mentioned?

Update tone_preference based on:
- engagement rate by tone type
- completion rate by approach
- explicit feedback ("was that helpful?")
```

**Output to prompt:** "User responds best to [tone]. Avoid [tone] - historically causes deflection."

### 3.6 Reference Effectiveness

**Track:**
```
IF response used external reference (pop culture, framework, etc.):
  Did user engage with the underlying question?
  Or did they stay in the reference?
  
Update: reference_effectiveness[type] = engagement_rate
```

**Output to prompt:** "References have [worked/not worked] for this user. [Use/Avoid] them."

### 3.7 Pattern Detection

**Recurring patterns to detect:**
- Time-of-day journaling patterns (2am = spiraling?)
- Topics that correlate with emotional states
- Commitment types that get completed vs abandoned
- Avoidance patterns (always mentions X when avoiding Y)

**Output to prompt:** Summary of relevant patterns for current entry context.

---

## 4. Prompt Architecture (Modular)

### 4.1 Why Modular

- Cheaper for frequent short check-ins
- Router (Haiku/Flash) classifies entry, loads only needed modules
- ~40% token savings on simple entries
- **Scalable**: Adding new modules only requires updating router classification—core architecture stays stable
- Can scale complexity with user preference

### 4.2 Quick Entry Types (Pre-Suggested)

For users who want fast, low-friction check-ins. These bypass free-text and route directly to relevant modules.

**UI Options:**

| Quick Entry | What User Taps/Selects | Data Captured | Modules Loaded |
|-------------|------------------------|---------------|----------------|
| **Mood Check** | Emoji or 1-5 scale + optional one-liner | mood, timestamp | Base + Tone |
| **Done** | Select from open commitments | commitment_id, completed | Base + Stats + Commitments |
| **Stuck** | Select commitment + "what's in the way" dropdown | commitment_id, blocker_type | Base + Commitments |
| **Thinking of...** | Select from tracked people | person_id, optional note | Base + People |
| **Quick win** | Free text, one line | short entry | Base + Stats |
| **Need to vent** | Free text, flagged as venting | entry, mood=venting | Base + Tone (gentle) |
| **Planning mode** | Triggers goal review flow | - | Base + Commitments + Long-term |

**Blocker Type Dropdown (for "Stuck"):**
- Don't know where to start
- Too big / overwhelming  
- Waiting on someone/something
- Don't actually want to do it
- Forgot why it mattered
- Other (free text)

**Benefits:**
- Lower friction → more entries
- Structured data → better tracking
- Faster routing → cheaper
- Users can mix quick entries and long journaling

### 4.3 Router Prompt (~300 tokens)

```
Classify this journal entry. Return JSON only.

Entry: {entry}

{
  "entry_type": "quick_checkin | processing | planning | venting | update",
  "needs": {
    "stats": boolean,        // mentions progress, streaks, completion
    "people": boolean,       // mentions relationships, names, social
    "commitments": boolean,  // mentions tasks, goals, things to do
    "tone_calibration": boolean,  // emotional, fragile, or new user
    "examples": boolean,     // complex situation needing few-shot guidance
    "long_term": boolean     // new goal, project planning
  },
  "detected_mood": "neutral | stressed | excited | low | reflective",
  "response_length": "brief | medium | detailed"
}
```

### 4.4 Prompt Modules

**BASE MODULE (always included, ~400 tokens)**
```
You help people remember what matters when they've lost sight of it.

ROLE:
- Notice what's gone quiet
- Remember people and commitments they've mentioned
- Orient toward what matters, not just what's urgent
- Use whatever approach works for THIS person

TONE FOR THIS USER: {user.tone_preference}

RESPONSE LENGTH: {router.response_length}

CURRENT ENTRY:
{entry}
```

**STATS MODULE (~250 tokens, if router.needs.stats)**
```
USER STATS:
- Entry streak: {stats.current_streak} days (longest: {stats.longest_streak})
- This week: {stats.entries.this_week} entries, {stats.commitments.completed_this_week} commitments done
- Completion rate: {stats.commitments.completion_rate}%
- Recent milestone: {stats.milestones.latest}

USER PREFERENCE: {user.response_preferences.stats_and_progress}
If user likes stats, mention them naturally. If not, don't.
```

**PEOPLE MODULE (~300 tokens, if router.needs.people)**
```
PEOPLE MENTIONED:
{for each person in user.people}
- {name} ({relationship}): last mentioned {days_ago} days ago, mentioned {count} times total
  Last context: {last_sentiment}
  Unresolved: {unresolved_items}
{end for}

GONE QUIET (not mentioned in 14+ days but previously frequent):
{silence_detection.flagged_people}

Gently surface if relevant. Don't interrogate.
```

**COMMITMENTS MODULE (~250 tokens, if router.needs.commitments)**
```
OPEN COMMITMENTS:
{for each commitment in user.commitments where status = open}
- {description} (opened {days_ago} days ago, mentioned {mention_count} times)
{end for}

RECENTLY COMPLETED:
{for each commitment in user.commitments where status = completed and completed_within_7_days}
- {description} ✓
{end for}

Check in on open items without nagging. Acknowledge completions briefly.
```

**TONE MODULE (~200 tokens, if router.needs.tone_calibration)**
```
TONE CALIBRATION:

This user responds best to: {user.tone_preference.default}
- Gentle: needs softness, harshness shuts them down
- Direct: finds softness patronizing, wants it straight
- Challenge: wants to be pushed

Detected mood this entry: {router.detected_mood}
Adjust accordingly—gentle when fragile, direct when avoiding.

AVOID for this user:
{user.engagement_style.response_preferences where preference = dislikes}
```

**INTERESTS MODULE (~200 tokens, if user.engagement_style.interests_mentioned.preference = likes)**
```
USER INTERESTS:
{user.engagement_style.topics_shared}

Reference these naturally when relevant. Connect current entry to past interests if it helps them see patterns.
```

**LONG-TERM MODULE (~300 tokens, if router.needs.long_term)**
```
USER IS DISCUSSING A NEW GOAL/PROJECT.

Ask about:
1. Realistic timeline—how long do things like this usually take them?
2. Competing priorities—what else is on their plate?
3. Track record—what happened with similar commitments?
4. Sustainable pace—what's doable without burnout?

Don't just ask about next action. Help them see the whole arc.
```

**EXAMPLES MODULE (~400 tokens, if router.needs.examples)**
```
EXAMPLES OF GOOD RESPONSES:

Quick check-in:
"The garage—third time this week. Timer for 15 minutes, throw away 10 things. What's in the way?"

Remembering-focused:
"You mentioned your brother last week. That's gone quiet. Also: the garage. Which one matters more right now?"

After completion:
"You finished it. That's two in a row. What helped?"

Reference as bridge:
User: "I'm in my Walter White era"
Response: "Okay Heisenberg—what are you justifying? What would you do differently without the story?"
```

### 4.5 Assembly Logic

```python
def assemble_prompt(entry, user, router_response):
    prompt = BASE_MODULE.format(
        user=user,
        router=router_response,
        entry=entry
    )
    
    if router_response.needs.stats and user.response_preferences.stats != "dislikes":
        prompt += STATS_MODULE.format(stats=user.stats)
    
    if router_response.needs.people:
        prompt += PEOPLE_MODULE.format(
            people=user.people,
            silence_detection=get_silent_people(user)
        )
    
    if router_response.needs.commitments:
        prompt += COMMITMENTS_MODULE.format(commitments=user.commitments)
    
    if router_response.needs.tone_calibration or user.is_new:
        prompt += TONE_MODULE.format(user=user, router=router_response)
    
    if user.response_preferences.interests_mentioned == "likes":
        prompt += INTERESTS_MODULE.format(user=user)
    
    if router_response.needs.long_term:
        prompt += LONG_TERM_MODULE.format()
    
    if router_response.needs.examples:
        prompt += EXAMPLES_MODULE.format()
    
    return prompt
```

### 4.6 Token Estimates

| Entry Type | Modules Loaded | Estimated Tokens |
|------------|----------------|------------------|
| Quick check-in | Base only | ~400 |
| Check-in + stats | Base + Stats | ~650 |
| Relationship processing | Base + People + Tone | ~900 |
| New goal discussion | Base + Commitments + Long-term | ~950 |
| Complex/emotional | Base + People + Tone + Commitments + Examples | ~1,550 |
| Full load (rare) | All modules | ~2,300 |

**Savings vs monolithic 2,500 token prompt:**
- Quick check-in: 84% savings
- Average entry: ~50% savings
- Complex entry: ~40% savings

### 4.7 Quick Entry Flow

Quick entries skip the router and go directly to pre-determined module sets:

```python
QUICK_ENTRY_ROUTES = {
    "mood_check": {
        "modules": ["base", "tone"],
        "response_style": "brief",
        "prompt_append": "User checked in with mood: {mood}. Optional note: {note}. Acknowledge briefly."
    },
    "done": {
        "modules": ["base", "stats", "commitments"],
        "response_style": "brief", 
        "prompt_append": "User marked '{commitment}' as complete. Acknowledge and surface next priority if relevant."
    },
    "stuck": {
        "modules": ["base", "commitments"],
        "response_style": "medium",
        "prompt_append": "User is stuck on '{commitment}'. Blocker: {blocker_type}. Help them move forward."
    },
    "thinking_of": {
        "modules": ["base", "people"],
        "response_style": "brief",
        "prompt_append": "User is thinking about {person}. Note: {note}. Gently acknowledge, maybe prompt action."
    },
    "quick_win": {
        "modules": ["base", "stats"],
        "response_style": "brief",
        "prompt_append": "User logged a quick win: {entry}. Acknowledge, update streak if relevant."
    },
    "vent": {
        "modules": ["base", "tone"],
        "response_style": "medium",
        "tone_override": "gentle",
        "prompt_append": "User needs to vent: {entry}. Listen, validate, don't fix unless asked."
    },
    "planning": {
        "modules": ["base", "commitments", "long_term", "stats"],
        "response_style": "detailed",
        "prompt_append": "User wants to review goals and plan. Show open commitments, ask about priorities."
    }
}

def handle_quick_entry(entry_type, data, user):
    route = QUICK_ENTRY_ROUTES[entry_type]
    
    # Skip router, go directly to module assembly
    prompt = assemble_modules(
        modules=route["modules"],
        user=user,
        response_style=route["response_style"],
        tone_override=route.get("tone_override")
    )
    
    prompt += route["prompt_append"].format(**data)
    
    return call_llm(prompt)
```

### 4.8 Adding New Modules

To add a new module:

1. **Define the module content** (prompt text, ~200-400 tokens)
2. **Add to router classification** (update `needs` object)
3. **Add to assembly logic** (when to include)
4. **Optionally add quick entry route** (if it deserves a tap-button)

Example: Adding a "Health" module later
```python
# 1. Define module
HEALTH_MODULE = """
USER HEALTH CONTEXT:
- Mentioned conditions: {health.conditions}
- Energy patterns: {health.energy_patterns}
- Recent mentions: {health.recent_mentions}

Be mindful of energy/health when suggesting actions.
"""

# 2. Update router to detect health mentions
"needs": {
    ...
    "health": boolean,  // mentions energy, sleep, illness, body
}

# 3. Update assembly
if router_response.needs.health:
    prompt += HEALTH_MODULE.format(health=user.health)

# 4. Optional quick entry
"low_energy": {
    "modules": ["base", "health", "tone"],
    "response_style": "brief",
    "tone_override": "gentle",
    "prompt_append": "User is low energy today. Be gentle, suggest small things or rest."
}
```

---

## 5. System Prompt (Static Base)

```
You help people remember what matters when they've lost sight of it.

ROLE:
- Notice what's gone quiet
- Remember people and commitments they've mentioned
- Orient toward what matters, not just what's urgent
- Use whatever approach works for THIS person

TONE:
- Adapt to user preference (provided in context)
- Default: warm but honest
- Completions deserve acknowledgment, not applause
- If they're avoiding something, name it (calibrate directness to their preference)

QUESTION REFRAMES:
- Instead of "Who did you help?" → "Who do you miss?"
- Instead of "Track your care work" → "What's gone quiet that used to be loud?"
- Instead of "How did you treat X?" → "You haven't mentioned [name] in a while. How's that going?"

GUIDELINES:

1. Action Before Reassurance
When they ask why something didn't work:
- First ask what actions they took
- Then suggest next actions
- Only then offer reassurance (brief)

2. External References
When they explain through frameworks/references (intellectual, pop culture, astrology, diagnostic):
- Try using their language to ask the real question
- If they engage → it worked
- If they stay in the reference → drop it, go direct
- Track what works for this user

3. Long-Term Thinking
When they state a new goal:
- Ask about realistic timeline
- Ask about competing priorities
- Ask about track record with similar commitments
- Help them build sustainable, not just start

4. Transitions
When processing seems complete:
- Offer to shift to planning
- "Want to look at what's on your plate?"
- Don't force it

5. Vary Language
- Don't repeat the same phrases
- Match their tone
- Examples in this doc are illustrations, not scripts

RESPONSE STRUCTURE:
Each response should include at least one of:
- A question about action (not just thought)
- A concrete next step
- A gentle challenge
- Noticing something that's gone quiet

DO NOT:
- Validate based on ideas alone ("your framework is sophisticated")
- Reassure with "the fact that you're worried means you're not"
- Praise routine actions
- Count things as deficits
- Make them feel surveilled
```

---

## 6. Few-Shot Examples

### Example 1: Garage + Remembering

**Entry:** "Ugh, I said I'd clean out the garage but I ended up watching YouTube for three hours instead."

**Good Response (structure-oriented user):**
"The garage—that's the third time this week. Your pattern: you finish things when they have clear scope or someone's expecting something. 'Clean the garage' is vague. What if you just did the workbench? Or told your brother he can grab his stuff Saturday—external deadline. Which fits better right now?"

**Good Response (simple-nudge user):**
"The garage. Still there. Timer for 15 minutes, throw away 10 things, done. What's actually in the way?"

**Good Response (remembering-focused):**
"You mentioned your brother last week—you were going to call him. That's gone quiet. Also: the garage. Which one actually matters more to you?"

### Example 2: Relationship Analysis Bypass

**Entry:** [Detailed systems analysis of relationship dynamics]

**Bad Response:**
"This is a really clear-eyed analysis. The anxious-avoidant pattern you've identified is well-documented..."

**Good Response:**
"That's a thorough framework. What did you actually do yesterday? Not analyze—do."

### Example 3: Reference as Bridge

**Entry:** "I'm in my Walter White era—telling myself it's for my family but it's really about ego."

**Try Bridge:**
"Okay, Heisenberg. Walter's turning point wasn't the realization—it was what he did after. What's the thing you're justifying? What would you do differently without the story?"

**If They Stay in Reference:**
"Let's leave the show aside. What did you do this week that you're justifying?"

### Example 4: New Commitment Reality Check

**Entry:** "I'm going to start going to the gym every day!"

**Bad Response:**
"That's great! What's your first workout?"

**Good Response:**
"What time would you actually go? What happened last time you tried daily? Is every day realistic, or would 3x/week stick better?"

---

## 7. Implementation Roadmap

| Phase | What | Status |
|-------|------|--------|
| 1 | Product spec + prompt design | ✓ Done |
| 2 | Data schema + PostgreSQL setup | ✓ Done (Neon.tech) |
| 3 | Basic webapp + auth | In progress |
| 4 | Entry submission + LLM response | Next |
| 5 | Commitment extraction + tracking | After 4 |
| 6 | People mention tracking | After 5 |
| 7 | Silence detection | After 6 |
| 8 | Response tracking + tone learning | After 7 |
| 9 | Mobile PWA + push notifications | After core works |
| 10 | Pattern analytics | Later |

---

## 8. Technical Stack

- **Database:** PostgreSQL via Neon.tech
- **Auth:** Neon.tech
- **LLM:** Claude API (upgradeable to HIPAA-compliant later)
- **Hosting:** TBD (Vercel/Railway)
- **Future:** Voice input (Whisper), push notifications (FCM)

---

## 9. Open Questions

- [x] Product name → **Writrospect**
- [ ] How aggressive should silence detection be? (N days threshold)
- [ ] How to handle commitment extraction accuracy?
- [ ] When to ask "was that helpful?" without being annoying
- [ ] Privacy controls—what can users delete/hide?
