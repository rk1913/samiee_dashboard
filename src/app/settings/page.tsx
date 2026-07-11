"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Settings as SettingsIcon, Github, User, GlassWater, Check, Loader2, Save, Dumbbell, BookOpen, Code, Sparkles } from "lucide-react";

interface SettingsState {
  githubUsername: string;
  leetcodeUsername: string;
  waterTarget: number;
  leetcodeTarget: number;
  readingTarget: number;
  githubRequired: boolean;
  leetcodeRequired: boolean;
  waterRequired: boolean;
  gymRequired: boolean;
  readingRequired: boolean;
  mainTaskRequired: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    githubUsername: "",
    leetcodeUsername: "",
    waterTarget: 8,
    leetcodeTarget: 1,
    readingTarget: 2,
    githubRequired: true,
    leetcodeRequired: true,
    waterRequired: true,
    gymRequired: true,
    readingRequired: true,
    mainTaskRequired: true,
  });
  // Custom Requirements State
  interface CustomRequirement {
    id: string;
    name: string;
    type: string;
    targetVal: number;
    required: boolean;
  }

  const [requirements, setRequirements] = useState<CustomRequirement[]>([]);
  const [reqName, setReqName] = useState("");
  const [reqType, setReqType] = useState("boolean");
  const [reqTarget, setReqTarget] = useState("1");
  const [reqRequired, setReqRequired] = useState(true);
  const [reqSaving, setReqSaving] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadRequirements = async () => {
    try {
      const res = await fetch("/api/requirements");
      if (res.ok) {
        const data = await res.json();
        setRequirements(data);
      }
    } catch (err) {
      console.error("Failed to load requirements:", err);
    }
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setSettings({
              githubUsername: data.githubUsername || "",
              leetcodeUsername: data.leetcodeUsername || "",
              waterTarget: data.waterTarget ?? 8,
              leetcodeTarget: data.leetcodeTarget ?? 1,
              readingTarget: data.readingTarget ?? 2,
              githubRequired: data.githubRequired ?? true,
              leetcodeRequired: data.leetcodeRequired ?? true,
              waterRequired: data.waterRequired ?? true,
              gymRequired: data.gymRequired ?? true,
              readingRequired: data.readingRequired ?? true,
              mainTaskRequired: data.mainTaskRequired ?? true,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
    loadRequirements();
  }, []);

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqSaving(true);
    setReqError(null);

    try {
      const res = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reqName,
          type: reqType,
          targetVal: parseFloat(reqTarget) || 1.0,
          required: reqRequired,
        }),
      });

      if (res.ok) {
        setReqName("");
        setReqType("boolean");
        setReqTarget("1");
        setReqRequired(true);
        await loadRequirements();
      } else {
        const errData = await res.json();
        setReqError(errData.error || "Failed to create requirement");
      }
    } catch (err) {
      setReqError("Failed to communicate with server");
    } finally {
      setReqSaving(false);
    }
  };

  const handleDeleteRequirement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this habit? This will permanently erase all logged progress and history for this habit.")) {
      return;
    }

    try {
      const res = await fetch(`/api/requirements?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadRequirements();
      } else {
        alert("Failed to delete requirement");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Settings saved successfully! Historical GitHub sync has been scheduled in the background.",
        });
      } else {
        const errData = await res.json();
        setMessage({
          type: "error",
          text: errData.error || "Failed to save settings.",
        });
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      setMessage({
        type: "error",
        text: "A network error occurred. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#070707] transition-colors duration-200 relative">
      <Navbar />

      {/* Glow effect in Dark Mode */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/[0.015] rounded-full blur-[135px] pointer-events-none z-0 hidden dark:block" />

      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-center gap-2.5 select-none">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#1c1c1e]/80 text-slate-650 dark:text-[#f4efe6]/80 border border-slate-200/60 dark:border-white/[0.08]">
            <SettingsIcon className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-[#f4efe6] tracking-tight">Settings</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configure your profiles and customize daily targets</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-600" />
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl p-6 shadow-sm dark:shadow-none">
            <form onSubmit={handleSave} className="space-y-6">
              {/* GitHub */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  GitHub Profile
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                    <Github className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={settings.githubUsername}
                    onChange={(e) => setSettings({ ...settings, githubUsername: e.target.value })}
                    className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#121212]/20 pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-[#f4efe6] placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-300 dark:focus:border-white/35 focus:bg-white dark:focus:bg-[#121212]/40 focus:outline-none focus:ring-1 focus:ring-slate-200 dark:focus:ring-white/10 transition-all"
                    placeholder="GitHub username"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 select-none">
                  Used to pull public contributions daily from GitHub GraphQL API.
                </p>
              </div>

              {/* LeetCode */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  LeetCode Profile
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={settings.leetcodeUsername}
                    onChange={(e) => setSettings({ ...settings, leetcodeUsername: e.target.value })}
                    className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#121212]/20 pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-[#f4efe6] placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-300 dark:focus:border-white/35 focus:bg-white dark:focus:bg-[#121212]/40 focus:outline-none focus:ring-1 focus:ring-slate-200 dark:focus:ring-white/10 transition-all"
                    placeholder="LeetCode username"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 select-none">
                  For profile record and displaying links.
                </p>
              </div>

              {/* Water Target */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  Daily Water Target (Glasses)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                    <GlassWater className="h-4 w-4" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={settings.waterTarget}
                    onChange={(e) => setSettings({ ...settings, waterTarget: parseInt(e.target.value, 10) || 8 })}
                    className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#121212]/20 pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-[#f4efe6] placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-300 dark:focus:border-white/35 focus:bg-white dark:focus:bg-[#121212]/40 focus:outline-none focus:ring-1 focus:ring-slate-200 dark:focus:ring-white/10 transition-all"
                    placeholder="8"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 select-none">
                  Number of glasses of water target for a full Master grid cell. Default is 8.
                </p>
              </div>

              {/* LeetCode Target */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  Daily LeetCode Target (Solved)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                    <Code className="h-4 w-4" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={settings.leetcodeTarget}
                    onChange={(e) => setSettings({ ...settings, leetcodeTarget: parseInt(e.target.value, 10) ?? 1 })}
                    className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#121212]/20 pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-[#f4efe6] placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-300 dark:focus:border-white/35 focus:bg-white dark:focus:bg-[#121212]/40 focus:outline-none focus:ring-1 focus:ring-slate-200 dark:focus:ring-white/10 transition-all"
                    placeholder="1"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 select-none">
                  Number of problems solved target for the Master grid to be green. Set to 0 to disable.
                </p>
              </div>

              {/* Reading Target */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  Daily Reading Target (Pages)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    required
                    value={settings.readingTarget}
                    onChange={(e) => setSettings({ ...settings, readingTarget: parseInt(e.target.value, 10) ?? 2 })}
                    className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#121212]/20 pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-[#f4efe6] placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-300 dark:focus:border-white/35 focus:bg-white dark:focus:bg-[#121212]/40 focus:outline-none focus:ring-1 focus:ring-slate-200 dark:focus:ring-white/10 transition-all"
                    placeholder="2"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 select-none">
                  Number of reading pages target for the Master grid to be green. Set to 0 to disable.
                </p>
              </div>

              {/* Requirements Checkboxes */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  Master Grid Requirements
                </label>
                
                <div className="flex flex-col gap-3">
                  {/* GitHub contribution Required */}
                  <label className="flex items-center gap-3 cursor-pointer select-none text-slate-700 dark:text-[#f4efe6]/85">
                    <input
                      type="checkbox"
                      checked={settings.githubRequired}
                      onChange={(e) => setSettings({ ...settings, githubRequired: e.target.checked })}
                      className="rounded border-slate-200 dark:border-white/10 text-emerald-600 focus:ring-emerald-500 h-4 w-4 bg-slate-50 dark:bg-[#121212]/30"
                    />
                    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight">
                      <Github className="h-3.5 w-3.5 text-slate-400" />
                      GitHub Contribution Required
                    </div>
                  </label>

                  {/* LeetCode Solved Required */}
                  <label className="flex items-center gap-3 cursor-pointer select-none text-slate-700 dark:text-[#f4efe6]/85">
                    <input
                      type="checkbox"
                      checked={settings.leetcodeRequired}
                      onChange={(e) => setSettings({ ...settings, leetcodeRequired: e.target.checked })}
                      className="rounded border-slate-200 dark:border-white/10 text-emerald-600 focus:ring-emerald-500 h-4 w-4 bg-slate-50 dark:bg-[#121212]/30"
                    />
                    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight">
                      <Code className="h-3.5 w-3.5 text-slate-400" />
                      LeetCode Solved Required
                    </div>
                  </label>

                  {/* Water Target Required */}
                  <label className="flex items-center gap-3 cursor-pointer select-none text-slate-700 dark:text-[#f4efe6]/85">
                    <input
                      type="checkbox"
                      checked={settings.waterRequired}
                      onChange={(e) => setSettings({ ...settings, waterRequired: e.target.checked })}
                      className="rounded border-slate-200 dark:border-white/10 text-emerald-650 focus:ring-emerald-500 h-4 w-4 bg-slate-50 dark:bg-[#121212]/30"
                    />
                    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight">
                      <GlassWater className="h-3.5 w-3.5 text-slate-400" />
                      Water Goal Required
                    </div>
                  </label>

                  {/* Gym Target Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer select-none text-slate-700 dark:text-[#f4efe6]/85">
                    <input
                      type="checkbox"
                      checked={settings.gymRequired}
                      onChange={(e) => setSettings({ ...settings, gymRequired: e.target.checked })}
                      className="rounded border-slate-200 dark:border-white/10 text-emerald-600 focus:ring-emerald-500 h-4 w-4 bg-slate-50 dark:bg-[#121212]/30"
                    />
                    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight">
                      <Dumbbell className="h-3.5 w-3.5 text-slate-400" />
                      Gym Workout Required
                    </div>
                  </label>

                  {/* Reading Target Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer select-none text-slate-700 dark:text-[#f4efe6]/85">
                    <input
                      type="checkbox"
                      checked={settings.readingRequired}
                      onChange={(e) => setSettings({ ...settings, readingRequired: e.target.checked })}
                      className="rounded border-slate-200 dark:border-white/10 text-emerald-655 focus:ring-emerald-500 h-4 w-4 bg-slate-50 dark:bg-[#121212]/30"
                    />
                    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                      Reading Target Required
                    </div>
                  </label>

                  {/* Main Task Target Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer select-none text-slate-700 dark:text-[#f4efe6]/85">
                    <input
                      type="checkbox"
                      checked={settings.mainTaskRequired}
                      onChange={(e) => setSettings({ ...settings, mainTaskRequired: e.target.checked })}
                      className="rounded border-slate-200 dark:border-white/10 text-emerald-650 focus:ring-emerald-500 h-4 w-4 bg-slate-50 dark:bg-[#121212]/30"
                    />
                    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                      Today's Main Task Required
                    </div>
                  </label>
                </div>
              </div>

              {message && (
                <div
                  className={`rounded-lg border p-3.5 text-xs ${
                    message.type === "success"
                      ? "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                      : "bg-red-50/50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-800 dark:text-red-400"
                  }`}
                >
                  <div className="flex gap-2">
                    {message.type === "success" && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
                    <span>{message.text}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-950 dark:bg-[#f4efe6] px-4 py-2.5 text-sm font-medium text-white dark:text-[#070707] hover:bg-slate-800 dark:hover:bg-[#e7e1d5] focus:outline-none focus:ring-2 focus:ring-slate-300 transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving & Syncing GitHub...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Settings
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Custom Habits & Goals Management Panel */}
          <div className="max-w-xl mx-auto mt-8 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl p-6 shadow-sm dark:shadow-none transition-colors">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-[#f4efe6] mb-5 select-none flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Custom Habit Requirements
            </h2>

            {/* List of Custom Requirements */}
            <div className="space-y-4 mb-6">
              <div className="space-y-3">
                {requirements.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic select-none">
                    No custom habits configured yet. Define your first habit below!
                  </p>
                ) : (
                  requirements.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#121212]/10 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-[#f4efe6]">
                            {req.name}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full select-none ${
                            req.required 
                              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20" 
                              : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                          }`}>
                            {req.required ? "Required" : "Optional"}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          Type: {req.type === "boolean" ? "Yes/No Checkbox" : `Numeric Target (${req.targetVal})`}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteRequirement(req.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline select-none px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Form to Add Custom Requirement */}
            <form onSubmit={handleAddRequirement} className="border-t border-slate-100 dark:border-white/5 pt-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                Add Custom Habit
              </h3>

              {reqError && (
                <p className="text-xs text-red-600 dark:text-red-400 select-none">
                  {reqError}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Habit Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 select-none">
                    Habit Name
                  </label>
                  <input
                    type="text"
                    required
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    placeholder="e.g. Meditation, 10k Steps"
                    className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#121212]/20 px-3 py-1.5 text-xs text-slate-900 dark:text-[#f4efe6] placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-300 dark:focus:border-white/35 focus:outline-none transition-all"
                  />
                </div>

                {/* Habit Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 select-none">
                    Tracking Type
                  </label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#121212]/20 px-3 py-1.5 text-xs text-slate-900 dark:text-[#f4efe6] focus:border-slate-300 dark:focus:border-white/35 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="boolean">Yes/No Checkbox</option>
                    <option value="numeric">Numeric Goal</option>
                  </select>
                </div>
              </div>

              {reqType === "numeric" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500 select-none">
                    Numeric Daily Target
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={reqTarget}
                    onChange={(e) => setReqTarget(e.target.value)}
                    className="block w-48 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#121212]/20 px-3 py-1.5 text-xs text-slate-900 dark:text-[#f4efe6] placeholder-slate-450 dark:placeholder-slate-500 focus:border-slate-300 dark:focus:border-white/35 focus:outline-none transition-all"
                  />
                </div>
              )}

              {/* Required checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-700 dark:text-[#f4efe6]/85">
                <input
                  type="checkbox"
                  checked={reqRequired}
                  onChange={(e) => setReqRequired(e.target.checked)}
                  className="rounded border-slate-200 dark:border-white/10 text-emerald-650 focus:ring-emerald-500 h-4 w-4 bg-slate-50 dark:bg-[#121212]/30"
                />
                <span className="text-xs font-semibold tracking-tight">
                  Require this habit to pass the Master Grid
                </span>
              </label>

              <button
                type="submit"
                disabled={reqSaving}
                className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition disabled:opacity-50 select-none"
              >
                {reqSaving ? "Adding Habit..." : "Add Habit"}
              </button>
            </form>
          </div>
        </>
      )}
    </main>
    </div>
  );
}
