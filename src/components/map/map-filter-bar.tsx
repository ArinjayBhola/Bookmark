'use client';

import { TerrainCategory, ExplorationStatus } from '@/db/enums';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MapFilterBarProps {
  selectedCategory: TerrainCategory | 'ALL';
  onSelectCategory: (category: TerrainCategory | 'ALL') => void;
  selectedStatus: ExplorationStatus | 'ALL';
  onSelectStatus: (status: ExplorationStatus | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
}

export function MapFilterBar({
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  totalCount,
}: MapFilterBarProps) {
  const categories: (TerrainCategory | 'ALL')[] = ['ALL', ...Object.values(TerrainCategory)];

  return (
    <div className="absolute top-6 left-6 z-10 flex flex-col gap-3 max-w-4xl w-full pointer-events-auto font-sans">
      {/* Unified Glassmorphic Toolbar Panel */}
      <div className="bg-white/85 backdrop-blur-2xl p-3.5 rounded-3xl border border-white/80 shadow-2xl shadow-zinc-900/10 flex flex-col gap-3.5 transition-all">
        {/* Row 1: Search, Dropdown & Count Badge */}
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

          <div className="w-44">
            <Select value={selectedStatus} onValueChange={(val) => onSelectStatus(val as ExplorationStatus | 'ALL')}>
              <SelectTrigger className="h-11 bg-zinc-100/70 border-zinc-200/80 text-xs font-bold text-zinc-700 rounded-2xl focus:ring-1 focus:ring-zinc-900 shadow-inner">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-zinc-200 text-zinc-800 rounded-2xl shadow-2xl font-sans">
                <SelectItem value="ALL" className="text-xs font-bold focus:bg-zinc-100 focus:text-zinc-900">All States</SelectItem>
                {Object.values(ExplorationStatus).map((status) => (
                  <SelectItem key={status} value={status} className="text-xs font-bold focus:bg-zinc-100 focus:text-zinc-900">
                    {status.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-11 px-4 bg-zinc-900 text-white rounded-2xl flex items-center gap-2 shadow-lg shadow-zinc-900/20 shrink-0 border border-zinc-800">
            <SlidersHorizontal className="size-4 text-sky-400" />
            <span className="text-xs font-extrabold">{totalCount}</span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Found</span>
          </div>
        </div>

        {/* Row 2: Horizontal Scrollable Category Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all duration-300 shrink-0 ${
                selectedCategory === cat 
                  ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 scale-105 border border-zinc-800' 
                  : 'bg-zinc-100/60 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/60'
              }`}
            >
              {cat === 'ALL' ? 'All Terrain' : cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
