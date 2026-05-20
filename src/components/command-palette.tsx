'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Search, MapPin, Compass, Plus, BarChart2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenQuickAdd: () => void;
  onSelectDiscovery: (id: string) => void;
}

interface DiscoverySearchItem {
  id: string;
  name: string;
  region?: string | null;
  country?: string | null;
  elevation?: number | null;
}

export function CommandPalette({ open, onOpenChange, onOpenQuickAdd, onSelectDiscovery }: CommandPaletteProps) {
  const [search, setSearch] = React.useState('');
  const [activeItemIndex, setActiveItemIndex] = React.useState(0);
  const router = useRouter();

  const { data: discoveries = [], isLoading } = useQuery<DiscoverySearchItem[]>({
    queryKey: ['discoveries-search', search],
    queryFn: async () => {
      const res = await fetch(`/api/discoveries?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Failed to fetch discoveries');
      return res.json();
    },
    enabled: open,
  });

  const handleSelectAction = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  // Compile selectable items list to calculate total item count
  const totalItemsCount = React.useMemo(() => {
    const quickActionsCount = search.trim() === '' ? 3 : 0;
    return quickActionsCount + discoveries.length;
  }, [search, discoveries]);

  // Reset index when search or modal open state changes
  React.useEffect(() => {
    setActiveItemIndex(0);
  }, [search, open]);

  // Handle keyboard events (ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (totalItemsCount === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveItemIndex((prev) => (prev + 1) % totalItemsCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveItemIndex((prev) => (prev - 1 + totalItemsCount) % totalItemsCount);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = activeItemIndex;
      if (search.trim() === '') {
        if (idx === 0) {
          handleSelectAction(onOpenQuickAdd);
        } else if (idx === 1) {
          handleSelectAction(() => router.push('/'));
        } else if (idx === 2) {
          handleSelectAction(() => router.push('/tracking'));
        } else {
          const discoveryIdx = idx - 3;
          const disc = discoveries[discoveryIdx];
          if (disc) {
            handleSelectAction(() => onSelectDiscovery(disc.id));
          }
        }
      } else {
        const disc = discoveries[idx];
        if (disc) {
          handleSelectAction(() => onSelectDiscovery(disc.id));
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden bg-[#f6f5f2] border-stone-300 shadow-2xl">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <div className="flex items-center border-b border-stone-300 px-3">
          <Search className="size-5 text-stone-500 mr-2 shrink-0" />
          <input
            type="text"
            className="flex h-14 w-full bg-transparent py-3 text-base outline-none placeholder:text-stone-500 text-stone-900"
            placeholder="Search mountain intelligence, coordinates, regions, or type a command..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
          {/* Quick Actions */}
          {search.trim() === '' && (
            <div>
              <div className="px-2 py-1 text-xs font-semibold text-stone-500 uppercase tracking-wider">Quick Commands</div>
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => handleSelectAction(onOpenQuickAdd)}
                  onMouseEnter={() => setActiveItemIndex(0)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-stone-800 transition-colors text-left font-medium ${
                    activeItemIndex === 0 ? 'bg-stone-200/90 text-stone-950 font-bold shadow-2xs' : 'hover:bg-stone-200/50'
                  }`}
                >
                  <Plus className="size-4 text-stone-600" />
                  <span>Instant Capture Discovery</span>
                  <kbd className="ml-auto text-xs bg-stone-300 px-1.5 py-0.5 rounded text-stone-700">Ctrl+I</kbd>
                </button>
                <button
                  onClick={() => handleSelectAction(() => router.push('/'))}
                  onMouseEnter={() => setActiveItemIndex(1)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-stone-800 transition-colors text-left font-medium ${
                    activeItemIndex === 1 ? 'bg-stone-200/90 text-stone-950 font-bold shadow-2xs' : 'hover:bg-stone-200/50'
                  }`}
                >
                  <Compass className="size-4 text-stone-600" />
                  <span>Explore Immersive Map</span>
                  <kbd className="ml-auto text-xs bg-stone-300 px-1.5 py-0.5 rounded text-stone-700">⌥M</kbd>
                </button>
                <button
                  onClick={() => handleSelectAction(() => router.push('/tracking'))}
                  onMouseEnter={() => setActiveItemIndex(2)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-stone-800 transition-colors text-left font-medium ${
                    activeItemIndex === 2 ? 'bg-stone-200/90 text-stone-950 font-bold shadow-2xs' : 'hover:bg-stone-200/50'
                  }`}
                >
                  <BarChart2 className="size-4 text-stone-600" />
                  <span>Exploration Tracking & Stats</span>
                  <kbd className="ml-auto text-xs bg-stone-300 px-1.5 py-0.5 rounded text-stone-700">⌥T</kbd>
                </button>

              </div>
            </div>
          )}

          {/* Search Results */}
          <div>
            <div className="px-2 py-1 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {search.trim() === '' ? 'Recent Discoveries' : 'Matching Intelligence'}
            </div>
            {isLoading ? (
              <div className="p-4 text-center text-sm text-stone-500 animate-pulse">Scanning terrain database...</div>
            ) : discoveries.length === 0 ? (
              <div className="p-4 text-center text-sm text-stone-500">No mountain records found matching &quot;{search}&quot;.</div>
            ) : (
              <div className="mt-1 space-y-1">
                {discoveries.map((d, idx) => {
                  const globalIdx = search.trim() === '' ? 3 + idx : idx;
                  const isActive = activeItemIndex === globalIdx;
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleSelectAction(() => onSelectDiscovery(d.id))}
                      onMouseEnter={() => setActiveItemIndex(globalIdx)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-stone-800 transition-colors text-left ${
                        isActive ? 'bg-stone-200/90 text-stone-950 font-bold shadow-2xs' : 'hover:bg-stone-200/50'
                      }`}
                    >
                      <MapPin className="size-4 text-stone-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-stone-900 truncate">{d.name}</div>
                        <div className="text-xs text-stone-600 truncate flex items-center gap-2 mt-0.5">
                          <span>{d.region || d.country || 'Unknown Region'}</span>
                          {d.elevation && (
                            <>
                              <span>•</span>
                              <span>{d.elevation.toLocaleString()}m</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#e8e6dd] px-4 py-2 text-xs text-stone-600 flex items-center justify-between border-t border-stone-300 font-mono">
          <div>
            <span className="font-bold">esc</span> to close
          </div>
          <div className="flex gap-4">
            <span>
              <kbd className="bg-stone-300 px-1 py-0.5 rounded text-stone-800">↑</kbd> <kbd className="bg-stone-300 px-1 py-0.5 rounded text-stone-800">↓</kbd> navigate
            </span>
            <span>
              <kbd className="bg-stone-300 px-1 py-0.5 rounded text-stone-800">↵</kbd> select
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
