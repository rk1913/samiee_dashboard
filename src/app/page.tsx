"use client";

import Link from "next/link";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { ArrowRight, Compass, LayoutGrid, Settings } from "lucide-react";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
});

export default function LandingPage() {
  return (
    <div className={`min-h-screen bg-[#070707] text-[#f4efe6] flex flex-col justify-between p-6 sm:p-8 overflow-hidden relative select-none ${inter.className}`}>
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute -top-[10%] -left-[10%] w-[300px] h-[300px] bg-slate-500/5 rounded-full blur-[90px] pointer-events-none z-0" />
      
      {/* Header */}
      <header className="relative z-30 flex items-center justify-between w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className={`text-sm font-semibold tracking-wider uppercase text-[#f4efe6]/90 ${cormorant.className}`}>
            Samiee
          </span>
        </div>
      </header>

      {/* Main Showcase Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 my-auto gap-8">
        <div className="relative py-16 px-4 w-fit select-none">
          
          {/* Top Left Metadata Info */}
          <div className="absolute -top-1 left-[6%] sm:left-[12%] flex items-center gap-2.5 z-30 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Outline Circle */}
            <div className="h-4 w-4 rounded-full border border-[#f4efe6]/30" />
            {/* Outline Year Badge */}
            <div className="rounded-full border border-[#f4efe6]/30 px-3 py-0.5 text-[9px] font-mono tracking-widest text-[#f4efe6]/70 uppercase">
              2026
            </div>
          </div>

          {/* Main Title text (Ivory / warm-off-white) */}
          <h1 className={`text-7xl sm:text-8xl md:text-[8rem] lg:text-[11rem] font-bold tracking-widest text-[#f4efe6] leading-none select-none relative z-10 uppercase ${cormorant.className}`}>
            Samiee
          </h1>

          {/* Frosted Glass Overlay Capsule 1 (Bottom Left) */}
          <div className="absolute bottom-[4%] left-[-4%] w-[42%] h-[26%] rounded-full bg-white/[0.03] backdrop-blur-[12px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] z-20 hover:scale-[1.02] hover:border-white/20 transition-all duration-300" />

          {/* Frosted Glass Overlay Capsule 2 (Top Right) */}
          <div className="absolute top-[8%] right-[-4%] w-[42%] h-[26%] rounded-full bg-white/[0.03] backdrop-blur-[12px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] z-20 hover:scale-[1.02] hover:border-white/20 transition-all duration-300" />

          {/* Bottom Right Metadata Info */}
          <div className="absolute -bottom-1 right-[6%] sm:right-[12%] flex items-center gap-2.5 z-30 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Filled White Circle */}
            <div className="h-3 w-3 rounded-full bg-[#f4efe6]" />
            {/* Author Badge */}
            <div className={`bg-[#f4efe6] text-[#070707] rounded-full px-4.5 py-0.5 text-[10.5px] font-medium tracking-tight shadow-md ${cormorant.className}`}>
              <span className="italic font-semibold">Sampath Rajana</span>
            </div>
          </div>

        </div>

        {/* Enter Workspace Call-To-Action (Centered under the title) */}
        <div className="relative z-30 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-[#f4efe6] text-[#070707] hover:bg-[#e7e1d5] transition-all duration-300 px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase hover:scale-[1.04] active:scale-[0.98] shadow-[0_4px_24px_rgba(244,239,230,0.12)]"
          >
            <span>Enter Workspace</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-30 flex flex-col sm:flex-row items-center justify-between w-full max-w-7xl mx-auto text-[10px] tracking-wider text-[#f4efe6]/40 gap-2">
        <div>
          <span>© 2026 SAMIEE. ALL RIGHTS RESERVED.</span>
        </div>
        <div className="flex items-center gap-1.5 select-none">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>LOCKED WORKSPACE ACTIVE</span>
        </div>
      </footer>

    </div>
  );
}
