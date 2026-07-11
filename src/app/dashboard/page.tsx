"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Cormorant_Garamond } from "next/font/google";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { 
  Flame, GlassWater, Trophy, Check, Loader2, Plus, Minus, Dumbbell, 
  BookOpen, Code, Github, Sparkles, HelpCircle, SlidersHorizontal, Compass,
  ArrowRight
} from "lucide-react";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

interface GridDay {
  date: string;
  count?: number;
  active: boolean;
  intensity: number;
  breakdown?: {
    github: { val: any; target: any; ok: boolean; label: string };
    leetcode: { val: any; target: any; ok: boolean; label: string };
    water: { val: any; target: any; ok: boolean; label: string };
    gym: { val: any; target: any; ok: boolean; label: string };
    reading: { val: any; target: any; ok: boolean; label: string };
    mainTask: { val: any; target: any; ok: boolean; label: string };
  };
}

interface GridsData {
  github: GridDay[];
  leetcode: GridDay[];
  master: GridDay[];
  streak: number;
}

interface DailyLog {
  id: string;
  date: string;
  githubContributed: boolean;
  githubCount: number;
  leetcodeSolved: number;
  waterGlasses: number;
  waterTarget: number;
  gymDone: boolean;
  readingPages: number;
  mainTaskTitle: string | null;
  mainTaskDone: boolean;
  customLogs?: Record<string, number>;
}

export default function DashboardPage() {
  const [gridsData, setGridsData] = useState<GridsData | null>(null);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showInputs, setShowInputs] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Hover Tooltip state
  const [hoveredDay, setHoveredDay] = useState<GridDay | null>(null);
  const [hoveredGridType, setHoveredGridType] = useState<"github" | "leetcode" | "master" | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    // Determine current theme
    const isDark = document.documentElement.classList.contains("dark");
    setThemeMode(isDark ? "dark" : "light");

    // Listen for dark class toggles on the root element
    const observer = new MutationObserver(() => {
      const currentDark = document.documentElement.classList.contains("dark");
      setThemeMode(currentDark ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    async function initDashboard() {
      try {
        // Fetch Today's Log
        const logRes = await fetch("/api/daily-log");
        if (logRes.ok) {
          const logData = await logRes.json();
          setTodayLog(logData);
        }

        // Fetch Custom Requirements
        const reqsRes = await fetch("/api/requirements");
        if (reqsRes.ok) {
          const reqsData = await reqsRes.json();
          setRequirements(reqsData);
        }

        // Fetch Grids Data
        const gridsRes = await fetch("/api/grids");
        if (gridsRes.ok) {
          const gridsData = await gridsRes.json();
          setGridsData(gridsData);
        }

        // Fetch Roadmap Tracks
        const roadmapRes = await fetch("/api/roadmap");
        if (roadmapRes.ok) {
          const roadmapData = await roadmapRes.json();
          setTracks(roadmapData);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    initDashboard();
    return () => observer.disconnect();
  }, []);

  // Handle manual log form save
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todayLog) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/daily-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todayLog),
      });

      if (res.ok) {
        setSaveSuccess(true);
        // Reload grids to update streak and contribution heatmaps
        const gridsRes = await fetch("/api/grids");
        if (gridsRes.ok) {
          const grids = await gridsRes.json();
          setGridsData(grids);
        }
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save daily log:", err);
    } finally {
      setSaving(false);
    }
  };

  // Tooltip position calculator
  const handleMouseEnter = (e: React.MouseEvent, day: GridDay, gridType: "github" | "leetcode" | "master") => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredDay(day);
    setHoveredGridType(gridType);
    setTooltipPos({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10,
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
    setHoveredGridType(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#070707] transition-colors duration-200">
        <Navbar />
        <div className="flex justify-center items-center py-40">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-600" />
        </div>
      </div>
    );
  }

  // Color mapper helper functions
  const getGithubColor = (intensity: number) => {
    switch (intensity) {
      case 1: return "bg-[#d1fae5] dark:bg-emerald-950/20 border border-[#a7f3d0]/30 dark:border-emerald-900/10";
      case 2: return "bg-[#a7f3d0] dark:bg-emerald-900/40 border border-[#6ee7b7]/30 dark:border-emerald-800/20";
      case 3: return "bg-[#34d399] dark:bg-emerald-700/60 border border-[#10b981]/30 dark:border-emerald-600/30";
      case 4: return "bg-[#059669] dark:bg-emerald-500 border border-[#047857]/30 dark:border-emerald-400/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
      default: return "bg-slate-100 dark:bg-white/[0.03] border border-slate-200/20 dark:border-white/5";
    }
  };

  const getLeetcodeColor = (intensity: number) => {
    switch (intensity) {
      case 1: return "bg-[#e0f2fe] dark:bg-sky-950/20 border border-[#bae6fd]/30 dark:border-sky-900/10";
      case 2: return "bg-[#bae6fd] dark:bg-sky-900/40 border border-[#7dd3fc]/30 dark:border-sky-800/20";
      case 3: return "bg-[#7dd3fc] dark:bg-sky-700/60 border border-[#38bdf8]/30 dark:border-sky-600/30";
      case 4: return "bg-[#0284c7] dark:bg-sky-500 border border-[#0369a1]/30 dark:border-sky-400/40 shadow-[0_0_8px_rgba(14,165,233,0.3)]";
      default: return "bg-slate-100 dark:bg-white/[0.03] border border-slate-200/20 dark:border-white/5";
    }
  };

  const getMasterColor = (active: boolean) => {
    return active 
      ? "bg-emerald-500 dark:bg-emerald-500 border border-emerald-600/30 dark:border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.35)]" 
      : "bg-slate-100 dark:bg-white/[0.03] border border-slate-200/20 dark:border-white/5";
  };

  // Day names for grid labels
  const dayNames = ["M", "", "W", "", "F", "", "S"];

  // Helper to format date label
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#070707] pb-16 transition-colors duration-200 relative">
      <Navbar />

      {/* Decorative Spiderman scaling the right side */}
      <div className="absolute top-[56px] right-0 w-36 sm:w-48 md:w-60 pointer-events-none select-none z-30 opacity-80 hover:opacity-100 transition-opacity duration-300">
        <img 
          src="/spiderman.png" 
          alt="Spiderman" 
          className="w-full object-contain"
        />
      </div>

      {/* Glow effect in Dark Mode */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/[0.02] rounded-full blur-[135px] pointer-events-none z-0 hidden dark:block" />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Apple-style Dashboard Branding Header (SAMIEE Serif Showcase) */}
        <div className="flex justify-center select-none pt-4 pb-10">
          <div className="relative py-8 px-4 w-fit select-none">
            {/* Top Left Metadata Info */}
            <div className="absolute top-1 left-[6%] flex items-center gap-1.5 z-30 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="h-2.5 w-2.5 rounded-full border border-slate-350 dark:border-[#f4efe6]/30" />
              <div className="rounded-full border border-slate-350 dark:border-[#f4efe6]/30 px-2 py-0.5 text-[8px] font-mono tracking-widest text-slate-400 dark:text-[#f4efe6]/60 uppercase">
                2026
              </div>
            </div>

            {/* Main Title text (Ivory / warm-off-white in dark mode, charcoal in light mode) */}
            <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-widest text-slate-800 dark:text-[#f4efe6] leading-none select-none relative z-10 uppercase transition-colors duration-200 ${cormorant.className}`}>
              Samiee
            </h1>

            {/* Frosted Glass Overlay Capsule 1 (Bottom Left) */}
            <div className="absolute bottom-[4%] left-[-4%] w-[42%] h-[26%] rounded-full bg-slate-300/10 dark:bg-white/[0.03] backdrop-blur-[6px] border border-slate-300/20 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-20 hover:scale-[1.02] hover:border-slate-300/30 dark:hover:border-white/20 transition-all duration-300" />

            {/* Frosted Glass Overlay Capsule 2 (Top Right) */}
            <div className="absolute top-[8%] right-[-4%] w-[42%] h-[26%] rounded-full bg-slate-300/10 dark:bg-white/[0.03] backdrop-blur-[6px] border border-slate-300/20 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-20 hover:scale-[1.02] hover:border-slate-300/30 dark:hover:border-white/20 transition-all duration-300" />

            {/* Bottom Right Metadata Info */}
            <div className="absolute bottom-1 right-[6%] flex items-center gap-1.5 z-30 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="h-2 w-2 rounded-full bg-slate-700 dark:bg-[#f4efe6]" />
              <div className={`bg-slate-100 dark:bg-[#f4efe6] text-slate-800 dark:text-[#070707] rounded-full px-2.5 py-0.5 text-[8.5px] font-medium tracking-tight shadow-sm dark:shadow-md ${cormorant.className}`}>
                <span className="italic font-semibold">Sampath Rajana</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmaps container */}
        <div className="space-y-8">
          {/* GitHub Grid */}
          <div className="py-2 dark:py-5 px-0 dark:px-6 bg-transparent dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl dark:border dark:border-white/[0.08] dark:rounded-2xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-200">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs font-bold text-slate-700 dark:text-[#f4efe6]/80 uppercase tracking-wider flex items-center gap-1.5">
                <Github className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                GitHub Grid
              </h2>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Automatic Pull</span>
            </div>
            <div className="flex">
              {/* Day Labels */}
              <div className="grid grid-rows-7 gap-[5px] pr-2.5 text-[9.5px] text-slate-400 dark:text-slate-500 font-medium h-[114px] justify-between pt-1 select-none">
                {dayNames.map((n, i) => (
                  <span key={i} className="h-[12px] flex items-center">{n}</span>
                ))}
              </div>
              {/* Grid content */}
              <div className="flex-1 overflow-x-auto custom-scrollbar">
                <div className="grid grid-rows-7 grid-flow-col gap-[5px] py-1 w-max">
                  {gridsData?.github.map((day) => (
                    <div
                      key={day.date}
                      onMouseEnter={(e) => handleMouseEnter(e, day, "github")}
                      onMouseLeave={handleMouseLeave}
                      className={`h-[12px] w-[12px] rounded-[2px] cursor-pointer transition-all duration-100 hover:scale-[1.25] ${getGithubColor(day.intensity)}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* LeetCode Grid */}
          <div className="py-2 dark:py-5 px-0 dark:px-6 bg-transparent dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl dark:border dark:border-white/[0.08] dark:rounded-2xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-200">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs font-bold text-slate-700 dark:text-[#f4efe6]/80 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                LeetCode Grid
              </h2>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Manual Log</span>
            </div>
            <div className="flex">
              {/* Day Labels */}
              <div className="grid grid-rows-7 gap-[5px] pr-2.5 text-[9.5px] text-slate-400 dark:text-slate-500 font-medium h-[114px] justify-between pt-1 select-none">
                {dayNames.map((n, i) => (
                  <span key={i} className="h-[12px] flex items-center">{n}</span>
                ))}
              </div>
              {/* Grid content */}
              <div className="flex-1 overflow-x-auto custom-scrollbar">
                <div className="grid grid-rows-7 grid-flow-col gap-[5px] py-1 w-max">
                  {gridsData?.leetcode.map((day) => (
                    <div
                      key={day.date}
                      onMouseEnter={(e) => handleMouseEnter(e, day, "leetcode")}
                      onMouseLeave={handleMouseLeave}
                      className={`h-[12px] w-[12px] rounded-[2px] cursor-pointer transition-all duration-100 hover:scale-[1.25] ${getLeetcodeColor(day.intensity)}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Master Grid */}
          <div className="py-2 dark:py-5 px-0 dark:px-6 bg-transparent dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl dark:border dark:border-white/[0.08] dark:rounded-2xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-200">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs font-bold text-slate-700 dark:text-[#f4efe6]/80 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                Stark
              </h2>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/10 rounded px-1.5 py-0.5 animate-pulse">
                Combined Metric
              </span>
            </div>
            <div className="flex">
              {/* Day Labels */}
              <div className="grid grid-rows-7 gap-[5px] pr-2.5 text-[9.5px] text-slate-400 dark:text-slate-500 font-medium h-[114px] justify-between pt-1 select-none">
                {dayNames.map((n, i) => (
                  <span key={i} className="h-[12px] flex items-center">{n}</span>
                ))}
              </div>
              {/* Grid content */}
              <div className="flex-1 overflow-x-auto custom-scrollbar">
                <div className="grid grid-rows-7 grid-flow-col gap-[5px] py-1 w-max">
                  {gridsData?.master.map((day) => (
                    <div
                      key={day.date}
                      onMouseEnter={(e) => handleMouseEnter(e, day, "master")}
                      onMouseLeave={handleMouseLeave}
                      className={`h-[12px] w-[12px] rounded-[2px] cursor-pointer transition-all duration-100 hover:scale-[1.25] ${getMasterColor(day.active)}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Tracks Progress Tracker Circles Row */}
        {tracks && tracks.length > 0 && (
          <div className="mt-10 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-[#f4efe6]/85 uppercase tracking-wider flex items-center gap-2 select-none px-1">
              <Compass className="h-3.5 w-3.5 text-slate-500 dark:text-slate-450" />
              Learning Milestones Progress
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {tracks.map((track) => {
                const doneNodes = track.nodes.filter((n: any) => n.status === "done").length;
                const totalNodes = track.nodes.length;
                const completionPercentage = totalNodes > 0 ? Math.round((doneNodes / totalNodes) * 100) : 0;
                
                const chartData = [
                  {
                    name: "Progress",
                    value: completionPercentage,
                    fill: "#10b981", // Emerald accent
                  },
                ];

                return (
                  <div key={track.id} className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl p-5 shadow-sm dark:shadow-none flex flex-col items-center text-center justify-between min-h-[220px] transition-all duration-200">
                    <div className="w-full">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-[#f4efe6] tracking-tight uppercase select-none">
                        {track.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 select-none mt-0.5">
                        {doneNodes} of {totalNodes} milestones completed
                      </p>
                    </div>

                    {/* Radial Progress Chart */}
                    <div className="relative flex h-28 w-28 items-center justify-center my-3 select-none">
                      {mounted ? (
                        <>
                          <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                              cx="50%"
                              cy="50%"
                              innerRadius="70%"
                              outerRadius="95%"
                              barSize={6}
                              data={chartData}
                              startAngle={90}
                              endAngle={-270}
                            >
                              <PolarAngleAxis
                                type="number"
                                domain={[0, 100]}
                                angleAxisId={0}
                                tick={false}
                              />
                              <RadialBar
                                background={{ fill: themeMode === "dark" ? "#27272a" : "#f1f5f9" }}
                                dataKey="value"
                                cornerRadius={3}
                              />
                            </RadialBarChart>
                          </ResponsiveContainer>
                          {/* Percent Overlay */}
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-[#f4efe6]">
                              {completionPercentage}%
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="h-full w-full rounded-full border-4 border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 text-[10px]">
                          Loading...
                        </div>
                      )}
                    </div>

                    <span className="inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 select-none">
                      Active track
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's Main Goal Focus Banner */}
        {todayLog && (
          <div className="mt-8 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-[#f4efe6]/85 uppercase tracking-wider flex items-center gap-2 select-none px-1">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              Today's Main Focus
            </h3>

            {todayLog.mainTaskTitle ? (
              <div 
                className={`rounded-2xl border p-5 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden select-none ${
                  todayLog.mainTaskDone
                    ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-[0_4px_20px_rgba(16,185,129,0.05)] dark:shadow-[0_8px_32px_rgba(16,185,129,0.05)]"
                    : "border-slate-205 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl shadow-sm dark:shadow-none"
                }`}
              >
                {/* Left side glowing status accent */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${todayLog.mainTaskDone ? "bg-emerald-500" : "bg-amber-400"}`} />

                <div className="flex-1 pl-2">
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${todayLog.mainTaskDone ? "text-emerald-600 dark:text-emerald-455" : "text-amber-500"}`}>
                    {todayLog.mainTaskDone ? "Completed Focus" : "Active Focus"}
                  </span>
                  <p className={`text-sm font-semibold mt-1 tracking-tight ${todayLog.mainTaskDone ? "text-slate-500 dark:text-slate-400 line-through decoration-emerald-500/30" : "text-slate-800 dark:text-[#f4efe6]"}`}>
                    {todayLog.mainTaskTitle}
                  </p>
                </div>

                {/* Quick Toggle Button */}
                <button
                  type="button"
                  onClick={async () => {
                    const nextDone = !todayLog.mainTaskDone;
                    // Optimistic state update
                    const updatedLog = { ...todayLog, mainTaskDone: nextDone };
                    setTodayLog(updatedLog);

                    try {
                      // Save to API
                      const res = await fetch("/api/daily-log", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updatedLog),
                      });
                      if (res.ok) {
                        // Reload grids to instantly reflect color changes on heatmaps
                        const gridsRes = await fetch("/api/grids");
                        if (gridsRes.ok) {
                          const grids = await gridsRes.json();
                          setGridsData(grids);
                        }
                      }
                    } catch (err) {
                      console.error("Failed to quick toggle main task:", err);
                    }
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-all duration-200 ${
                    todayLog.mainTaskDone
                      ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-450"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/15 dark:text-[#f4efe6]"
                  }`}
                >
                  <Check className={`h-3.5 w-3.5 transition-transform duration-250 ${todayLog.mainTaskDone ? "scale-110 text-emerald-600 dark:text-emerald-400" : "text-slate-450"}`} />
                  <span>{todayLog.mainTaskDone ? "Mark Pending" : "Mark Done"}</span>
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] p-6 text-center select-none">
                <p className="text-xs text-slate-400 dark:text-slate-550">
                  No main task set for today.
                </p>
                <button 
                  type="button"
                  onClick={() => setShowInputs(true)}
                  className="mt-2.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  Define Today's Focus
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Streak and Inputs Row */}
        {todayLog && (
          <div className="mt-6 flex items-center justify-between">
            {/* Compact Streak Badge */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl px-3 py-1.5 shadow-sm dark:shadow-none select-none text-slate-700 dark:text-[#f4efe6]/90 transition-colors">
              <Flame className="h-4 w-4 text-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold">
                Streak: <span className="font-extrabold text-slate-900 dark:text-[#f4efe6]">{gridsData?.streak ?? 0} {gridsData?.streak === 1 ? "day" : "days"}</span>
              </span>
            </div>

            {/* Inputs Toggle Button */}
            <button
              onClick={() => setShowInputs(!showInputs)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-tight transition-all duration-150 focus:outline-none shadow-sm ${
                showInputs
                  ? "bg-slate-950 border-slate-950 text-white dark:bg-[#f4efe6] dark:border-[#f4efe6] dark:text-[#070707]"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl dark:border-white/[0.08] dark:text-[#f4efe6]/80 dark:hover:bg-white/10 dark:hover:text-[#f4efe6]"
              }`}
            >
              <SlidersHorizontal className={`h-3.5 w-3.5 ${showInputs ? "text-white dark:text-[#070707]" : "text-slate-400 dark:text-slate-500"}`} />
              <span>Inputs</span>
            </button>
          </div>
        )}

        {/* Unified log inputs section */}
        {todayLog && showInputs && (
          <div className="mt-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl p-6 shadow-sm dark:shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-[#f4efe6] tracking-tight mb-4 select-none">
              Log Progress For Today
            </h2>
            <form onSubmit={handleSaveLog} className="space-y-5">
              {/* Row 1: Today's Main Task */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-xl p-4">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 select-none">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    Today's Main Task
                  </label>
                  <input
                    type="text"
                    value={todayLog.mainTaskTitle || ""}
                    onChange={(e) => setTodayLog({ ...todayLog, mainTaskTitle: e.target.value })}
                    placeholder="E.g., Complete PyTorch backpropagation paper implementation..."
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121212]/20 px-3 py-2 text-sm text-slate-900 dark:text-[#f4efe6] placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-300 dark:focus:border-white/35 focus:outline-none focus:ring-1 focus:ring-slate-200 dark:focus:ring-white/10 transition-all duration-150"
                  />
                </div>
                
                {/* Completed Checkbox/Button */}
                <div className="shrink-0 flex items-center gap-2.5 pt-4 sm:pt-6 select-none">
                  <button
                    type="button"
                    onClick={() => setTodayLog({ ...todayLog, mainTaskDone: !todayLog.mainTaskDone })}
                    className={`flex items-center gap-2 rounded-lg border h-[38px] px-4 text-xs font-semibold tracking-tight transition-all duration-150 ${
                      todayLog.mainTaskDone
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-[#121212]/40 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10"
                    }`}
                  >
                    <Check className={`h-4 w-4 ${todayLog.mainTaskDone ? "text-emerald-600 dark:text-emerald-400 scale-110" : "text-slate-300 dark:text-slate-650"}`} />
                    <span>Completed</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Quantitative Metrics & Custom Requirements */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 items-end">
                {/* LeetCode */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 select-none">
                    <Code className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    LeetCode Solved
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={todayLog.leetcodeSolved}
                    onChange={(e) => setTodayLog({ ...todayLog, leetcodeSolved: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#121212]/20 px-3 py-2 text-sm text-slate-900 dark:text-[#f4efe6] placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-300 dark:focus:border-white/35 focus:bg-white dark:focus:bg-[#121212]/40 focus:outline-none focus:ring-1 focus:ring-slate-200 dark:focus:ring-white/10 transition-all duration-150"
                    placeholder="0"
                  />
                </div>

                {/* Custom Requirements Inputs */}
                {requirements && requirements.map((req) => {
                  const currentVal = todayLog.customLogs?.[req.id] ?? 0.0;

                  if (req.type === "boolean") {
                    const isDone = currentVal >= 1.0;
                    return (
                      <div key={req.id} className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 select-none">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                          {req.name} {req.required && <span className="text-amber-500 text-[9px] font-bold select-none">(Req)</span>}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const nextVal = isDone ? 0.0 : 1.0;
                            const newCustomLogs = { ...todayLog.customLogs, [req.id]: nextVal };
                            setTodayLog({ ...todayLog, customLogs: newCustomLogs });
                          }}
                          className={`w-full flex items-center justify-center gap-2 rounded-lg border h-[38px] text-xs font-semibold tracking-tight transition-all duration-150 select-none ${
                            isDone 
                              ? "bg-slate-950 border-slate-950 text-white dark:bg-[#f4efe6] dark:border-[#f4efe6] dark:text-[#070707] shadow-sm" 
                              : "bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-[#121212]/20 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10"
                          }`}
                        >
                          <Check className={`h-4 w-4 ${isDone ? "text-emerald-400 scale-110" : "text-slate-350 dark:text-slate-600"}`} />
                          <span>{isDone ? "Completed" : "Mark Done"}</span>
                        </button>
                      </div>
                    );
                  } else {
                    return (
                      <div key={req.id} className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 select-none">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                          {req.name} (Goal: {req.targetVal}) {req.required && <span className="text-amber-500 text-[9px] font-bold select-none">(Req)</span>}
                        </label>
                        <div className="flex items-center border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#121212]/20 rounded-lg h-[38px] px-1 justify-between text-slate-800 dark:text-[#f4efe6]">
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = Math.max(0, currentVal - 1);
                              const newCustomLogs = { ...todayLog.customLogs, [req.id]: nextVal };
                              setTodayLog({ ...todayLog, customLogs: newCustomLogs });
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-sm font-semibold w-12 text-center">
                            {currentVal}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = currentVal + 1;
                              const newCustomLogs = { ...todayLog.customLogs, [req.id]: nextVal };
                              setTodayLog({ ...todayLog, customLogs: newCustomLogs });
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }
                })}

                {/* Save Button */}
                <div className="flex gap-4 items-center">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 h-[38px] text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50 select-none shadow-sm"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : saveSuccess ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-100" />
                        Saved
                      </>
                    ) : (
                      "Save Log"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Floating Hover Tooltip */}
      {hoveredDay && (
        <div
          style={{
            position: "absolute",
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: "translate(-50%, -100%)",
          }}
          className="pointer-events-none z-50 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e]/95 dark:backdrop-blur-xl p-3 shadow-md w-52 transition-all duration-150 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="text-[10px] font-bold text-slate-800 dark:text-[#f4efe6] border-b border-slate-100 dark:border-white/10 pb-1.5 mb-1.5 flex justify-between items-center">
            <span>{formatDateLabel(hoveredDay.date)}</span>
            {hoveredGridType === "master" && (
              <span className={`h-2 w-2 rounded-full ${hoveredDay.active ? "bg-emerald-500" : "bg-red-400"}`} />
            )}
          </div>

          <div className="space-y-1.5 text-[10px]">
            {hoveredGridType === "github" ? (
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Github className="h-3 w-3" /> GitHub contributions
                </span>
                <span className="font-semibold">{hoveredDay.count}</span>
              </div>
            ) : hoveredGridType === "leetcode" ? (
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Code className="h-3 w-3" /> Problems solved
                </span>
                <span className="font-semibold">{hoveredDay.count}</span>
              </div>
            ) : hoveredDay.breakdown ? (
              Object.entries(hoveredDay.breakdown).map(([key, item]: [string, any]) => {
                const formatKey = (k: string) => {
                  if (k === "mainTask") return "Main Task";
                  if (k === "github") return "GitHub";
                  if (k === "leetcode") return "LeetCode";
                  return k.charAt(0).toUpperCase() + k.slice(1);
                };

                return (
                  <div key={key} className="flex items-center justify-between gap-3 text-[10px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">{item.name || formatKey(key)}</span>
                    <span 
                      className={`font-semibold text-right truncate max-w-[90px] flex items-center gap-1 ${item.ok ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}
                      title={typeof item.val === "string" ? item.val : undefined}
                    >
                      {item.val}
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${item.ok ? "bg-emerald-500" : "bg-slate-300"}`} />
                    </span>
                  </div>
                );
              })
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
