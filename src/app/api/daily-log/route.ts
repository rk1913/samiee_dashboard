import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDbInitialized } from "@/lib/db-init";

function getTodayDate() {
  // Get YYYY-MM-DD in user's local timezone (represented by server current local time)
  const todayStr = new Date().toLocaleDateString("en-CA"); // e.g., "2026-07-11"
  return new Date(`${todayStr}T00:00:00.000Z`); // UTC midnight representing today
}

export async function GET() {
  try {
    await ensureDbInitialized();
    const todayDate = getTodayDate();

    // Fetch existing log
    let log = await prisma.dailyLog.findUnique({
      where: { date: todayDate },
    });

    if (!log) {
      // Get default water target from settings
      const settings = await prisma.settings.findUnique({
        where: { id: "singleton" },
      });
      const waterTarget = settings?.waterTarget ?? 8;

      log = await prisma.dailyLog.create({
        data: {
          date: todayDate,
          waterTarget,
          githubContributed: false,
          githubCount: 0,
          leetcodeSolved: 0,
          waterGlasses: 0,
          gymDone: false,
          readingPages: 0,
        },
      });
    }

    // Fetch custom logs for today
    const customLogs = await prisma.customLog.findMany({
      where: { date: todayDate },
    });

    const customLogsMap: Record<string, number> = {};
    for (const cl of customLogs) {
      customLogsMap[cl.requirementId] = cl.value;
    }

    return NextResponse.json({
      ...log,
      customLogs: customLogsMap,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch today's log" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const todayDate = getTodayDate();

    const leetcodeSolved = parseInt(body.leetcodeSolved, 10) || 0;
    const waterGlasses = parseInt(body.waterGlasses, 10) || 0;
    const readingPages = parseInt(body.readingPages, 10) || 0;
    const gymDone = !!body.gymDone;
    const mainTaskTitle = body.mainTaskTitle || null;
    const mainTaskDone = !!body.mainTaskDone;

    // Fetch settings to ensure we use the current water target
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });
    const waterTarget = settings?.waterTarget ?? 8;

    const log = await prisma.dailyLog.upsert({
      where: { date: todayDate },
      update: {
        leetcodeSolved,
        waterGlasses,
        readingPages,
        gymDone,
        waterTarget, // keep target up to date
        mainTaskTitle,
        mainTaskDone,
      },
      create: {
        date: todayDate,
        leetcodeSolved,
        waterGlasses,
        readingPages,
        gymDone,
        waterTarget,
        mainTaskTitle,
        mainTaskDone,
        githubContributed: false,
        githubCount: 0,
      },
    });

    // Save Custom Logs
    const customLogsInput = body.customLogs || {};
    const customLogsSaved: Record<string, number> = {};

    for (const [requirementId, val] of Object.entries(customLogsInput)) {
      const numericVal = parseFloat(val as string) || 0.0;
      const cl = await prisma.customLog.upsert({
        where: {
          date_requirementId: {
            date: todayDate,
            requirementId,
          },
        },
        update: {
          value: numericVal,
        },
        create: {
          date: todayDate,
          requirementId,
          value: numericVal,
        },
      });
      customLogsSaved[cl.requirementId] = cl.value;
    }

    return NextResponse.json({
      ...log,
      customLogs: customLogsSaved,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save daily log" }, { status: 500 });
  }
}
