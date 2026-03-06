# Implementation Plan: Habits Rename, Goal Obstacles, Check-in Mode

**Date:** 2026-02-03
**Status:** Partially Complete

---

## Overview

Four changes to implement:
1. Rename "Commitments" to "Habits" throughout the codebase
2. Add optional "obstacle" field to Goals (WOOP/MCII framework)
3. Add "What's the ONE thing?" prompt for cognitive overload detection
4. **NEW:** Add check-in mode to AI chatbot startup with quick-action buttons

---

## Change 1: Rename "Commitments" to "Habits"

### Files to Modify (13 files)

**Database & API:**
- `prisma/schema.prisma` - Rename model/enum, update relations
- `src/app/api/commitments/route.ts` → `src/app/api/habits/route.ts`
- `src/app/api/commitments/[id]/route.ts` → `src/app/api/habits/[id]/route.ts`

**UI Components:**
- `src/app/(auth)/commitments/page.tsx` → `src/app/(auth)/habits/page.tsx`
- `src/components/commitments/` → `src/components/habits/` (3 files)
- `src/hooks/useCommitments.ts` → `src/hooks/useHabits.ts`
- `src/components/layout/Sidebar.tsx` - Update nav link
- `src/app/(auth)/dashboard/page.tsx` - Update variable names

**AI & Prompts:**
- `src/lib/ai-tools/commitment-tools.ts` → `src/lib/ai-tools/habit-tools.ts`
- `src/lib/extraction/commitment-extractor.ts` → `src/lib/extraction/habit-extractor.ts`
- `src/lib/router.ts` - Update classification
- `src/lib/prompts/system-prompt.ts` - Update terminology

### Migration Strategy

```sql
ALTER TYPE "CommitmentStatus" RENAME TO "HabitStatus";
ALTER TABLE "Commitment" RENAME TO "Habit";
ALTER TABLE "Task" RENAME COLUMN "relatedCommitmentId" TO "relatedHabitId";
```

---

## Change 2: Add "obstacle" Field to Goals

### Files to Modify (7 files)

1. `prisma/schema.prisma` - Add `obstacle String? @db.Text`
2. `src/app/api/goals/route.ts` - Accept obstacle in POST
3. `src/app/api/goals/[id]/route.ts` - Accept obstacle in PATCH
4. `src/components/goals/GoalForm.tsx` - Add textarea field
5. `src/components/goals/GoalListItem.tsx` - Add to interface
6. `src/hooks/useGoals.ts` - Add to interfaces
7. `src/app/(auth)/goals/page.tsx` - Include in create/update

### UI Design

- **Label:** "What might get in the way? (optional)"
- **Placeholder:** "What inner or outer obstacles might block this goal?"
- **Position:** After the "Why" field

---

## Change 3: "What's the ONE thing?" Cognitive Overload

### Approach

Enhance the existing system prompt (lines 138-149) to be more directive:

```
Response to cognitive overload:
- IMMEDIATELY ask: "What's the ONE thing you could do in the next 10 minutes?"
- DO NOT create tasks when overload is detected
- Help them DEFER, not organize
```

Add `COGNITIVE_OVERLOAD_MODULE` to `src/lib/prompts/modules/index.ts` for explicit injection when overwhelm signals are detected.

---

## Change 4: Check-in Mode with Quick Actions (NEW)

### Concept

When the chat opens, the AI proactively enters "check-in mode":
1. Fetches pending tasks, active habits, and active goals
2. Presents each item with quick-action buttons
3. User can respond via click or keyboard shortcut (e.g., `Alt+1`, `Alt+2`)
4. Eliminates need to type status updates

### UI Design

```
Good morning! Let's do a quick check-in.

📋 TASKS DUE TODAY
┌─────────────────────────────────────────────────┐
│ Call doctor about appointment                   │
│ [1: Done ✓] [2: Skip] [3: Defer] [4: Update]    │
└─────────────────────────────────────────────────┘

🔄 HABIT CHECK-IN
┌─────────────────────────────────────────────────┐
│ Exercise 3x/week (1/3 this week)                │
│ [1: Did it ✓] [2: Missed] [3: Skip today]       │
└─────────────────────────────────────────────────┘

🎯 GOAL PROGRESS
┌─────────────────────────────────────────────────┐
│ Get healthier (40% progress)                    │
│ [1: Update progress] [2: Add note] [3: Skip]    │
└─────────────────────────────────────────────────┘
```

### Files to Create/Modify

**New Components:**
- `src/components/chat/CheckInCard.tsx` - Card with quick-action buttons
- `src/components/chat/CheckInMode.tsx` - Container for check-in flow

**Modify:**
- `src/app/(auth)/chat/page.tsx` - Initialize check-in mode on mount
- `src/app/api/chat/route.ts` - Add check-in mode context injection
- `src/lib/prompts/system-prompt.ts` - Add check-in mode instructions

**New API Endpoint:**
- `src/app/api/check-in/route.ts` - Fetch pending items for check-in

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Alt+1` | Primary action (Done/Did it/Update) |
| `Alt+2` | Secondary action (Skip/Missed) |
| `Alt+3` | Tertiary action (Defer/Skip today) |
| `Alt+4` | Additional action (Update/Note) |
| `Enter` | Move to next item |
| `Esc` | Exit check-in mode |

### Smart Check-in Triggering

The AI determines whether to trigger check-in based on these signals:

| Signal | Weight | Example |
|--------|--------|---------|
| Upcoming tasks (due today/tomorrow) | High | Task due in 2 hours |
| Overdue tasks | High | Task was due yesterday |
| Time since last check-in | Medium | No check-in in 24+ hours |
| Unused goals/strategies | Medium | Goal not updated in 7+ days |
| Relevant items in conversation | Low | User mentions related topic |

**Logic:** If weighted score exceeds threshold, inject check-in prompt.

### Smart Habit Scheduling

Habits are shown based on their frequency and last log:
- **Daily habits:** Show if not logged today
- **3x/week habits:** Show on Mon/Wed/Fri or if behind pace
- **Weekly habits:** Show if not logged this week
- **Custom frequency:** Calculate based on pattern

### Check-in Flow

1. **On chat load:** Evaluate check-in signals via `/api/check-in/evaluate`
2. **If triggered:** Fetch pending items and display check-in cards
3. **Display cards:** Show tasks (due/overdue), habits (smart-scheduled), goals (stale)
4. **User action:** Click button or use keyboard shortcut
5. **Process action:** Call appropriate API (update task status, log habit, etc.)
6. **Next item:** Auto-advance to next item or show summary
7. **Complete:** Transition to normal chat mode with context

### State Management

```typescript
interface CheckInState {
  mode: "active" | "complete" | "skipped";
  currentIndex: number;
  items: CheckInItem[];
  responses: CheckInResponse[];
}

interface CheckInItem {
  type: "task" | "habit" | "goal";
  id: string;
  title: string;
  context?: string; // e.g., "1/3 this week" or "40% progress"
  actions: QuickAction[];
}

interface QuickAction {
  key: number; // 1-4
  label: string;
  action: string; // "complete" | "skip" | "defer" | "update"
  icon?: string;
}
```

---

## Implementation Order

1. **Change 2: Goal obstacle field** (smallest, isolated) ✅ COMPLETE
2. **Change 3: Cognitive overload prompt** (prompt-only, low risk) ✅ COMPLETE
3. **Change 4: Check-in mode** (new feature, independent) ✅ COMPLETE
4. **Change 1: Habits rename** (largest, needs careful migration) ⏳ PENDING

---

## Verification

### Change 1 (Habits) - PENDING
- [ ] Database migration succeeds
- [ ] Create/update/delete habits works
- [ ] AI tools create habits correctly
- [ ] Navigation shows "Habits" link
- [ ] Dashboard shows habit stats

### Change 2 (Obstacle field) - IMPLEMENTED
- [x] Schema updated with obstacle field
- [x] API routes accept obstacle in POST/PATCH
- [x] Field displays in GoalForm
- [x] TypeScript types updated
- [ ] Run database migration when dev server stopped

### Change 3 (Cognitive overload) - IMPLEMENTED
- [x] COGNITIVE_OVERLOAD_MODULE added to modules
- [x] Detection logic in prompt-router.ts
- [x] Detects overload signals and long lists
- [ ] Test with overwhelmed messages

### Change 4 (Check-in mode) - IMPLEMENTED
- [x] /api/check-in endpoint with smart evaluation
- [x] CheckInCard component with quick actions
- [x] CheckInMode component with keyboard shortcuts
- [x] Integrated into ChatInterface
- [x] "Quick Check-in" button in journal page
- [ ] Test end-to-end flow

---

## Database Changes Summary

**Migration 1: Rename Commitment → Habit**
```sql
ALTER TYPE "CommitmentStatus" RENAME TO "HabitStatus";
ALTER TABLE "Commitment" RENAME TO "Habit";
ALTER TABLE "Task" RENAME COLUMN "relatedCommitmentId" TO "relatedHabitId";
```

**Migration 2: Add obstacle to Goal**
```sql
ALTER TABLE "Goal" ADD COLUMN "obstacle" TEXT;
```

**Migration 3: Add check-in tracking**
```sql
ALTER TABLE "User" ADD COLUMN "lastCheckIn" TIMESTAMP;
-- Or create dedicated CheckInLog table for history
```
