/**
 * Populate tasks, goals, habits, strategies, stats, and people
 * Run: npx tsx scripts/populate-data.ts
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
  // ── 1. Clean up duplicate habits ──
  console.log("=== Cleaning duplicate habits ===");
  const allHabits = await prisma.habit.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  // Keep first occurrence of similar habits, delete dupes
  const seen = new Set<string>();
  const toDelete: string[] = [];
  for (const h of allHabits) {
    const key = h.what.substring(0, 40).toLowerCase();
    if (seen.has(key)) {
      toDelete.push(h.id);
    } else {
      seen.add(key);
    }
  }
  // Also catch the near-duplicates by manual inspection
  const dupeKeywords = [
    "help friend's friend with light novel",
    "help friend's friend create light novel",
    "develop collaborative journal",
    "develop writing app with node",
  ];
  for (const h of allHabits) {
    const lower = h.what.toLowerCase();
    for (const kw of dupeKeywords) {
      if (lower.startsWith(kw) && !toDelete.includes(h.id)) {
        // Keep only the first one that matches
        const firstMatch = allHabits.find(
          (x) =>
            x.what.toLowerCase().startsWith(kw) && !toDelete.includes(x.id)
        );
        if (firstMatch && firstMatch.id !== h.id) {
          toDelete.push(h.id);
        }
      }
    }
  }

  if (toDelete.length > 0) {
    await prisma.habit.deleteMany({ where: { id: { in: toDelete } } });
    console.log(`  Deleted ${toDelete.length} duplicate habits`);
  }

  // ── 2. Clean up duplicate strategies ──
  console.log("=== Cleaning duplicate strategies ===");
  const allStrategies = await prisma.strategy.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const seenStrats = new Set<string>();
  const stratToDelete: string[] = [];
  for (const s of allStrategies) {
    const key = s.strategy.substring(0, 35).toLowerCase();
    if (seenStrats.has(key)) {
      stratToDelete.push(s.id);
    } else {
      seenStrats.add(key);
    }
  }
  // Near-dupe strategies
  const dupeStratKeywords = [
    "collaborative content extraction",
    "collaborative journaling",
    "node-based",
    "steelmanning research",
  ];
  for (const s of allStrategies) {
    const lower = s.strategy.toLowerCase();
    for (const kw of dupeStratKeywords) {
      if (lower.startsWith(kw) && !stratToDelete.includes(s.id)) {
        const firstMatch = allStrategies.find(
          (x) =>
            x.strategy.toLowerCase().startsWith(kw) &&
            !stratToDelete.includes(x.id)
        );
        if (firstMatch && firstMatch.id !== s.id) {
          stratToDelete.push(s.id);
        }
      }
    }
  }

  if (stratToDelete.length > 0) {
    await prisma.strategy.deleteMany({
      where: { id: { in: stratToDelete } },
    });
    console.log(`  Deleted ${stratToDelete.length} duplicate strategies`);
  }

  // ── 3. Update dates on remaining habits to be recent ──
  console.log("=== Updating habit dates ===");
  const remainingHabits = await prisma.habit.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  for (let i = 0; i < remainingHabits.length; i++) {
    const spread = 16 - Math.floor((i / Math.max(remainingHabits.length - 1, 1)) * 14);
    await prisma.habit.update({
      where: { id: remainingHabits[i].id },
      data: {
        createdAt: daysAgo(spread, 9 + (i % 12), (i * 17) % 60),
        updatedAt: daysAgo(Math.min(spread, 3), 10 + (i % 10), (i * 23) % 60),
      },
    });
  }
  console.log(`  Updated ${remainingHabits.length} habit dates`);

  // ── 4. Update strategy dates and mark some as worked/didn't ──
  console.log("=== Updating strategies ===");
  const remainingStrats = await prisma.strategy.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  for (let i = 0; i < remainingStrats.length; i++) {
    const spread = 14 - Math.floor((i / Math.max(remainingStrats.length - 1, 1)) * 12);
    // Mark some as worked, some as didn't, leave some null
    let worked: boolean | null = null;
    if (i % 4 === 0) worked = true;
    if (i % 4 === 2) worked = false;
    await prisma.strategy.update({
      where: { id: remainingStrats[i].id },
      data: {
        worked,
        timesTried: worked !== null ? 2 + (i % 3) : 1,
        createdAt: daysAgo(spread, 8 + (i % 14), (i * 13) % 60),
        updatedAt: daysAgo(Math.min(spread, 2), 11 + (i % 8), (i * 19) % 60),
        lastTried: daysAgo(Math.min(spread, 4)),
      },
    });
  }
  console.log(`  Updated ${remainingStrats.length} strategies`);

  // ── 5. Update existing task dates ──
  console.log("=== Updating task dates ===");
  const existingTasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  for (let i = 0; i < existingTasks.length; i++) {
    const spread = 10 - Math.floor((i / Math.max(existingTasks.length - 1, 1)) * 8);
    await prisma.task.update({
      where: { id: existingTasks[i].id },
      data: {
        createdAt: daysAgo(spread, 9 + (i * 3) % 12, (i * 17) % 60),
        updatedAt: daysAgo(Math.min(spread, 2)),
      },
    });
  }
  console.log(`  Updated ${existingTasks.length} task dates`);

  // ── 6. Add new tasks related to recent entries ──
  console.log("=== Adding new tasks ===");
  const newTasks = [
    {
      what: "Write up non-negotiables list",
      context: "From Worth Your Wild episode. actual boundaries, not aspirational ones.",
      status: "pending" as const,
      urgency: "this_week" as const,
      createdAt: daysAgo(5, 22, 10),
    },
    {
      what: "Write up size constancy mechanism for Lanmaoa paper",
      context: "The part connecting LGN dysfunction to specific visual phenomenology. this is the key prediction that makes the model testable.",
      status: "pending" as const,
      urgency: "this_week" as const,
      createdAt: daysAgo(4, 1, 45),
    },
    {
      what: "Search PubMed for monocyte iron compartmentalization in neurodegeneration",
      context: "Check if anyone has measured intracellular iron distribution in monocytes from AD patients. might already exist and I missed it.",
      status: "pending" as const,
      urgency: "whenever" as const,
      createdAt: daysAgo(2, 16, 0),
    },
    {
      what: "Look up Burkholderia lectin binding specificity papers",
      context: "Need to confirm which lectins Burkholderia endosymbionts produce and whether any bind gut macrophage receptors",
      status: "completed" as const,
      urgency: "whenever" as const,
      completedAt: daysAgo(3, 14, 30),
      createdAt: daysAgo(4, 2, 0),
    },
    {
      what: "Buy more wonton wrappers",
      context: "Used them all on the crab rangoons. need more for next batch.",
      status: "pending" as const,
      urgency: "whenever" as const,
      createdAt: daysAgo(1, 20, 15),
    },
    {
      what: "Move toilet paper to bathroom shelf",
      context: "Abby-proofing the apartment. nothing on the floor.",
      status: "completed" as const,
      urgency: "now" as const,
      completedAt: daysAgo(0, 11, 30),
      createdAt: daysAgo(0, 11, 20),
    },
  ];

  for (const t of newTasks) {
    await prisma.task.create({
      data: {
        userId,
        what: t.what,
        context: t.context,
        status: t.status,
        urgency: t.urgency,
        completedAt: t.completedAt ?? null,
        createdAt: t.createdAt,
        updatedAt: t.completedAt ?? t.createdAt,
      },
    });
    console.log(`  Created task: ${t.what}`);
  }

  // ── 7. Add goals ──
  console.log("=== Adding goals ===");
  const goals = [
    {
      title: "Publish Lanmaoa hypothesis paper",
      description:
        "Write up the gut-brain inflammasome model explaining Lilliputian hallucinations from Lanmaoa mushroom poisoning. need to cover the full causal chain from lectin to LGN to visual phenomenology.",
      why: "This is the first model I've found that explains all the clinical features without handwaving. if it holds up it could change how people think about these cases.",
      obstacle: "Might get bogged down in trying to make it perfect before sharing. also need to learn more about inflammasome signaling to not say something wrong.",
      status: "active" as const,
      progress: 35,
      createdAt: daysAgo(10),
    },
    {
      title: "Explore monocyte iron AD biomarker idea",
      description:
        "Investigate whether monocyte intracellular iron compartmentalization could serve as an early, cheap blood-based biomarker for Alzheimer's risk.",
      why: "Current blood biomarkers measure downstream cleanup. if iron dysregulation in monocytes precedes brain pathology, a $50 test could catch risk before PET scans see anything.",
      obstacle: "This might already exist and I just haven't found it. or the biology might not work the way I think it does. need to do a real lit review before getting too excited.",
      status: "active" as const,
      progress: 10,
      createdAt: daysAgo(2, 16),
    },
    {
      title: "Build Writrospect into something real",
      description:
        "Keep developing the accountability journal app. make it useful enough to actually use daily.",
      why: "I want a tool that helps me follow through on things, and building it myself means it actually fits how my brain works.",
      status: "active" as const,
      progress: 55,
      createdAt: daysAgo(16),
    },
    {
      title: "Figure out my non-negotiables",
      description:
        "Make an actual list of boundaries and standards that aren't up for negotiation. stop treating them like suggestions.",
      why: "I keep staying in situations because the familiar hard feels easier than the scary unknown. making these explicit might help.",
      obstacle:
        "I go back and forth on whether I deserve to enforce these. guilt about privilege.",
      status: "active" as const,
      progress: 15,
      createdAt: daysAgo(5, 22),
    },
    {
      title: "Get better at cooking",
      description: "Learn more recipes and actually cook regularly instead of defaulting to easy stuff.",
      why: "It's fun and the crab rangoons proved I can actually make good food when I try.",
      status: "active" as const,
      progress: 20,
      createdAt: daysAgo(8),
    },
  ];

  for (const g of goals) {
    await prisma.goal.create({
      data: {
        userId,
        title: g.title,
        description: g.description,
        why: g.why,
        obstacle: g.obstacle ?? null,
        status: g.status,
        progress: g.progress,
        createdAt: g.createdAt,
        updatedAt: daysAgo(0),
      },
    });
    console.log(`  Created goal: ${g.title} (${g.progress}%)`);
  }

  // ── 8. Add new strategies ──
  console.log("=== Adding new strategies ===");
  const newStrategies = [
    {
      strategy: "Writing late at night when the ideas are flowing instead of forcing morning work",
      context: "Research writing and hypothesis development. the Lanmaoa breakthrough happened at 1am.",
      worked: true,
      timesTried: 4,
      createdAt: daysAgo(6),
    },
    {
      strategy: "Freezing food before cooking for better texture",
      context: "Crab rangoons came out crispier when frozen first. worth trying with other fried foods.",
      worked: true,
      timesTried: 1,
      createdAt: daysAgo(1),
    },
    {
      strategy: "Listening to podcasts for personal development instead of just reading",
      context: "Worth Your Wild episode hit harder than articles on the same topic. something about hearing real people talk through it.",
      worked: true,
      timesTried: 3,
      createdAt: daysAgo(7),
    },
    {
      strategy: "Puppy-proofing by removing temptations from floor level",
      context: "Abby will shred anything on the floor. prevention beats cleanup.",
      worked: true,
      timesTried: 2,
      createdAt: daysAgo(0, 11, 30),
    },
  ];

  for (const s of newStrategies) {
    await prisma.strategy.create({
      data: {
        userId,
        strategy: s.strategy,
        context: s.context,
        worked: s.worked,
        timesTried: s.timesTried,
        lastTried: daysAgo(0),
        createdAt: s.createdAt,
        updatedAt: daysAgo(0),
      },
    });
    console.log(`  Created strategy: ${s.strategy.substring(0, 50)}...`);
  }

  // ── 9. Add/update people ──
  console.log("=== Adding people ===");
  // Boyfriend
  await prisma.person.upsert({
    where: { userId_name: { userId, name: "Boyfriend" } },
    create: {
      userId,
      name: "Boyfriend",
      relationship: "partner",
      notes: "Lives together. Mentioned in puppy entry.",
      mentionCount: 3,
      lastMentioned: daysAgo(0),
    },
    update: {
      mentionCount: 3,
      lastMentioned: daysAgo(0),
    },
  });
  console.log("  Upserted: Boyfriend");

  // Abby (puppy)
  await prisma.person.upsert({
    where: { userId_name: { userId, name: "Abby" } },
    create: {
      userId,
      name: "Abby",
      relationship: "other",
      notes: "Puppy. Destroyer of toilet paper. Very proud of herself.",
      mentionCount: 2,
      lastMentioned: daysAgo(0),
    },
    update: {
      mentionCount: 2,
      lastMentioned: daysAgo(0),
    },
  });
  console.log("  Upserted: Abby");

  // ── 10. Add tone preferences ──
  console.log("=== Adding tone preferences ===");
  const tones = [
    { toneType: "curious", score: 5, sampleCount: 8 },
    { toneType: "direct", score: 3, sampleCount: 6 },
    { toneType: "encouraging", score: 2, sampleCount: 5 },
    { toneType: "gentle", score: 1, sampleCount: 3 },
    { toneType: "challenging", score: -1, sampleCount: 2 },
    { toneType: "formal", score: -3, sampleCount: 4 },
  ];
  for (const t of tones) {
    await prisma.tonePreference.upsert({
      where: { userId_toneType: { userId, toneType: t.toneType } },
      create: { userId, ...t },
      update: { score: t.score, sampleCount: t.sampleCount },
    });
    console.log(`  Upserted tone: ${t.toneType} (${t.score > 0 ? "+" : ""}${t.score})`);
  }

  // ── 11. Add response tracking entries ──
  console.log("=== Adding response tracking ===");
  const feedbacks = [
    { feedback: "helpful" as const, responseLength: 340, containedQuestion: true, containedAdvice: false, containedEmpathy: true, timeContext: "evening" as const, createdAt: daysAgo(5) },
    { feedback: "helpful" as const, responseLength: 520, containedQuestion: true, containedAdvice: false, containedEmpathy: false, timeContext: "late_night" as const, createdAt: daysAgo(4) },
    { feedback: "helpful" as const, responseLength: 280, containedQuestion: false, containedAdvice: false, containedEmpathy: true, timeContext: "afternoon" as const, createdAt: daysAgo(3) },
    { feedback: "too_long" as const, responseLength: 890, containedQuestion: true, containedAdvice: true, containedEmpathy: true, timeContext: "morning" as const, createdAt: daysAgo(8) },
    { feedback: "helpful" as const, responseLength: 200, containedQuestion: false, containedAdvice: false, containedEmpathy: false, timeContext: "evening" as const, createdAt: daysAgo(2) },
    { feedback: "tone_wrong" as const, responseLength: 410, containedQuestion: false, containedAdvice: true, containedEmpathy: false, timeContext: "morning" as const, createdAt: daysAgo(12) },
    { feedback: "helpful" as const, responseLength: 310, containedQuestion: true, containedAdvice: false, containedEmpathy: true, timeContext: "evening" as const, createdAt: daysAgo(1) },
  ];
  for (const f of feedbacks) {
    await prisma.responseTracking.create({
      data: {
        userId,
        messageId: "msg_" + Math.random().toString(36).substring(2, 10),
        ...f,
      },
    });
  }
  console.log(`  Added ${feedbacks.length} response tracking entries`);

  // ── 12. Add writing style ──
  console.log("=== Adding writing style ===");
  await prisma.userWritingStyle.upsert({
    where: { userId },
    create: {
      userId,
      prefersBulletPoints: false,
      prefersMarkdown: false,
      prefersShortSentences: false,
      prefersFirstPerson: true,
      prefersEmotionalDetail: true,
      prefersActionItems: false,
      prefersTimestamps: false,
      avoidWords: ["utilize", "leverage", "synergy", "actionable"],
      preferredPhrases: ["idk", "lol", "honestly", "I think"],
      paragraphStyle: "flowing",
      capitalizationStyle: "casual",
      customRules: [
        "Uses lowercase frequently, especially for casual entries",
        "Mixes technical vocabulary naturally into conversational tone",
        "Tends to write longer connected thoughts rather than bullet points",
      ],
      voiceSamples: [
        "idk maybe I'm totally off base but it seems like something worth poking at",
        "that's... uncomfortably relatable lol",
        "she definitely knew what she did because she immediately wanted to go outside",
      ],
    },
    update: {},
  });
  console.log("  Created writing style profile");

  // ── Summary ──
  const [hCount, tCount, gCount, sCount, rtCount, pCount] = await Promise.all([
    prisma.habit.count({ where: { userId } }),
    prisma.task.count({ where: { userId } }),
    prisma.goal.count({ where: { userId } }),
    prisma.strategy.count({ where: { userId } }),
    prisma.responseTracking.count({ where: { userId } }),
    prisma.person.count({ where: { userId } }),
  ]);
  console.log("\n=== Final counts ===");
  console.log(`  Habits: ${hCount}`);
  console.log(`  Tasks: ${tCount}`);
  console.log(`  Goals: ${gCount}`);
  console.log(`  Strategies: ${sCount}`);
  console.log(`  Response tracking: ${rtCount}`);
  console.log(`  People: ${pCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
