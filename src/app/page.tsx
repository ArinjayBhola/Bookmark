'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapEngine } from '@/components/map/map-engine';
import { Loader2, Mountain, Plus, Search, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

interface MediaItem {
  id: string;
  fileType: string;
  url: string;
  name: string;
}

interface DiscoveryMapItem {
  id: string;
  name: string;
  localName?: string | null;
  elevation?: number | null;
  latitude: number;
  longitude: number;
  region?: string | null;
  state?: string | null;
  country?: string | null;
  difficulty?: 'EASY' | 'MODERATE' | 'STRENUOUS' | 'TECHNICAL' | 'EXTREME' | null;
  media?: MediaItem[];
}

interface HomePageProps {
  onSelectDiscovery?: (id: string) => void;
  activeDossierId?: string | null;
}


export default function HomePage({ onSelectDiscovery, activeDossierId }: HomePageProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');


  const { data: discoveries = [], isLoading } = useQuery<DiscoveryMapItem[]>({
    queryKey: ['discoveries'],
    queryFn: async () => {
      const res = await fetch(`/api/discoveries`);
      if (!res.ok) throw new Error('Failed to fetch discoveries');
      return res.json();
    },
  });

  const validDiscoveries = React.useMemo(() => {
    return discoveries.filter((d) => d.latitude != null && d.longitude != null);
  }, [discoveries]);

  // Apply Client filters
  const filteredDiscoveries = React.useMemo(() => {
    return validDiscoveries.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.localName && d.localName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.region && d.region.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.country && d.country.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [validDiscoveries, searchQuery]);

  const handleSelect = (id: string) => {
    if (onSelectDiscovery) {
      onSelectDiscovery(id);
    } else {
      router.push(`/dossier/${id}`);
    }
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[var(--background)]">
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
        <>
          {/* Collapsible Sidebar */}
          <div
            className={`relative z-20 flex h-full shrink-0 flex-col border-r bg-[var(--surface)]/95 shadow-lg backdrop-blur-md transition-all duration-300 ${
              sidebarOpen ? 'w-80 md:w-96' : 'w-0 overflow-hidden border-r-0'
            }`}
          >
            {/* Sidebar Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
              <div>
                <h2 className="text-md font-bold tracking-tight text-[var(--foreground)]">Expedition Directory</h2>
                <p className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">
                  {filteredDiscoveries.length} of {validDiscoveries.length} vaulted
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                title="Collapse sidebar"
              >
                <ChevronLeft className="size-4" />
              </button>
            </div>

            {/* Filter controls */}
            <div className="space-y-3 border-b p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
                <Input
                  type="text"
                  placeholder="Filter by name, region..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            {/* Discoveries list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-premium">
              {filteredDiscoveries.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--muted)] font-medium">
                  No matching discoveries vaulted.
                </div>
              ) : (
                filteredDiscoveries.map((discovery) => {
                  const isActive = activeDossierId === discovery.id;
                  const firstImage = discovery.media?.find((m) => m.fileType === 'IMAGE');
                  const locationString = [discovery.region, discovery.country].filter(Boolean).join(', ');

                  return (
                    <div
                      key={discovery.id}
                      onClick={() => handleSelect(discovery.id)}
                      className={`group flex cursor-pointer gap-3 rounded-[var(--radius-md)] border p-2.5 transition ${
                        isActive
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)]/20 shadow-xs'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:shadow-xs'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
                        {firstImage ? (
                          <Image
                            src={firstImage.url}
                            alt={discovery.name}
                            fill
                            sizes="56px"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[var(--accent)]">
                            <Mountain className="size-5" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className={`truncate text-xs font-bold leading-tight ${
                            isActive ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'
                          }`}>
                            {discovery.name}
                          </h3>
                          {discovery.elevation && (
                            <span className="shrink-0 font-mono text-[10px] font-bold text-[var(--muted)]">
                              {discovery.elevation}m
                            </span>
                          )}
                        </div>

                        {locationString && (
                          <div className="flex items-center gap-1 text-[10px] text-[var(--muted)] font-medium truncate">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{locationString}</span>
                          </div>
                        )}


                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Floating Expand Button when Sidebar is closed */}
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="absolute left-4 top-4 z-20 flex size-9 items-center justify-center rounded-[var(--radius-md)] border bg-[var(--surface)]/95 shadow-md backdrop-blur transition hover:bg-[var(--surface-muted)] focus:outline-none"
              title="Open Expedition Directory"
            >
              <ChevronRight className="size-4 text-[var(--foreground)]" />
            </button>
          )}

          {/* Map Area */}
          <div className="relative flex-1">
            <MapEngine
              discoveries={validDiscoveries}
              activeDossierId={activeDossierId}
              onSelectDiscovery={handleSelect}
            />
          </div>
        </>
      )}
    </div>
  );
}
