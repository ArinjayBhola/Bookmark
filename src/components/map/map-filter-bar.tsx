'use client';

import { Search, SlidersHorizontal } from 'lucide-react';

interface MapFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
}

export function MapFilterBar({
  searchQuery,
  onSearchChange,
  totalCount,
}: MapFilterBarProps) {
  return (
    <div className="absolute top-6 left-6 z-10 flex flex-col gap-3 max-w-4xl w-full pointer-events-auto font-sans">
      {/* Unified Glassmorphic Toolbar Panel */}
      <div className="bg-white/85 backdrop-blur-2xl p-3.5 rounded-3xl border border-white/80 shadow-2xl shadow-zinc-900/10 flex flex-col gap-3.5 transition-all">
        {/* Row 1: Search & Count Badge */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              type="text"
              className="w-full bg-zinc-100/70 pl-11 pr-4 py-2.5 rounded-2xl text-xs font-bold outline-none placeholder:text-zinc-400 text-zinc-900 border border-zinc-200/80 focus:border-zinc-900 focus:bg-white shadow-inner transition-all"
              placeholder="Search valleys, glaciers, coordinates..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="h-11 px-4 bg-zinc-900 text-white rounded-2xl flex items-center gap-2 shadow-lg shadow-zinc-900/20 shrink-0 border border-zinc-800">
            <SlidersHorizontal className="size-4 text-sky-400" />
            <span className="text-xs font-extrabold">{totalCount}</span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Found</span>
          </div>
        </div>
      </div>
    </div>
  );
}
