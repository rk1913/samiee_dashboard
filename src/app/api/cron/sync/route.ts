import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncGitHubContributions } from "@/lib/github-sync";
import { syncLeetCodeSubmissions } from "@/lib/leetcode-sync";

async function handleSync(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    // Support both header Authorization: Bearer <SECRET> or query param for easy testing
    const url = new URL(request.url);
    const querySecret = url.searchParams.get("secret");

    const isAuthorized = 
      (expectedSecret && authHeader === `Bearer ${expectedSecret}`) ||
      (expectedSecret && querySecret === expectedSecret);

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      return NextResponse.json({ error: "Settings not configured" }, { status: 400 });
    }

    let githubCount = 0;
    if (settings.githubUsername) {
      const syncResult = await syncGitHubContributions(settings.githubUsername);
      if (syncResult.success) {
        githubCount = syncResult.count;
      } else {
        console.error("Cron: GitHub sync failed:", syncResult.error);
      }
    }

    let leetcodeCount = 0;
    if (settings.leetcodeUsername) {
      const syncResult = await syncLeetCodeSubmissions(settings.leetcodeUsername);
      if (syncResult.success) {
        leetcodeCount = syncResult.count;
      } else {
        console.error("Cron: LeetCode sync failed:", syncResult.error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      githubSynced: githubCount,
      leetcodeSynced: leetcodeCount
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Cron execution failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handleSync(request);
}

export async function GET(request: Request) {
  return handleSync(request);
}
