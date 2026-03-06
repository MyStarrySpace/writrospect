import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import type { ProposedItem } from "@/lib/types/suggestions";
import { MotivationType } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, entryId, parentItem } = body as {
      items: ProposedItem[];
      entryId?: string;
      parentItem?: { id: string; type: string; title: string };
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Get or create database user
    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const results = {
      tasks: 0,
      habits: 0,
      strategies: 0,
      errors: [] as string[],
    };

    // Map motivation type string to enum
    const mapMotivationType = (type?: string): MotivationType => {
      switch (type) {
        case "intrinsic": return MotivationType.intrinsic;
        case "extrinsic": return MotivationType.extrinsic;
        case "obligation": return MotivationType.obligation;
        case "curiosity": return MotivationType.curiosity;
        case "growth": return MotivationType.growth;
        default: return MotivationType.intrinsic;
      }
    };

    // Create each item
    for (const item of items) {
      try {
        if (item.itemType === "task") {
          const taskData: Record<string, unknown> = {
            userId: dbUser.id,
            what: item.what,
            context: item.context || null,
            urgency: item.urgency || "whenever",
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            dueTime: item.dueTime || null,
            sourceEntryId: entryId || null,
          };

          // Link to parent item if this is a dependency
          if (parentItem) {
            if (parentItem.type === "task") taskData.parentTaskId = parentItem.id;
            else if (parentItem.type === "habit") taskData.relatedHabitId = parentItem.id;
            else if (parentItem.type === "goal") taskData.relatedGoalId = parentItem.id;
          }

          await prisma.task.create({ data: taskData as Parameters<typeof prisma.task.create>[0]["data"] });
          results.tasks++;
        } else if (item.itemType === "habit") {
          await prisma.habit.create({
            data: {
              userId: dbUser.id,
              what: item.what,
              why: item.why || null,
              complexity: item.complexity || 3,
              motivationType: mapMotivationType(item.motivationType),
              sourceEntryId: entryId || null,
            },
          });
          results.habits++;
        } else if (item.itemType === "strategy") {
          // Note: trigger is stored in context for strategies (no dedicated trigger field)
          const fullContext = item.trigger
            ? `${item.context}\nTrigger: ${item.trigger}`
            : item.context || "";
          await prisma.strategy.create({
            data: {
              userId: dbUser.id,
              strategy: item.strategy,
              context: fullContext,
            },
          });
          results.strategies++;
        }
      } catch (error) {
        console.error(`Error creating ${item.itemType}:`, error);
        results.errors.push(`Failed to create ${item.itemType}`);
      }
    }

    const totalCreated = results.tasks + results.habits + results.strategies;

    return NextResponse.json({
      success: true,
      message: `Created ${totalCreated} item(s)`,
      results,
    });
  } catch (error) {
    console.error("Error approving items:", error);
    return NextResponse.json(
      { error: "Failed to approve items" },
      { status: 500 }
    );
  }
}
