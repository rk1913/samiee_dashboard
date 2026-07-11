import { prisma } from "./db";

export async function syncGitHubContributions(username: string): Promise<{ success: boolean; count: number; error?: string }> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("GITHUB_TOKEN is missing in environment variables");
    return { success: false, count: 0, error: "GITHUB_TOKEN is missing" };
  }

  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "NextJS-Daily-Goal-Dashboard",
      },
      body: JSON.stringify({
        query,
        variables: { username },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API returned status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL query error");
    }

    const weeks = result.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
    if (!weeks || !Array.isArray(weeks)) {
      throw new Error("Invalid response format from GitHub GraphQL API");
    }

    // Extract all days
    const daysToUpsert: { dateStr: string; count: number }[] = [];
    for (const week of weeks) {
      if (week.contributionDays && Array.isArray(week.contributionDays)) {
        for (const day of week.contributionDays) {
          daysToUpsert.push({
            dateStr: day.date,
            count: day.contributionCount,
          });
        }
      }
    }

    console.log(`Found ${daysToUpsert.length} days of GitHub contributions to sync.`);

    // Perform batched upserts to avoid overloading the DB connections
    const batchSize = 25;
    let successCount = 0;

    for (let i = 0; i < daysToUpsert.length; i += batchSize) {
      const batch = daysToUpsert.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (day) => {
          // Construct UTC midnight date representing that local day
          const dateObj = new Date(`${day.dateStr}T00:00:00.000Z`);
          await prisma.dailyLog.upsert({
            where: { date: dateObj },
            update: {
              githubCount: day.count,
              githubContributed: day.count > 0,
            },
            create: {
              date: dateObj,
              githubCount: day.count,
              githubContributed: day.count > 0,
            },
          });
          successCount++;
        })
      );
    }

    return { success: true, count: successCount };
  } catch (error: any) {
    console.error("Error syncing GitHub contributions:", error);
    return { success: false, count: 0, error: error.message || "Unknown error" };
  }
}
