import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncGitHubContributions } from "@/lib/github-sync";

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

    if (!settings || !settings.githubUsername) {
      return NextResponse.json({ error: "GitHub username not configured in settings" }, { status: 400 });
    }

    const syncResult = await syncGitHubContributions(settings.githubUsername);
    if (!syncResult.success) {
      return NextResponse.json({ error: syncResult.error || "GitHub sync failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: syncResult.count });
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
