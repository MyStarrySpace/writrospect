/**
 * Script to update journal entries:
 * 1. Make existing entries more recent and closer together
 * 2. Add new populated entries with specific content
 *
 * Run: npx tsx scripts/update-journal-entries.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  // Find the user
  const users = await prisma.user.findMany({
    select: { id: true, email: true, stackUserId: true },
  });

  console.log("Found users:", users);

  if (users.length === 0) {
    console.log("No users found!");
    return;
  }

  // Use first user (or you can pick by email)
  const user = users[0];
  console.log(`\nUsing user: ${user.email} (${user.id})`);

  // Check existing entries
  const existingEntries = await prisma.journalEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      date: true,
      time: true,
      timeContext: true,
      content: true,
      entryType: true,
      createdAt: true,
    },
  });

  console.log(`\nExisting entries (${existingEntries.length}):`);
  for (const entry of existingEntries) {
    console.log(
      `  - [${entry.id}] ${entry.date.toISOString().split("T")[0]} (${entry.entryType}): ${entry.content.substring(0, 60)}...`
    );
  }

  // Step 1: Update existing entries to be more recent
  // Spread them across the last 2 weeks, roughly every 1-3 days
  const now = new Date();
  if (existingEntries.length > 0) {
    console.log("\n--- Updating existing entry dates ---");
    const totalExisting = existingEntries.length;
    for (let i = 0; i < totalExisting; i++) {
      // Spread existing entries from 14 days ago to 6 days ago
      const daysAgo = 14 - Math.floor((i / Math.max(totalExisting - 1, 1)) * 8);
      const newDate = new Date(now);
      newDate.setDate(newDate.getDate() - daysAgo);

      // Vary the time of day
      const hours = [8, 10, 14, 17, 20, 22][i % 6];
      const minutes = [12, 35, 5, 48, 22, 15][i % 6];

      const timeContexts = [
        "morning",
        "morning",
        "afternoon",
        "evening",
        "evening",
        "late_night",
      ] as const;

      await prisma.journalEntry.update({
        where: { id: existingEntries[i].id },
        data: {
          date: new Date(
            newDate.getFullYear(),
            newDate.getMonth(),
            newDate.getDate()
          ),
          time: new Date(1970, 0, 1, hours, minutes),
          timeContext: timeContexts[i % 6],
          createdAt: new Date(
            newDate.getFullYear(),
            newDate.getMonth(),
            newDate.getDate(),
            hours,
            minutes
          ),
          updatedAt: new Date(
            newDate.getFullYear(),
            newDate.getMonth(),
            newDate.getDate(),
            hours,
            minutes
          ),
        },
      });
      console.log(
        `  Updated entry ${existingEntries[i].id} → ${newDate.toISOString().split("T")[0]} at ${hours}:${String(minutes).padStart(2, "0")}`
      );
    }
  }

  // Step 2: Add new entries with the provided content
  console.log("\n--- Adding new entries ---");

  const newEntries = [
    {
      daysAgo: 5,
      hours: 21,
      minutes: 43,
      timeContext: "evening" as const,
      entryType: "general" as const,
      content: `listened to the "choose your hard" episode of Worth Your Wild and the part about non-negotiables really got me. they talk about how we stay in the hard we know because the familiar crappy thing can feel easier than the scary thing that might actually be good. and one of them says she kept complaining about her situation but kept doing nothing about it. kept ignoring it. that's... uncomfortably relatable lol. I think I need to actually make my list of non-negotiables and stop treating them like suggestions. it takes time to get to the point where you're ready to actually enforce your boundaries I think. maybe I'm getting there? I keep going back and forth on it. I also wonder if I should figure out what to do when I don't feel like I deserve to be happy — like I feel guilty for having it relatively good when other people have genuinely hard lives. worth sitting with that one.`,
      reflections: [
        "non-negotiables as actual boundaries not suggestions",
        "guilt about privilege and happiness",
      ],
    },
    {
      daysAgo: 4,
      hours: 1,
      minutes: 17,
      timeContext: "late_night" as const,
      entryType: "thinking_of" as const,
      content: `ok so I think I figured something out with the Lanmaoa hypothesis. the hallucinogen doesn't need to reach the brain at all — it's a lectin from a Burkholderia endosymbiont inside the mushroom and it triggers NLRP3 inflammasome activation in gut macrophages. the cytokine cascade hits the brain through the bloodstream and gets to the LGN first because of its periventricular position. astrocyte dysfunction causes PV interneuron GABA depletion. that's why the hallucinations are always Lilliputian (little people on surfaces), always preserve insight, and always come after the GI symptoms. every step constrains the next one. I've been chewing on this for weeks and it's the first model I can find that explains all the clinical features at once without handwaving. need to write up the size constancy mechanism next — that's the part where the LGN specifically predicts the visual phenomenology`,
      reflections: [
        "gut-brain inflammasome model for mushroom hallucinations",
        "LGN periventricular position explains visual specificity",
      ],
    },
    {
      daysAgo: 2,
      hours: 15,
      minutes: 28,
      timeContext: "afternoon" as const,
      entryType: "thinking_of" as const,
      content: `had a weird idea today. everyone trying to detect Alzheimer's early is measuring blood proteins like p-tau and GFAP and amyloid ratios but those are all measuring the cleanup response, not what's actually going wrong upstream. what if you measured iron inside monocytes instead? monocytes share iron-handling machinery with microglia, they infiltrate the AD brain, and when they die they dump iron into the tissue. if monocyte iron compartmentalization is messed up years before brain pathology shows up on a scan you'd basically have a $50 blood test that catches risk before there's anything to find on a PET. people have already measured monocyte iron in sepsis and Parkinson's — nobody's done it for AD. the gap feels sociological not technical, like it just fell between fields. idk maybe I'm totally off base but it seems like something worth poking at`,
      reflections: [
        "monocyte iron as upstream AD biomarker",
        "gap between immunology and neurodegeneration research",
      ],
    },
    {
      daysAgo: 1,
      hours: 19,
      minutes: 52,
      timeContext: "evening" as const,
      entryType: "general" as const,
      moodScore: 5,
      content: `made crab rangoons from scratch tonight and they came out SO good. the trick is not overfilling them because then they pop open in the oil and you get sad deflated cream cheese triangles. also I learned you can freeze them before frying and they actually come out crispier??? life changing. made them in the air fryer so they feel healthier even though I ate like twelve of them`,
      reflections: ["freeze before frying = crispier rangoons"],
    },
    {
      daysAgo: 0,
      hours: 11,
      minutes: 15,
      timeContext: "morning" as const,
      entryType: "general" as const,
      content: `note to self: toilet paper rolls do NOT go on the floor. came back from dropping off my bf and Abby had shredded an entire half roll across the living room like she was decorating for some kind of puppy parade. she definitely knew what she did because she immediately wanted to go outside lol. I'm not even mad, it was genuinely hilarious. she looked so proud of herself`,
      reflections: ["Abby vs toilet paper, toilet paper lost"],
    },
  ];

  for (const entry of newEntries) {
    const entryDate = new Date(now);
    entryDate.setDate(entryDate.getDate() - entry.daysAgo);

    const created = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        date: new Date(
          entryDate.getFullYear(),
          entryDate.getMonth(),
          entryDate.getDate()
        ),
        time: new Date(1970, 0, 1, entry.hours, entry.minutes),
        timeContext: entry.timeContext,
        content: entry.content,
        entryType: entry.entryType,
        moodScore: entry.moodScore ?? null,
        reflections: entry.reflections,
        conditionsPresent: [],
        createdAt: new Date(
          entryDate.getFullYear(),
          entryDate.getMonth(),
          entryDate.getDate(),
          entry.hours,
          entry.minutes
        ),
        updatedAt: new Date(
          entryDate.getFullYear(),
          entryDate.getMonth(),
          entryDate.getDate(),
          entry.hours,
          entry.minutes
        ),
      },
    });
    console.log(
      `  Created: [${created.id}] ${entryDate.toISOString().split("T")[0]} at ${entry.hours}:${String(entry.minutes).padStart(2, "0")} — ${entry.content.substring(0, 50)}...`
    );
  }

  // Final summary
  const allEntries = await prisma.journalEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      date: true,
      timeContext: true,
      entryType: true,
      content: true,
      createdAt: true,
    },
  });

  console.log(`\n=== Final state: ${allEntries.length} entries ===`);
  for (const entry of allEntries) {
    const dateStr = entry.createdAt.toISOString().split("T")[0];
    const timeStr = entry.createdAt.toISOString().split("T")[1].substring(0, 5);
    console.log(
      `  ${dateStr} ${timeStr} [${entry.timeContext}/${entry.entryType}] ${entry.content.substring(0, 60)}...`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
