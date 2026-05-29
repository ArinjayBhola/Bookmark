'use client';

import * as React from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Bookmark, CalendarDays, ChevronLeft, ChevronRight, ExternalLink, MapPin, Mountain, Search, Trash2, Globe } from 'lucide-react';
import { deleteDiscovery } from '@/app/actions/discovery';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EmptyState, SectionHeader, StatCard, Surface } from '@/components/ui/surface';
import { Input } from '@/components/ui/input';
import { FileType } from '@/db/enums';

interface MediaItem {
  name: string;
  fileType: FileType | string;
  url: string;
  key?: string;
  size?: number;
  mimeType?: string;
  id?: string;
}

interface DiscoveryChronologyItem {
  id: string;
  name: string;
  localName?: string | null;
  region?: string | null;
  state?: string | null;
  country?: string | null;
  elevation?: number | null;
  createdAt: Date | string;
  whySaved?: string | null;
  expeditionDreams?: string | null;
  externalLinks?: string[] | null;
  media?: MediaItem[];
  [key: string]: unknown;
}

interface ExplorationStatsData {
  total: number;
  statusCounts: Record<string, number>;
  difficultyCounts: Record<string, number>;
  regionCounts: Record<string, number>;
  totalAltitudeGain: number;
  highestElevation: number;
}

interface DiscoveriesPageData {
  items: DiscoveryChronologyItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export function ExplorationStats({
  stats,
  discoveriesPage,
  search,
}: {
  stats: ExplorationStatsData;
  discoveriesPage: DiscoveriesPageData;
  search: string;
}) {
  const [deleteConfirmItem, setDeleteConfirmItem] = React.useState<{ id: string; name: string } | null>(null);
  const [optimisticDeletedIds, setOptimisticDeletedIds] = React.useState<string[]>([]);
  const [searchText, setSearchText] = React.useState(search);
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchText === search) return;
      startTransition(() => {
        const params = new URLSearchParams();
        if (searchText.trim()) params.set('search', searchText.trim());
        router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [pathname, router, search, searchText]);

  const visibleDiscoveries = discoveriesPage.items.filter((d) => !optimisticDeletedIds.includes(d.id));
  const firstItem = discoveriesPage.total === 0 ? 0 : (discoveriesPage.page - 1) * discoveriesPage.pageSize + 1;
  const lastItem = Math.min(discoveriesPage.page * discoveriesPage.pageSize, discoveriesPage.total);

  const goToPage = (page: number) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (page > 1) params.set('page', String(page));
      router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    const { id, name } = deleteConfirmItem;
    setDeleteConfirmItem(null);
    setOptimisticDeletedIds((prev) => [...prev, id]);

    try {
      await deleteDiscovery(id);
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      setOptimisticDeletedIds((prev) => prev.filter((item) => item !== id));
      alert(`Failed to delete "${name}". Restoring bookmark.`);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <SectionHeader
        eyebrow="Tracking"
        title="Saved discoveries"
        description="Searchable, paginated planning records for routes, references, and mountain ideas."
        action={
          <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
            <StatCard label="Saved" value={stats.total} icon={<Bookmark className="size-4" />} />
            <StatCard label="Highest" value={stats.highestElevation ? `${formatNumber(stats.highestElevation)}m` : 'No data'} icon={<Mountain className="size-4" />} />
          </div>
        }
      />

      {/* Geographic Coverage Matrix */}
      <Surface className="p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Globe className="size-4 text-[var(--accent)]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Geographic Coverage Matrix</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Object.keys(stats.regionCounts).length === 0 ? (
            <div className="col-span-full text-center py-6 text-xs text-[var(--muted)]">No regional data.</div>
          ) : (
            Object.entries(stats.regionCounts).map(([region, count]) => (
              <div key={region} className="rounded-[var(--radius-sm)] border bg-[var(--surface-muted)] p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[var(--muted)] text-[10px] font-bold uppercase truncate">
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">{region || 'Unspecified'}</span>
                </div>
                <div className="text-lg font-mono font-bold text-[var(--foreground)]">{count}</div>
                <div className="text-[9px] text-[var(--muted)]">locations vaulted</div>
              </div>
            ))
          )}
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="grid gap-4 border-b p-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by name, range, country, notes..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)] lg:justify-end">
            <span>{isPending ? 'Updating...' : `${firstItem}-${lastItem} of ${discoveriesPage.total}`}</span>
            {search ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setSearchText('')}>
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        {visibleDiscoveries.length === 0 ? (
          <EmptyState
            className="my-10 border-0 shadow-none"
            icon={<Mountain className="size-6" />}
            title={search ? 'No matches found' : 'No saved discoveries'}
            description={search ? 'Try a different place, region, or planning note.' : 'Use Add in the header to capture your first destination.'}
          />
        ) : (
          <div className="grid gap-3 p-4">
            {visibleDiscoveries.map((d) => (
              <DiscoveryCard
                key={d.id}
                discovery={d}
                onOpen={() => router.push(`/dossier/${d.id}`)}
                onDelete={() => setDeleteConfirmItem({ id: d.id, name: d.name })}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--muted)]">
            Page {discoveriesPage.page} of {discoveriesPage.pageCount}
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={discoveriesPage.page <= 1 || isPending} onClick={() => goToPage(discoveriesPage.page - 1)}>
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={discoveriesPage.page >= discoveriesPage.pageCount || isPending} onClick={() => goToPage(discoveriesPage.page + 1)}>
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Surface>

      <Dialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete discovery</DialogTitle>
            <DialogDescription>
              This removes &quot;{deleteConfirmItem?.name}&quot; from your saved discoveries.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmItem(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DiscoveryCard({
  discovery,
  onOpen,
  onDelete,
}: {
  discovery: DiscoveryChronologyItem;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const image = discovery.media?.find((item) => item.fileType === 'IMAGE');
  const location = [discovery.region, discovery.state, discovery.country].filter(Boolean).join(', ') || 'Unknown range';

  return (
    <article
      onClick={onOpen}
      className="group grid cursor-pointer gap-4 rounded-[var(--radius-lg)] border bg-[var(--surface)] p-3 shadow-sm transition hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-soft)] sm:grid-cols-[128px_1fr_auto]"
    >
      <div className="relative h-32 overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-muted)] sm:h-full">
        {image ? (
          <Image src={getMediaUrl(image)} alt={image.name || discovery.name} fill sizes="128px" className="object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--accent)]">
            <Mountain className="size-8" />
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-3 py-1">
        <div className="space-y-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-lg font-semibold tracking-tight text-[var(--foreground)]">{discovery.name}</h2>
            {discovery.externalLinks && discovery.externalLinks.length > 0 ? (
              <a
                href={discovery.externalLinks[0]}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-xs)] px-1.5 py-0.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)]"
              >
                <ExternalLink className="size-3" />
                Link
              </a>
            ) : null}
          </div>
          {discovery.localName ? <p className="truncate text-sm text-[var(--muted)]">{discovery.localName}</p> : null}
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-[var(--muted)]">
          {discovery.whySaved || discovery.expeditionDreams || 'No planning note yet.'}
        </p>

        <div className="flex flex-wrap gap-2 text-xs font-medium text-[var(--muted-foreground)]">
          <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-2.5 py-1">
            <MapPin className="size-3.5" />
            {location}
          </span>
          {discovery.elevation ? (
            <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-2.5 py-1">
              <Mountain className="size-3.5" />
              {formatNumber(discovery.elevation)}m
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-2.5 py-1">
            <CalendarDays className="size-3.5" />
            {formatDate(discovery.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete ${discovery.name}`}
          className="text-[var(--muted)] hover:text-[var(--danger)]"
        >
          <Trash2 className="size-4" />
        </Button>
        <ChevronRight className="size-4 text-[var(--muted)] transition group-hover:translate-x-0.5" />
      </div>
    </article>
  );
}

function getMediaUrl(media: MediaItem) {
  if (!media.url.includes('.r2.cloudflarestorage.com')) return media.url;
  const urlObj = new URL(media.url);
  const parts = urlObj.pathname.split('/').filter(Boolean);
  const key = parts.slice(1).join('/');
  return `/api/media?key=${encodeURIComponent(key)}`;
}

function formatDate(dateInput: Date | string): string {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}
