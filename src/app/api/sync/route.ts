import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncGitHubContributions } from "@/lib/github-sync";
import { syncLeetCodeSubmissions } from "@/lib/leetcode-sync";
import { ensureDbInitialized } from "@/lib/db-init";

function getTodayDate() {
  // Get YYYY-MM-DD in user's local timezone (represented by server current local time)
  const todayStr = new Date().toLocaleDateString("en-CA");
  return new Date(`${todayStr}T00:00:00.000Z`);
}

export async function POST() {
  try {
    await ensureDbInitialized();
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      return NextResponse.json({ error: "Settings not configured" }, { status: 400 });
    }

    let githubSyncResult: { success: boolean; count: number; error?: string } = { success: false, count: 0, error: "Not configured" };
    if (settings.githubUsername) {
      if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== "your_github_token") {
        githubSyncResult = await syncGitHubContributions(settings.githubUsername);
      } else {
        githubSyncResult = { success: false, count: 0, error: "GITHUB_TOKEN not configured" };
      }
    }

    let leetcodeSyncResult: { success: boolean; count: number; error?: string } = { success: false, count: 0, error: "Not configured" };
    if (settings.leetcodeUsername) {
      leetcodeSyncResult = await syncLeetCodeSubmissions(settings.leetcodeUsername);
    }

    // Fetch the updated log for today
    const todayDate = getTodayDate();
    const todayLog = await prisma.dailyLog.findUnique({
      where: { date: todayDate },
    });

    // Also fetch custom logs for today to match `/api/daily-log` GET response shape
    const customLogs = await prisma.customLog.findMany({
      where: { date: todayDate },
    });

    const customLogsMap: Record<string, number> = {};
    for (const cl of customLogs) {
      customLogsMap[cl.requirementId] = cl.value;
    }

    return NextResponse.json({
      success: true,
      github: githubSyncResult,
      leetcode: leetcodeSyncResult,
      todayLog: todayLog ? {
        ...todayLog,
        customLogs: customLogsMap,
      } : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Sync failed" }, { status: 500 });
  }
}
