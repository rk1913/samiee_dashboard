import { prisma } from "./db";

export async function syncLeetCodeSubmissions(username: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        query: `
          query userProfileCalendar($username: String!) {
            matchedUser(username: $username) {
              userCalendar {
                submissionCalendar
              }
            }
          }
        `,
        variables: { username },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LeetCode API returned status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL query error");
    }

    const calendarStr = result.data?.matchedUser?.userCalendar?.submissionCalendar;
    if (!calendarStr) {
      return { success: true, count: 0 };
    }

    const calendarMap = JSON.parse(calendarStr);
    const daysToUpsert: { dateStr: string; count: number }[] = [];

    // Parse the timestamps
    for (const [timestampStr, countVal] of Object.entries(calendarMap)) {
      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp)) continue;

      const dateObj = new Date(timestamp * 1000);
      const dateStr = dateObj.toISOString().split("T")[0];
      const count = typeof countVal === "number" ? countVal : parseInt(countVal as string, 10) || 0;

      daysToUpsert.push({ dateStr, count });
    }

    console.log(`Found ${daysToUpsert.length} days of LeetCode submissions to sync.`);

    // Perform batched upserts to avoid overloading the DB connections
    const batchSize = 25;
    let successCount = 0;

    for (let i = 0; i < daysToUpsert.length; i += batchSize) {
      const batch = daysToUpsert.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (day) => {
          const dateObj = new Date(`${day.dateStr}T00:00:00.000Z`);
          await prisma.dailyLog.upsert({
            where: { date: dateObj },
            update: {
              leetcodeSolved: day.count,
            },
            create: {
              date: dateObj,
              githubContributed: false,
              githubCount: 0,
              waterGlasses: 0,
              waterTarget: 8,
              gymDone: false,
              readingPages: 0,
              mainTaskTitle: null,
              mainTaskDone: false,
              leetcodeSolved: day.count,
            },
          });
          successCount++;
        })
      );
    }

    return { success: true, count: successCount };
  } catch (error: any) {
    console.error("Error syncing LeetCode contributions:", error);
    return { success: false, count: 0, error: error.message || "Unknown error" };
  }
}
