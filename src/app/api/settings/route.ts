import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncGitHubContributions } from "@/lib/github-sync";
import { ensureDbInitialized } from "@/lib/db-init";

export async function GET() {
  try {
    await ensureDbInitialized();
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const { 
      githubUsername, 
      leetcodeUsername, 
      waterTarget,
      leetcodeTarget,
      readingTarget,
      githubRequired,
      leetcodeRequired,
      waterRequired,
      gymRequired,
      readingRequired,
      mainTaskRequired
    } = body;

    if (!githubUsername || !leetcodeUsername) {
      return NextResponse.json({ error: "GitHub and LeetCode usernames are required" }, { status: 400 });
    }

    const wTarget = parseInt(waterTarget, 10);
    const lTarget = parseInt(leetcodeTarget, 10);
    const rTarget = parseInt(readingTarget, 10);

    if (isNaN(wTarget) || wTarget < 1) {
      return NextResponse.json({ error: "Water target must be a valid positive number" }, { status: 400 });
    }
    if (isNaN(lTarget) || lTarget < 0) {
      return NextResponse.json({ error: "LeetCode target must be a non-negative number" }, { status: 400 });
    }
    if (isNaN(rTarget) || rTarget < 0) {
      return NextResponse.json({ error: "Reading target must be a non-negative number" }, { status: 400 });
    }

    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {
        githubUsername,
        leetcodeUsername,
        waterTarget: wTarget,
        leetcodeTarget: lTarget,
        readingTarget: rTarget,
        githubRequired: githubRequired !== false,
        leetcodeRequired: leetcodeRequired !== false,
        waterRequired: waterRequired !== false,
        gymRequired: gymRequired !== false,
        readingRequired: readingRequired !== false,
        mainTaskRequired: mainTaskRequired !== false,
      },
      create: {
        id: "singleton",
        githubUsername,
        leetcodeUsername,
        waterTarget: wTarget,
        leetcodeTarget: lTarget,
        readingTarget: rTarget,
        githubRequired: githubRequired !== false,
        leetcodeRequired: leetcodeRequired !== false,
        waterRequired: waterRequired !== false,
        gymRequired: gymRequired !== false,
        readingRequired: readingRequired !== false,
        mainTaskRequired: mainTaskRequired !== false,
      },
    });

    // Trigger GitHub sync immediately to backfill contribution history
    let syncResult = null;
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== "your_github_token") {
      syncResult = await syncGitHubContributions(githubUsername);
    } else {
      console.warn("Skipping GitHub sync because GITHUB_TOKEN is placeholder or not set.");
    }

    return NextResponse.json({
      settings,
      sync: syncResult || { success: false, error: "GITHUB_TOKEN not configured" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save settings" }, { status: 500 });
  }
}
