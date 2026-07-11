import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDbInitialized } from "@/lib/db-init";

function getTodayDate() {
  const todayStr = new Date().toLocaleDateString("en-CA");
  return new Date(`${todayStr}T00:00:00.000Z`);
}

export async function GET() {
  try {
    await ensureDbInitialized();
    const todayDate = getTodayDate();

    // Fetch user settings
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });

    // Fetch all user-defined custom requirements
    const customRequirements = await prisma.customRequirement.findMany({
      orderBy: { createdAt: "asc" },
    });

    // 1. Generate the last 365 days (today - 364 days to today)
    const dates: string[] = [];
    const startDate = new Date(todayDate);
    startDate.setDate(startDate.getDate() - 364);

    const temp = new Date(startDate);
    while (temp <= todayDate) {
      dates.push(temp.toISOString().split("T")[0]);
      temp.setDate(temp.getDate() + 1);
    }

    // 2. Fetch daily logs in the range
    const logs = await prisma.dailyLog.findMany({
      where: {
        date: {
          gte: startDate,
          lte: todayDate,
        },
      },
    });

    // Create a map of date string to log
    const logsMap = new Map<string, typeof logs[0]>();
    for (const log of logs) {
      const dateStr = log.date.toISOString().split("T")[0];
      logsMap.set(dateStr, log);
    }

    // 3. Fetch custom logs in the range
    const customLogs = await prisma.customLog.findMany({
      where: {
        date: {
          gte: startDate,
          lte: todayDate,
        },
      },
    });

    // Map of date string to Map of requirementId to value
    const customLogsMap = new Map<string, Map<string, number>>();
    for (const cl of customLogs) {
      const dateStr = cl.date.toISOString().split("T")[0];
      if (!customLogsMap.has(dateStr)) {
        customLogsMap.set(dateStr, new Map<string, number>());
      }
      customLogsMap.get(dateStr)!.set(cl.requirementId, cl.value);
    }

    // 4. Build grids
    const githubGrid: any[] = [];
    const leetcodeGrid: any[] = [];
    const masterGrid: any[] = [];

    const githubRequired = settings?.githubRequired ?? true;
    const leetcodeRequired = settings?.leetcodeRequired ?? true;
    const mainTaskRequired = settings?.mainTaskRequired ?? true;
    const leetcodeTarget = settings?.leetcodeTarget ?? 1;

    for (const dateStr of dates) {
      const log = logsMap.get(dateStr);

      const githubCount = log?.githubCount ?? 0;
      const githubContributed = log?.githubContributed ?? false;
      const leetcodeSolved = log?.leetcodeSolved ?? 0;
      const mainTaskTitle = log?.mainTaskTitle ?? null;
      const mainTaskDone = log?.mainTaskDone ?? false;

      // Evaluation
      const githubOk = !githubRequired || githubContributed;
      const leetcodeOk = !leetcodeRequired || leetcodeSolved >= leetcodeTarget;
      const mainTaskOk = !mainTaskRequired || mainTaskDone;

      // Custom requirements check
      const dayCustomLogs = customLogsMap.get(dateStr) || new Map<string, number>();
      let customRequirementsOk = true;

      const breakdown: Record<string, any> = {
        github: { name: "GitHub", val: githubContributed ? "Yes" : "No", target: githubRequired ? "Yes" : "Optional", ok: githubOk, label: githubRequired ? "GitHub contribution" : "GitHub contribution (optional)" },
        leetcode: { name: "LeetCode", val: leetcodeSolved, target: leetcodeRequired ? leetcodeTarget : "Optional", ok: leetcodeOk, label: leetcodeRequired ? `LeetCode solved (${leetcodeSolved}/${leetcodeTarget})` : `LeetCode solved (${leetcodeSolved} optional)` },
        mainTask: { name: "Main Task", val: mainTaskTitle || "None", target: mainTaskRequired ? "Completed" : "Optional", ok: mainTaskOk, label: mainTaskRequired ? `Main task: ${mainTaskTitle || 'None'}` : `Main task: ${mainTaskTitle || 'None'} (optional)` },
      };

      for (const req of customRequirements) {
        const val = dayCustomLogs.get(req.id) ?? 0.0;
        let isMet = false;
        if (req.type === "boolean") {
          isMet = val >= 1.0;
        } else {
          isMet = val >= req.targetVal;
        }

        const isOk = !req.required || isMet;
        if (req.required && !isMet) {
          customRequirementsOk = false;
        }

        breakdown[req.id] = {
          name: req.name,
          val: req.type === "boolean" ? (val >= 1.0 ? "Yes" : "No") : val,
          target: req.required ? (req.type === "boolean" ? "Yes" : req.targetVal) : "Optional",
          ok: isOk,
          label: req.required 
            ? `${req.name}: ${req.type === "boolean" ? (val >= 1.0 ? "Done" : "Pending") : `${val}/${req.targetVal}`}`
            : `${req.name}: ${req.type === "boolean" ? (val >= 1.0 ? "Done" : "Pending") : `${val}/${req.targetVal}`} (optional)`
        };
      }

      const masterOk = githubOk && leetcodeOk && mainTaskOk && customRequirementsOk;

      // Intensity (0 to 4)
      let githubIntensity = 0;
      if (githubCount > 0) {
        if (githubCount <= 2) githubIntensity = 1;
        else if (githubCount <= 5) githubIntensity = 2;
        else if (githubCount <= 8) githubIntensity = 3;
        else githubIntensity = 4;
      }

      let leetcodeIntensity = 0;
      if (leetcodeSolved > 0) {
        if (leetcodeSolved === 1) leetcodeIntensity = 1;
        else if (leetcodeSolved === 2) leetcodeIntensity = 2;
        else if (leetcodeSolved === 3) leetcodeIntensity = 3;
        else leetcodeIntensity = 4;
      }

      const masterIntensity = masterOk ? 4 : 0;

      githubGrid.push({
        date: dateStr,
        count: githubCount,
        intensity: githubIntensity,
        active: githubContributed,
      });

      leetcodeGrid.push({
        date: dateStr,
        count: leetcodeSolved,
        intensity: leetcodeIntensity,
        active: leetcodeSolved >= leetcodeTarget,
      });

      masterGrid.push({
        date: dateStr,
        active: masterOk,
        intensity: masterIntensity,
        breakdown,
      });
    }

    // 5. Calculate current streak
    let streak = 0;
    const todayStr = todayDate.toISOString().split("T")[0];
    const todayLog = logsMap.get(todayStr);

    const isMasterMet = (log: any) => {
      if (!log) return false;
      const dateStr = log.date.toISOString().split("T")[0];
      const githubOk = !githubRequired || log.githubContributed;
      const leetcodeOk = !leetcodeRequired || log.leetcodeSolved >= leetcodeTarget;
      const mainTaskOk = !mainTaskRequired || log.mainTaskDone;

      const dayCustomLogs = customLogsMap.get(dateStr) || new Map<string, number>();
      let customRequirementsOk = true;

      for (const req of customRequirements) {
        if (req.required) {
          const val = dayCustomLogs.get(req.id) ?? 0.0;
          let isMet = false;
          if (req.type === "boolean") {
            isMet = val >= 1.0;
          } else {
            isMet = val >= req.targetVal;
          }
          if (!isMet) {
            customRequirementsOk = false;
          }
        }
      }

      return githubOk && leetcodeOk && mainTaskOk && customRequirementsOk;
    };

    const todayCompleted = isMasterMet(todayLog);

    if (todayCompleted) {
      streak = 1;
      let current = new Date(todayDate);
      current.setDate(current.getDate() - 1);
      while (true) {
        const curStr = current.toISOString().split("T")[0];
        const log = logsMap.get(curStr);
        if (isMasterMet(log)) {
          streak++;
          current.setDate(current.getDate() - 1);
        } else {
          break;
        }
      }
    } else {
      // Check if yesterday was completed
      let current = new Date(todayDate);
      current.setDate(current.getDate() - 1);
      const yesterdayStr = current.toISOString().split("T")[0];
      const yesterdayLog = logsMap.get(yesterdayStr);

      if (isMasterMet(yesterdayLog)) {
        streak = 1;
        current.setDate(current.getDate() - 1);
        while (true) {
          const curStr = current.toISOString().split("T")[0];
          const log = logsMap.get(curStr);
          if (isMasterMet(log)) {
            streak++;
            current.setDate(current.getDate() - 1);
          } else {
            break;
          }
        }
      } else {
        streak = 0;
      }
    }

    return NextResponse.json({
      github: githubGrid,
      leetcode: leetcodeGrid,
      master: masterGrid,
      streak,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch grids" }, { status: 500 });
  }
}

