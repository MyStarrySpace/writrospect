/**
 * Add items in various states + pattern insight data
 * Run: npx tsx scripts/add-varied-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const userId = "cmiqhp2me0000c0csmplhzzpm";

function daysAgo(n: number, hours = 12, minutes = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function main() {
  // ── More habits in different states ──
  console.log("=== Adding habits in varied states ===");
  const newHabits = [
    {
      what: "Go for a walk every morning before checking my phone",
      why: "Reset the morning pattern. phone first thing puts me in reactive mode.",
      status: "paused" as const,
      outcome: "Did it for two weeks then fell off when it got cold. want to restart in spring.",
      createdAt: daysAgo(20),
    },
    {
      what: "Read one paper per week outside my field",
      why: "Cross-pollination. best ideas come from connecting different domains.",
      status: "active" as const,
      createdAt: daysAgo(12),
    },
    {
      what: "Stop saying 'sorry' when I mean 'thank you'",
      why: "Noticed I apologize for existing. 'sorry for the wait' vs 'thanks for your patience' hits different.",
      status: "active" as const,
      createdAt: daysAgo(8),
    },
    {
      what: "Write down one thing that went well each day",
      why: "Counterbalance the negativity bias. I notice problems way more than wins.",
      status: "abandoned" as const,
      outcome: "Felt forced and artificial. journaling naturally covers this better.",
      learned: "Structured gratitude exercises don't work for me. free-form reflection does.",
      createdAt: daysAgo(25),
    },
    {
      what: "Cook at least twice a week instead of ordering",
      why: "Saves money and I actually enjoy it when I do it.",
      status: "active" as const,
      createdAt: daysAgo(9),
    },
    {
      what: "Meditate for 10 minutes daily",
      why: "Everyone says it helps. wanted to see for myself.",
      status: "abandoned" as const,
      outcome: "Tried for three weeks. made me more anxious, not less. sitting still with my thoughts is not the move for me right now.",
      learned: "Not every evidence-based intervention works for every person. walking works better for me as a reset.",
      createdAt: daysAgo(30),
    },
    {
      what: "Take Abby to the dog park on weekends",
      why: "She needs socialization and I need to get outside.",
      status: "active" as const,
      createdAt: daysAgo(6),
    },
  ];

  for (const h of newHabits) {
    await prisma.habit.create({
      data: {
        userId,
        what: h.what,
        why: h.why,
        status: h.status,
        outcome: h.outcome ?? null,
        learned: h.learned ?? null,
        createdAt: h.createdAt,
        updatedAt: daysAgo(0),
      },
    });
    console.log(`  [${h.status}] ${h.what.substring(0, 50)}`);
  }

  // ── More tasks in different states ──
  console.log("\n=== Adding tasks in varied states ===");
  const newTasks = [
    {
      what: "Email professor about independent study credit for Lanmaoa research",
      context: "Worth asking. worst case they say no.",
      status: "deferred" as const,
      urgency: "this_week" as const,
      deferredTo: daysAgo(-7), // next week
      createdAt: daysAgo(6),
    },
    {
      what: "Fix the sidebar scroll bug on mobile",
      context: "Writrospect. sidebar doesn't scroll when there are too many nav items on small screens.",
      status: "completed" as const,
      urgency: "today" as const,
      outcome: "Added overflow-y-auto. took 5 minutes, had been bugging me for days.",
      completedAt: daysAgo(3, 15, 20),
      createdAt: daysAgo(5),
    },
    {
      what: "Cancel old gym membership",
      context: "Still paying $30/month for a gym I haven't been to in 3 months.",
      status: "skipped" as const,
      urgency: "this_week" as const,
      skippedReason: "Tried to cancel online but they require a phone call during business hours. will try again.",
      createdAt: daysAgo(10),
    },
    {
      what: "Back up photos from old phone",
      context: "Old phone is dying. photos from last 2 years need to be saved.",
      status: "pending" as const,
      urgency: "this_week" as const,
      createdAt: daysAgo(4),
    },
    {
      what: "Send mom the crab rangoon recipe",
      context: "She asked for it after I told her about the air fryer discovery.",
      status: "completed" as const,
      urgency: "today" as const,
      outcome: "Texted her the recipe. she's skeptical about the freezing trick.",
      completedAt: daysAgo(0, 13, 45),
      createdAt: daysAgo(1, 10),
    },
    {
      what: "Look into whether NLRP3 inhibitors affect Lilliputian hallucinations",
      context: "If the inflammasome model is right, existing NLRP3 inhibitors should prevent the hallucinations. this would be the strongest test.",
      status: "pending" as const,
      urgency: "whenever" as const,
      createdAt: daysAgo(3),
    },
    {
      what: "Schedule vet appointment for Abby",
      context: "Due for her 6-month checkup and shots.",
      status: "pending" as const,
      urgency: "this_week" as const,
      createdAt: daysAgo(2),
    },
    {
      what: "Research air fryer recipes",
      context: "Crab rangoons were a hit. what else can I air fry?",
      status: "completed" as const,
      urgency: "whenever" as const,
      outcome: "Found a bunch. trying mozzarella sticks next.",
      completedAt: daysAgo(0, 21, 30),
      createdAt: daysAgo(1),
    },
    {
      what: "Reply to Free Thinker Institute email about next meeting topic",
      status: "skipped" as const,
      urgency: "today" as const,
      skippedReason: "Missed the deadline. they already picked a topic.",
      createdAt: daysAgo(7),
    },
  ];

  for (const t of newTasks) {
    await prisma.task.create({
      data: {
        userId,
        what: t.what,
        context: t.context ?? null,
        status: t.status,
        urgency: t.urgency,
        outcome: t.outcome ?? null,
        skippedReason: t.skippedReason ?? null,
        deferredTo: t.deferredTo ?? null,
        completedAt: t.completedAt ?? null,
        createdAt: t.createdAt,
        updatedAt: t.completedAt ?? t.createdAt,
      },
    });
    console.log(`  [${t.status}/${t.urgency}] ${t.what.substring(0, 50)}`);
  }

  // ── Goals in different states ──
  console.log("\n=== Adding goals in varied states ===");
  const newGoals = [
    {
      title: "Learn to be okay with 'good enough'",
      description: "Stop perfectionism from blocking progress. ship things before they're perfect.",
      why: "I abandon too many projects because they don't meet my impossible standards. done is better than perfect.",
      obstacle: "Deeply ingrained belief that anything less than excellent is failure.",
      status: "active" as const,
      progress: 30,
      createdAt: daysAgo(14),
    },
    {
      title: "Finish Article 3 revision",
      description: "Address the 'no people' blind spot in the urban design piece.",
      status: "completed" as const,
      progress: 100,
      outcome: "Published the revision. feedback was positive, especially the part about human-scale design.",
      learned: "Getting external feedback earlier would have caught the blind spot sooner.",
      createdAt: daysAgo(22),
    },
    {
      title: "Start a daily meditation practice",
      description: "Build a consistent 10-minute meditation habit.",
      status: "abandoned" as const,
      progress: 15,
      outcome: "Tried for 3 weeks. sitting meditation increased my anxiety rather than reducing it.",
      learned: "Walking and cooking work better as my mindfulness practice. not every tool fits every person.",
      createdAt: daysAgo(30),
    },
  ];

  for (const g of newGoals) {
    await prisma.goal.create({
      data: {
        userId,
        title: g.title,
        description: g.description,
        why: g.why ?? null,
        obstacle: g.obstacle ?? null,
        status: g.status,
        progress: g.progress,
        outcome: g.outcome ?? null,
        learned: g.learned ?? null,
        createdAt: g.createdAt,
        updatedAt: daysAgo(0),
      },
    });
    console.log(`  [${g.status} ${g.progress}%] ${g.title}`);
  }

  // ── More journal entries with conditions for pattern data ──
  console.log("\n=== Adding entries with condition data ===");
  const now = new Date();
  const conditionEntries = [
    {
      daysAgo: 3,
      hours: 23,
      minutes: 45,
      timeContext: "late_night" as const,
      entryType: "general" as const,
      content: "can't sleep. brain won't shut off. keep thinking about the monocyte iron idea and whether there's a way to do a pilot study without needing a full lab. maybe flow cytometry on banked samples? someone must have monocyte samples from AD cohorts sitting in a freezer somewhere.",
      conditionsPresent: ["restless", "creative", "can't sleep"],
      reflections: ["flow cytometry on banked AD monocyte samples"],
    },
    {
      daysAgo: 6,
      hours: 9,
      minutes: 15,
      timeContext: "morning" as const,
      entryType: "mood_check" as const,
      moodScore: 4,
      content: "good morning, feeling rested for once. slept a full 8 hours which almost never happens. going to try to ride this energy into productive work before it fades.",
      conditionsPresent: ["well-rested", "energized", "motivated"],
      reflections: ["sleep quality directly affects motivation"],
    },
    {
      daysAgo: 7,
      hours: 22,
      minutes: 30,
      timeContext: "evening" as const,
      entryType: "vent" as const,
      moodScore: 2,
      content: "frustrated. spent 3 hours trying to fix a CSS bug that turned out to be a missing semicolon. I know intellectually that this is normal but in the moment it feels like evidence that I'm bad at this. the inner critic is loud today.",
      conditionsPresent: ["frustrated", "tired", "self-critical"],
      reflections: ["inner critic gets louder when tired", "debugging frustration is normal"],
    },
    {
      daysAgo: 9,
      hours: 14,
      minutes: 20,
      timeContext: "afternoon" as const,
      entryType: "quick_win" as const,
      moodScore: 5,
      content: "just solved a problem I've been stuck on for days. the trick was stepping away and cooking lunch. came back and saw it immediately. brains are weird.",
      conditionsPresent: ["energized", "accomplished", "creative"],
      reflections: ["stepping away from problems helps solve them", "breaks are productive"],
    },
    {
      daysAgo: 11,
      hours: 1,
      minutes: 10,
      timeContext: "late_night" as const,
      entryType: "thinking_of" as const,
      content: "reading about how the gut microbiome affects mood and suddenly connecting it to the Lanmaoa work. what if the reason the inflammasome model works is because Lanmaoa specifically disrupts the gut-brain axis in a predictable way? the endosymbiont isn't random. it's exploiting a communication channel that already exists.",
      conditionsPresent: ["creative", "focused", "can't sleep"],
      reflections: ["gut-brain axis as pre-existing communication channel", "late night research rabbit holes"],
    },
  ];

  for (const entry of conditionEntries) {
    const entryDate = new Date(now);
    entryDate.setDate(entryDate.getDate() - entry.daysAgo);

    await prisma.journalEntry.create({
      data: {
        userId,
        date: new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate()),
        time: new Date(1970, 0, 1, entry.hours, entry.minutes),
        timeContext: entry.timeContext,
        content: entry.content,
        entryType: entry.entryType,
        moodScore: entry.moodScore ?? null,
        reflections: entry.reflections,
        conditionsPresent: entry.conditionsPresent,
        createdAt: new Date(
          entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate(),
          entry.hours, entry.minutes
        ),
        updatedAt: new Date(
          entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate(),
          entry.hours, entry.minutes
        ),
      },
    });
    console.log(`  [${entry.entryType}] ${entry.content.substring(0, 50)}...`);
  }

  // ── Add more people ──
  console.log("\n=== Adding people ===");
  await prisma.person.upsert({
    where: { userId_name: { userId, name: "Mom" } },
    create: {
      userId, name: "Mom", relationship: "family",
      notes: "Skeptical of the freezing trick. asked for crab rangoon recipe.",
      mentionCount: 2, lastMentioned: daysAgo(0),
    },
    update: { mentionCount: 2, lastMentioned: daysAgo(0) },
  });
  console.log("  Upserted: Mom");

  // ── Add more response tracking for pattern data ──
  console.log("\n=== Adding more response tracking ===");
  const moreFeedback = [
    { feedback: "helpful" as const, responseLength: 180, containedQuestion: false, containedAdvice: false, containedEmpathy: true, timeContext: "late_night" as const, createdAt: daysAgo(3) },
    { feedback: "helpful" as const, responseLength: 250, containedQuestion: true, containedAdvice: false, containedEmpathy: false, timeContext: "late_night" as const, createdAt: daysAgo(11) },
    { feedback: "too_long" as const, responseLength: 750, containedQuestion: true, containedAdvice: true, containedEmpathy: true, timeContext: "afternoon" as const, createdAt: daysAgo(6) },
    { feedback: "helpful" as const, responseLength: 150, containedQuestion: false, containedAdvice: false, containedEmpathy: false, timeContext: "morning" as const, createdAt: daysAgo(9) },
    { feedback: "helpful" as const, responseLength: 300, containedQuestion: true, containedAdvice: false, containedEmpathy: true, timeContext: "evening" as const, createdAt: daysAgo(7) },
    { feedback: "not_helpful" as const, responseLength: 500, containedQuestion: false, containedAdvice: true, containedEmpathy: false, timeContext: "morning" as const, createdAt: daysAgo(14) },
  ];

  for (const f of moreFeedback) {
    await prisma.responseTracking.create({
      data: {
        userId,
        messageId: "msg_" + Math.random().toString(36).substring(2, 10),
        ...f,
      },
    });
  }
  console.log(`  Added ${moreFeedback.length} response tracking entries`);

  // ── Final counts ──
  const counts = await Promise.all([
    prisma.habit.count({ where: { userId } }),
    prisma.habit.count({ where: { userId, status: "active" } }),
    prisma.habit.count({ where: { userId, status: "completed" } }),
    prisma.habit.count({ where: { userId, status: "paused" } }),
    prisma.habit.count({ where: { userId, status: "abandoned" } }),
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, status: "pending" } }),
    prisma.task.count({ where: { userId, status: "completed" } }),
    prisma.task.count({ where: { userId, status: "skipped" } }),
    prisma.task.count({ where: { userId, status: "deferred" } }),
    prisma.goal.count({ where: { userId } }),
    prisma.goal.count({ where: { userId, status: "active" } }),
    prisma.goal.count({ where: { userId, status: "completed" } }),
    prisma.goal.count({ where: { userId, status: "abandoned" } }),
    prisma.strategy.count({ where: { userId } }),
    prisma.journalEntry.count({ where: { userId } }),
    prisma.person.count({ where: { userId } }),
  ]);

  console.log("\n=== Final counts ===");
  console.log(`  Habits: ${counts[0]} (active: ${counts[1]}, completed: ${counts[2]}, paused: ${counts[3]}, abandoned: ${counts[4]})`);
  console.log(`  Tasks: ${counts[5]} (pending: ${counts[6]}, completed: ${counts[7]}, skipped: ${counts[8]}, deferred: ${counts[9]})`);
  console.log(`  Goals: ${counts[10]} (active: ${counts[11]}, completed: ${counts[12]}, abandoned: ${counts[13]})`);
  console.log(`  Strategies: ${counts[14]}`);
  console.log(`  Journal entries: ${counts[15]}`);
  console.log(`  People: ${counts[16]}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
