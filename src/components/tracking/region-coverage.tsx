'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExplorationStats } from '@/app/actions/discovery';
import { MapPin, Globe } from 'lucide-react';

export function RegionCoverage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['exploration-stats'],
    queryFn: () => getExplorationStats(),
  });

  if (isLoading || !stats) {
    return <div className="h-48 bg-stone-300 animate-pulse rounded-xl" />;
  }

  return (
    <div className="bg-[#f1efe9] p-6 rounded-xl border border-stone-300 shadow-md space-y-4">
      <div className="text-xs font-bold font-serif text-stone-900 uppercase tracking-wider border-b border-stone-300 pb-2 flex items-center gap-2">
        <Globe className="size-4 text-stone-700" /> Geographic Coverage Matrix
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
        {Object.entries(stats.regionCounts).map(([region, count]) => (
          <div key={region} className="bg-[#e8e6dd] p-4 rounded-lg border border-stone-300 space-y-1 shadow-xs">
            <div className="flex items-center gap-1.5 text-stone-700 text-[10px] font-semibold uppercase">
              <MapPin className="size-3 text-stone-600" /> {region || 'Unspecified'}
            </div>
            <div className="text-xl font-mono font-bold text-stone-900">{count}</div>
            <div className="text-[10px] text-stone-500 font-mono">Vaulted locations</div>
          </div>
        ))}
      </div>
    </div>
  );
}
