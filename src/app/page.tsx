'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapEngine } from '@/components/map/map-engine';
import { Loader2, Mountain, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';

interface DiscoveryMapItem {
  id: string;
  name: string;
  elevation?: number | null;
  latitude: number;
  longitude: number;
}

interface HomePageProps {
  onSelectDiscovery?: (id: string) => void;
  activeDossierId?: string | null;
}

export default function HomePage({ onSelectDiscovery, activeDossierId }: HomePageProps) {
  const router = useRouter();

  const { data: discoveries = [], isLoading } = useQuery<DiscoveryMapItem[]>({
    queryKey: ['discoveries'],
    queryFn: async () => {
      const res = await fetch(`/api/discoveries`);
      if (!res.ok) throw new Error('Failed to fetch discoveries');
      return res.json();
    },
  });

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--background)]">
      {isLoading ? (
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 bg-[var(--background)]">
          <Loader2 className="size-6 animate-spin text-[var(--accent)]" />
          <div className="text-sm font-medium text-[var(--muted)]">Loading terrain archive</div>
        </div>
      ) : discoveries.length === 0 ? (
        <div className="relative z-20 flex h-full w-full items-center justify-center p-6">
          <EmptyState
            icon={<Mountain className="size-6" />}
            title="No discoveries yet"
            description="Capture your first mountain, route, media link, or coordinate set to start building the archive."
            action={
              <Button type="button" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i', ctrlKey: true }))}>
                <Plus className="size-4" />
                New discovery
              </Button>
            }
          />
        </div>
      ) : (
        <MapEngine
          discoveries={discoveries.filter((d) => d.latitude != null && d.longitude != null) as DiscoveryMapItem[]}
          activeDossierId={activeDossierId}
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
