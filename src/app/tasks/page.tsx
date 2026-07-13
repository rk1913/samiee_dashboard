"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Cormorant_Garamond } from "next/font/google";
import { 
  Check, Loader2, Plus, Trash2, Calendar, ChevronLeft, ChevronRight 
} from "lucide-react";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export default function TasksPage() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [todos, setTodos] = useState<any[]>([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize date to local YYYY-MM-DD
  useEffect(() => {
    setMounted(true);
    const todayStr = new Date().toLocaleDateString("en-CA");
    setSelectedDate(todayStr);
  }, []);

  // Fetch todos when date changes
  useEffect(() => {
    if (!selectedDate) return;
    loadTodos(selectedDate);
  }, [selectedDate]);

  const loadTodos = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/todos?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (err) {
      console.error("Failed to load todos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Date manipulation helpers
  const handlePrevDay = () => {
    const d = new Date(`${selectedDate}T12:00:00`); // use noon to avoid timezone shifts
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toLocaleDateString("en-CA"));
  };

  const handleNextDay = () => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toLocaleDateString("en-CA"));
  };

  const handleSetToday = () => {
    const todayStr = new Date().toLocaleDateString("en-CA");
    setSelectedDate(todayStr);
  };

  const formatDateFriendly = (dateStr: string) => {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const d = new Date(`${dateStr}T12:00:00`);
    
    if (dateStr === todayStr) {
      return "Today, " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    
    // Check if yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA");
    if (dateStr === yesterdayStr) {
      return "Yesterday, " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    // Check if tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString("en-CA");
    if (dateStr === tomorrowStr) {
      return "Tomorrow, " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim() || adding) return;

    setAdding(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTodoText, date: selectedDate }),
      });

      if (res.ok) {
        const newTodo = await res.json();
        setTodos((prev) => [...prev, newTodo]);
        setNewTodoText("");
      }
    } catch (err) {
      console.error("Failed to add todo:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    // Optimistic UI update
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed } : todo))
    );

    try {
      const res = await fetch("/api/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed }),
      });

      if (!res.ok) {
        // Revert on error
        loadTodos(selectedDate);
      }
    } catch (err) {
      console.error("Failed to toggle todo:", err);
      loadTodos(selectedDate);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    // Optimistic UI update
    setTodos((prev) => prev.filter((todo) => todo.id !== id));

    try {
      const res = await fetch(`/api/todos?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // Revert on error
        loadTodos(selectedDate);
      }
    } catch (err) {
      console.error("Failed to delete todo:", err);
      loadTodos(selectedDate);
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#070707] pb-16 transition-colors duration-200 relative select-none">
      <Navbar />

      {/* Decorative Glow effect in Dark Mode */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/[0.02] rounded-full blur-[135px] pointer-events-none z-0 hidden dark:block" />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Page Title Header */}
        <div className="flex justify-center select-none pt-4 pb-10">
          <div className="relative py-8 px-4 w-fit select-none">
            <div className="absolute top-1 left-[6%] flex items-center gap-1.5 z-30">
              <div className="h-2.5 w-2.5 rounded-full border border-slate-350 dark:border-[#f4efe6]/30" />
              <div className="rounded-full border border-slate-350 dark:border-[#f4efe6]/30 px-2 py-0.5 text-[8px] font-mono tracking-widest text-slate-400 dark:text-[#f4efe6]/60 uppercase">
                Works
              </div>
            </div>

            <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-widest text-slate-800 dark:text-[#f4efe6] leading-none select-none relative z-10 uppercase transition-colors duration-200 ${cormorant.className}`}>
              Tasks
            </h1>

            <div className="absolute bottom-[4%] left-[-4%] w-[42%] h-[26%] rounded-full bg-slate-300/10 dark:bg-white/[0.03] backdrop-blur-[6px] border border-slate-300/20 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-20 transition-all duration-300" />
            <div className="absolute top-[8%] right-[-4%] w-[42%] h-[26%] rounded-full bg-slate-300/10 dark:bg-white/[0.03] backdrop-blur-[6px] border border-slate-300/20 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-20 transition-all duration-300" />

            <div className="absolute bottom-1 right-[6%] flex items-center gap-1.5 z-30">
              <div className="h-2 w-2 rounded-full bg-slate-700 dark:bg-[#f4efe6]" />
              <div className={`bg-slate-100 dark:bg-[#f4efe6] text-slate-800 dark:text-[#070707] rounded-full px-2.5 py-0.5 text-[8.5px] font-medium tracking-tight shadow-sm dark:shadow-md ${cormorant.className}`}>
                <span className="italic font-semibold">Checklist</span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Selector Component */}
        <div className="mb-6 rounded-2xl border border-slate-205 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl p-4 shadow-sm dark:shadow-none flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="text-xs font-bold text-slate-700 dark:text-[#f4efe6]/90 min-w-[150px] text-center uppercase tracking-wider font-mono">
              {selectedDate ? formatDateFriendly(selectedDate) : "Loading date..."}
            </span>

            <button
              onClick={handleNextDay}
              className="p-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={handleSetToday}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-[11px] font-bold text-slate-750 dark:text-[#f4efe6]/90 transition-colors uppercase tracking-wider font-mono"
            >
              Today
            </button>

            {/* Custom Date Input */}
            <div className="relative flex items-center border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 bg-slate-50/50 dark:bg-[#121212]/20 text-slate-700 dark:text-[#f4efe6]/80 hover:border-slate-300 dark:hover:border-white/20 transition-all">
              <Calendar className="h-3.5 w-3.5 mr-2 text-slate-400 dark:text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                  }
                }}
                className="bg-transparent text-xs outline-none cursor-pointer text-slate-700 dark:text-[#f4efe6] font-mono [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Tasks Card */}
        <div className="rounded-2xl border border-slate-205 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e]/80 dark:backdrop-blur-xl p-6 shadow-sm dark:shadow-none relative overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 text-slate-400 dark:text-slate-500 gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Loading Tasks...</span>
            </div>
          ) : (
            <>
              {/* Header / Stats */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#10b981] dark:text-emerald-400">
                    Tasks Progress
                  </span>
                  <p className="text-sm font-semibold mt-0.5 tracking-tight text-slate-800 dark:text-[#f4efe6]">
                    {completedCount} of {totalCount} works completed
                  </p>
                </div>
                <span className="text-lg font-extrabold text-slate-900 dark:text-[#f4efe6] bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-xl">
                  {progressPercent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-6">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Todo List Items */}
              {todos.length > 0 ? (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar mb-6">
                  {todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
                        todo.completed
                          ? "border-emerald-100/50 dark:border-emerald-500/10 bg-emerald-50/10 dark:bg-emerald-950/5 opacity-75"
                          : "border-slate-100 dark:border-white/[0.04] bg-slate-50/30 dark:bg-white/[0.01] hover:border-slate-200 dark:hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Custom Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleTodo(todo.id, !todo.completed)}
                          className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-250 ${
                            todo.completed
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 hover:border-slate-400 dark:border-white/15 dark:hover:border-white/25"
                          }`}
                        >
                          {todo.completed && <Check className="h-3 w-3 stroke-[3]" />}
                        </button>

                        {/* Text */}
                        <span
                          className={`text-xs font-medium tracking-tight truncate flex-1 transition-all duration-200 ${
                            todo.completed
                              ? "text-slate-400 dark:text-slate-500 line-through decoration-emerald-500/20"
                              : "text-slate-700 dark:text-[#f4efe6]/90"
                          }`}
                        >
                          {todo.text}
                        </span>
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
                        title="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-slate-200 dark:border-white/5 rounded-xl mb-6 bg-slate-50/20 dark:bg-white/[0.005]">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    No works planned for this day yet.
                  </p>
                </div>
              )}

              {/* Add Task Input Form */}
              <form onSubmit={handleAddTodo} className="flex gap-2">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="Add a work you want to do..."
                  className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#121212]/20 px-3.5 py-2 text-xs text-slate-900 dark:text-[#f4efe6] placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-300 dark:focus:border-white/35 focus:outline-none focus:ring-1 focus:ring-slate-200 dark:focus:ring-white/10 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newTodoText.trim() || adding}
                  className="shrink-0 flex items-center justify-center h-[36px] w-[36px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
