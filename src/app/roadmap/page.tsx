"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Cormorant_Garamond } from "next/font/google";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Compass, CheckCircle2, Circle, Clock, Plus, Loader2 } from "lucide-react";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

interface Node {
  id: string;
  title: string;
  status: string; // not_started | in_progress | done
  order: number;
  notes: string | null;
}

interface Track {
  id: string;
  name: string;
  slug: string;
  nodes: Node[];
  order: number;
}

export default function RoadmapPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [addingNode, setAddingNode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    loadRoadmap();

    // Determine current theme
    const isDark = document.documentElement.classList.contains("dark");
    setThemeMode(isDark ? "dark" : "light");

    // Listen for dark class toggles on the root element
    const observer = new MutationObserver(() => {
      const currentDark = document.documentElement.classList.contains("dark");
      setThemeMode(currentDark ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  async function loadRoadmap() {
    try {
      const res = await fetch("/api/roadmap");
      if (res.ok) {
        const data = await res.json();
        setTracks(data);
        if (data.length > 0 && !activeTab) {
          setActiveTab(data[0].slug);
        }
      }
    } catch (error) {
      console.error("Failed to load roadmap:", error);
    } finally {
      setLoading(false);
    }
  }

  const activeTrack = tracks.find((t) => t.slug === activeTab);

  // Cycle node status: not_started -> in_progress -> done -> not_started
  const cycleStatus = async (nodeId: string) => {
    const track = tracks.find((t) => t.nodes.some((n) => n.id === nodeId));
    if (!track) return;
    const node = track.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    let nextStatus = "not_started";
    if (node.status === "not_started") nextStatus = "in_progress";
    else if (node.status === "in_progress") nextStatus = "done";

    try {
      const res = await fetch(`/api/roadmap`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId }),
      });

      if (res.ok) {
        // Optimistic update locally
        setTracks(
          tracks.map((t) => {
            if (t.id === track.id) {
              return {
                ...t,
                nodes: t.nodes.map((n) => (n.id === node.id ? { ...n, status: nextStatus } : n)),
              };
            }
            return t;
          })
        );
      }
    } catch (err) {
      console.error("Failed to cycle status:", err);
    }
  };

  // Add a new node to the active track
  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrack || !newNodeTitle.trim()) return;

    setAddingNode(true);
    const order = activeTrack.nodes.length + 1;

    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: activeTrack.id,
          title: newNodeTitle,
          order,
        }),
      });

      if (res.ok) {
        setNewNodeTitle("");
        await loadRoadmap(); // reload full roadmap track data
      }
    } catch (err) {
      console.error("Failed to add node:", err);
    } finally {
      setAddingNode(false);
    }
  };

  // Calculations for current track progress
  const doneNodes = activeTrack?.nodes.filter((n) => n.status === "done").length ?? 0;
  const totalNodes = activeTrack?.nodes.length ?? 0;
  const completionPercentage = totalNodes > 0 ? Math.round((doneNodes / totalNodes) * 100) : 0;

  // Chart data format
  const chartData = [
    {
      name: "Progress",
      value: completionPercentage,
      fill: "#10b981", // Emerald accent
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#070707] transition-colors duration-200 relative">
      <Navbar />

      {/* Glow effect in Dark Mode */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/[0.015] rounded-full blur-[135px] pointer-events-none z-0 hidden dark:block" />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 relative z-10">
        {/* Apple-style Page Branding Header (Roadmaps Serif Showcase) */}
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
              Roadmaps
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

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Left/Middle Column - Tabs + Nodes */}
            <div className="md:col-span-2 space-y-6">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl rounded-2xl p-1 border shadow-sm dark:shadow-none select-none">
                {tracks.map((track) => (
                  <button
                    key={track.slug}
                    onClick={() => setActiveTab(track.slug)}
                    className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold tracking-tight transition-all ${
                      activeTab === track.slug
                        ? "bg-slate-950 text-white dark:bg-[#f4efe6] dark:text-[#070707] shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-[#f4efe6]"
                    }`}
                  >
                    {track.name}
                  </button>
                ))}
              </div>

              {/* Node List (Todo-tree timeline style) */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl p-6 shadow-sm dark:shadow-none">
                {activeTrack && activeTrack.nodes.length > 0 ? (
                  <div className="relative border-l border-slate-200 dark:border-white/10 pl-6 ml-3 space-y-8">
                    {activeTrack.nodes.map((node) => {
                      let StatusIcon = Circle;
                      let iconColor = "text-slate-350 dark:text-slate-650";

                      if (node.status === "done") {
                        StatusIcon = CheckCircle2;
                        iconColor = "text-emerald-500 dark:text-emerald-400";
                      } else if (node.status === "in_progress") {
                        StatusIcon = Clock;
                        iconColor = "text-amber-500 dark:text-amber-400";
                      }

                      return (
                        <div key={node.id} className="relative group">
                          {/* Dot / Connector on the line */}
                          <button
                            onClick={() => cycleStatus(node.id)}
                            className="absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121212] hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm transition-all focus:outline-none"
                            title="Click to cycle status"
                          >
                            <StatusIcon className={`h-4 w-4 ${iconColor}`} />
                          </button>

                          {/* Content */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                onClick={() => cycleStatus(node.id)}
                                className={`text-sm font-semibold cursor-pointer select-none tracking-tight hover:text-slate-800 dark:hover:text-white transition-colors ${
                                  node.status === "done"
                                    ? "text-slate-400 dark:text-slate-550 line-through font-normal"
                                    : "text-slate-900 dark:text-[#f4efe6]/90"
                                }`}
                              >
                                {node.title}
                              </span>
                              <span
                                className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium tracking-wide uppercase border ${
                                  node.status === "done"
                                    ? "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                    : node.status === "in_progress"
                                    ? "bg-amber-50/50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400"
                                    : "bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400"
                                }`}
                              >
                                {node.status.replace("_", " ")}
                              </span>
                            </div>
                            {node.notes && (
                              <p
                                className={`text-xs leading-relaxed max-w-prose ${
                                  node.status === "done" 
                                    ? "text-slate-300 dark:text-slate-600" 
                                    : "text-slate-450 dark:text-slate-450"
                                }`}
                              >
                                {node.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-550 py-10">No steps in this roadmap yet.</p>
                )}

                {/* Add Node form */}
                <div className="mt-8 border-t border-slate-100 dark:border-white/10 pt-6">
                  <form onSubmit={handleAddNode} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newNodeTitle}
                      onChange={(e) => setNewNodeTitle(e.target.value)}
                      placeholder="Add next node to track..."
                      className="block flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#121212]/20 px-3 py-2 text-xs text-slate-900 dark:text-[#f4efe6] placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-300 dark:focus:border-white/35 focus:bg-white dark:focus:bg-[#121212]/40 focus:outline-none focus:ring-1 focus:ring-slate-200 dark:focus:ring-white/10 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={addingNode}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-950 dark:bg-[#f4efe6] px-3 py-2 text-xs font-medium text-white dark:text-[#070707] hover:bg-slate-800 dark:hover:bg-[#e7e1d5] transition disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Column - Completion Stats (Radial Progress) */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl p-6 shadow-sm dark:shadow-none flex flex-col items-center justify-center text-center">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 select-none">
                  Track Completion
                </h2>

                {/* Radial Chart Container */}
                <div className="relative flex h-40 w-40 items-center justify-center">
                  {mounted ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="70%"
                          outerRadius="95%"
                          barSize={8}
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
                            background={{ fill: themeMode === "dark" ? "#1c1c1e" : "#f1f5f9" }}
                            dataKey="value"
                            cornerRadius={4}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      {/* Percent Overlay */}
                      <div className="absolute flex flex-col items-center justify-center select-none">
                        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#f4efe6]">
                          {completionPercentage}%
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5">done</span>
                      </div>
                    </>
                  ) : (
                    <div className="h-full w-full rounded-full border-8 border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500">
                      Loading...
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-slate-100 dark:border-white/10 pt-4 w-full flex justify-around text-center select-none">
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-[#f4efe6] tracking-tight">{doneNodes}</p>
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">Done</p>
                  </div>
                  <div className="w-px bg-slate-200 dark:bg-white/10 my-1" />
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-[#f4efe6] tracking-tight">{totalNodes}</p>
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">Total Steps</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
