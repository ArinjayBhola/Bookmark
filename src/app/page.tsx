'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDiscoveries } from '@/app/actions/discovery';
import { TerrainCategory, ExplorationStatus } from '@/db/enums';
import { MapFilterBar } from '@/components/map/map-filter-bar';
import { MapEngine } from '@/components/map/map-engine';
import { RefreshCw, Mountain, ShieldCheck, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DiscoveryMapItem {
  id: string;
  name: string;
  category: TerrainCategory;
  elevation?: number | null;
  explorationStatus: string;
  latitude: number;
  longitude: number;
}

interface HomePageProps {
  onSelectDiscovery?: (id: string) => void;
}

export default function HomePage({ onSelectDiscovery }: HomePageProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState<TerrainCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = React.useState<ExplorationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: discoveries = [], isLoading } = useQuery({
    queryKey: ['discoveries', selectedCategory, selectedStatus, debouncedSearch],
    queryFn: () =>
      getDiscoveries({
        category: selectedCategory,
        status: selectedStatus,
        search: debouncedSearch,
      }),
    placeholderData: (previousData) => previousData,
  });

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#fafafa]">
      {/* Map Filter Bar */}
      <MapFilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={discoveries.length}
      />

      {/* Map Engine */}
      {isLoading ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#fafafa] space-y-4 z-10 relative">
          <RefreshCw className="size-8 animate-spin text-sky-500" />
          <div className="text-sm font-medium text-zinc-500">Loading Map Data...</div>
        </div>
      ) : discoveries.length === 0 && selectedCategory === 'ALL' && selectedStatus === 'ALL' && debouncedSearch === '' ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#fafafa] p-6 text-center z-20 relative">
          <div className="p-8 bg-white rounded-3xl border border-zinc-200 shadow-xl max-w-lg space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl shadow-sm border border-sky-100">
                <Mountain className="size-12" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold font-serif text-zinc-900">Vault Empty</h2>
              <p className="text-sm text-zinc-600 font-sans leading-relaxed">
                Your private terrain archive is currently empty. Use the <strong className="text-zinc-900">Instant Quick Add (Ctrl+I)</strong> or the <strong className="text-zinc-900">Discovery Inbox</strong> to log your first coordinates.
              </p>
            </div>
            <div className="flex justify-center pt-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 shadow-sm">
                <Plus className="size-4 text-sky-500" /> Press <kbd className="px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-zinc-600 font-mono text-xs">Ctrl+I</kbd> to Capture
              </div>
            </div>
            <div className="text-xs text-zinc-400 flex items-center justify-center gap-1.5 pt-4 border-t border-zinc-100 mt-4">
              <ShieldCheck className="size-4 text-sky-500" /> 100% Private Local Storage
            </div>
          </div>
        </div>
      ) : (
        <MapEngine
          discoveries={discoveries.filter((d) => d.latitude != null && d.longitude != null) as DiscoveryMapItem[]}
          onSelectDiscovery={(id) => {
            if (onSelectDiscovery) {
              onSelectDiscovery(id);
            } else {
              router.push(`/dossier/${id}`);
            }
          }}
        />
      )}
    </div>
  );
}
