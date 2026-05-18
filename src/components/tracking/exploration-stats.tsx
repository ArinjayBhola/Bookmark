'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getExplorationStats, getDiscoveries, deleteDiscovery } from '@/app/actions/discovery';
import { Mountain, Trash2, Bookmark, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileType } from '@/db/enums';
import { useRouter } from 'next/navigation';

interface MediaItem {
  name: string;
  fileType: FileType;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  id?: string;
}

interface DiscoveryChronologyItem {
  id: string;
  name: string;
  region?: string | null;
  country?: string | null;
  category: string;
  elevation?: number | null;
  explorationStatus: string;
  createdAt: Date | string;
  whySaved?: string | null;
  expeditionDreams?: string | null;
  externalLinks?: string[] | null;
  media?: MediaItem[];
  [key: string]: unknown;
}

export function ExplorationStats() {
  const [deleteConfirmItem, setDeleteConfirmItem] = React.useState<{ id: string; name: string } | null>(null);
  const [optimisticDeletedIds, setOptimisticDeletedIds] = React.useState<string[]>([]);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['exploration-stats'],
    queryFn: () => getExplorationStats(),
    placeholderData: (previousData) => previousData,
  });

  const { data: discoveries = [], isLoading: discoveriesLoading } = useQuery({
    queryKey: ['discoveries-timeline'],
    queryFn: () => getDiscoveries(),
    placeholderData: (previousData) => previousData,
  });

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    const { id, name } = deleteConfirmItem;

    // 1. Instantly hide popup
    setDeleteConfirmItem(null);

    // 2. Instantly hide card from UI (optimistic update)
    setOptimisticDeletedIds((prev) => [...prev, id]);

    // 3. Background API deletion
    try {
      await deleteDiscovery(id);
      queryClient.invalidateQueries({ queryKey: ['discoveries-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['exploration-stats'] });
      queryClient.invalidateQueries({ queryKey: ['discoveries'] });
    } catch (error) {
      console.error('Delete error:', error);
      // Revert optimistic UI change
      setOptimisticDeletedIds((prev) => prev.filter((item) => item !== id));
      alert(`Failed to delete "${name}". Restoring bookmark.`);
    }
  };

  if (statsLoading || discoveriesLoading || !stats) {
    return (
      <div className="max-w-6xl mx-auto p-8 space-y-8 animate-pulse bg-[#fafafa] min-h-screen">
        <div className="h-8 bg-zinc-200 w-1/3 rounded-xl" />
        <div className="h-72 bg-zinc-200 rounded-2xl" />
      </div>
    );
  }

  const visibleDiscoveries = discoveries.filter((d: DiscoveryChronologyItem) => !optimisticDeletedIds.includes(d.id));

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-8 bg-[#fafafa] min-h-screen text-zinc-900 font-sans">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6 flex items-baseline justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold font-serif text-zinc-900 flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-xl text-sky-600 shadow-sm">
              <Bookmark className="size-6" />
            </div>
            <span>My Dream Mountain Bookmarks</span>
          </h1>
          <p className="text-sm text-zinc-500">
            Your personal curated bucket list of breathtaking alpine locations saved from Instagram, Reddit, and across the web.
          </p>
        </div>
        <div className="text-right font-medium text-sm text-zinc-500 bg-white border border-zinc-200 px-5 py-3 rounded-2xl shadow-sm">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">TOTAL SAVED DREAMS</div>
          <div className="text-3xl font-bold text-sky-600">{stats.total}</div>
        </div>
      </div>

      {/* Saved Mountain Discoveries List with Delete */}
      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
        <div className="text-sm font-bold font-serif text-zinc-800 uppercase tracking-wider border-b border-zinc-100 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="size-5 text-sky-500" />
            <span>📌 Saved Mountain Discoveries</span>
          </div>
          <span className="text-xs text-zinc-500 font-medium">Manage your personal mountain bucket list</span>
        </div>

        <div className="space-y-4 pt-2">
          {visibleDiscoveries.map((d: DiscoveryChronologyItem) => (
            <div
              key={d.id}
              onClick={() => router.push(`/dossier/${d.id}`)}
              className="flex items-center justify-between p-5 bg-zinc-50 rounded-2xl border border-zinc-200 transition-all hover:border-zinc-300 hover:shadow-sm group cursor-pointer"
            >
              <div className="flex items-center gap-5 min-w-0 pr-4 flex-1">
                <div className="p-3.5 bg-sky-50 border border-sky-100 text-sky-600 rounded-xl shrink-0">
                  <Mountain className="size-5" />
                </div>
                <div className="truncate space-y-1 min-w-0 flex-1">
                  <div className="text-base font-bold font-serif text-zinc-900 truncate group-hover:text-sky-600 transition-colors flex items-center gap-2">
                    <span>{d.name}</span>
                    {d.externalLinks && d.externalLinks.length > 0 && (
                      <a
                        href={d.externalLinks[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-sky-500 hover:underline inline-flex items-center gap-0.5 font-sans font-medium"
                      >
                        <ExternalLink className="size-3" /> Link
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 font-medium truncate flex items-center gap-2">
                    <span>{d.region || d.country || 'Unknown Range'}</span>
                    <span>•</span>
                    <span className="text-zinc-700">{d.category}</span>
                    {d.whySaved && (
                      <>
                        <span>•</span>
                        <span className="text-zinc-500 italic truncate">&quot;{d.whySaved}&quot;</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {d.elevation && <div className="text-sm font-bold text-zinc-700 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-xs">{d.elevation.toLocaleString()}m</div>}
                <div className="text-xs bg-white px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 font-bold shadow-xs">
                  {d.explorationStatus.replace('_', ' ')}
                </div>
                <div className="text-xs text-zinc-400 font-medium mr-2">{new Date(d.createdAt).toLocaleDateString()}</div>

                {/* Actions: Delete Icon */}
                <div className="flex items-center gap-1.5 border-l border-zinc-200 pl-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmItem({ id: d.id, name: d.name });
                    }}
                    className="size-8 p-0 text-zinc-600 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-zinc-200 shadow-none hover:shadow-2xs transition-all"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Deletion Confirmation Modal */}
      <Dialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)}>
        <DialogContent className="max-w-md bg-white border border-zinc-200 shadow-2xl rounded-3xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold font-serif text-zinc-900 flex items-center gap-2">
              <Trash2 className="size-5 text-red-600" />
              <span>Confirm Bookmark Deletion</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-600">
              Are you sure you want to delete <strong className="text-zinc-900 font-semibold">&quot;{deleteConfirmItem?.name}&quot;</strong> from your dream locations? This action will remove it from your personal bucket list.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmItem(null)}
              className="rounded-xl text-xs font-bold px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="rounded-xl text-xs font-bold px-4 py-2 bg-red-600 hover:bg-red-700 text-white shadow-md"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
