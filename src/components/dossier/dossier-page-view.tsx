'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Cloud,
  Compass,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  MapPin,
  Mountain,
  Play,
  Route,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { deleteDiscovery } from '@/app/actions/discovery';
import { CaptureForm } from '@/components/capture-form';
import { GPXViewer } from '@/components/dossier/gpx-viewer';
import { WeatherWidget } from '@/components/dossier/weather-widget';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SectionHeader, StatCard, Surface } from '@/components/ui/surface';
import { FileType } from '@/db/enums';

interface MediaItem {
  id: string;
  fileType: FileType | string;
  url: string;
  name: string;
  key?: string;
  size?: number;
  mimeType?: string;
}

interface CaptureFormMediaItem {
  name: string;
  fileType: FileType;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  id?: string;
}

interface CaptureFormData {
  id?: string;
  media?: CaptureFormMediaItem[];
  externalLinks?: string[];
  customInfo?: unknown;
  [key: string]: unknown;
}

interface DossierPageViewProps {
  initialDiscovery: {
    id: string;
    name: string;
    localName?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    elevation?: number | null;
    region?: string | null;
    state?: string | null;
    country?: string | null;
    routeNotes?: string | null;
    difficulty?: string | null;
    technicality?: string | null;
    bestSeason?: string | null;
    waterSources?: string | null;
    campsites?: string | null;
    permits?: string | null;
    riskNotes?: string | null;
    acclimatization?: string | null;
    altitudeGain?: number | null;
    crowdLevel?: string | null;
    remotenessScore?: number | null;
    whySaved?: string | null;
    expeditionDreams?: string | null;
    futureIdeas?: string | null;
    emotionalNotes?: string | null;
    comparisons?: string | null;
    externalLinks?: string[] | null;
    media?: MediaItem[];
    customInfo?: unknown;
    [key: string]: unknown;
  };
}

export function DossierPageView({ initialDiscovery }: DossierPageViewProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = React.useState<{ id: string; name: string } | null>(null);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [enlargedMedia, setEnlargedMedia] = React.useState<MediaItem | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const discovery = initialDiscovery;

  const images = (discovery.media || []).filter((m) => m.fileType === 'IMAGE');
  const videos = (discovery.media || []).filter((m) => m.fileType === 'VIDEO');
  const gpxFiles = (discovery.media || []).filter((m) => m.fileType === 'GPX');
  const documents = (discovery.media || []).filter((m) => m.fileType === 'DOCUMENT');
  const visualMedia = [...images, ...videos];
  const fallbackMedia: MediaItem = {
    id: 'fallback-bg',
    fileType: 'IMAGE',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop',
    name: 'Mountain ridge',
  };
  const availableMedia = visualMedia.length > 0 ? visualMedia : [fallbackMedia];
  const [activeMediaId, setActiveMediaId] = React.useState(availableMedia[0]?.id || fallbackMedia.id);
  const activeMedia = availableMedia.find((m) => m.id === activeMediaId) || availableMedia[0] || fallbackMedia;
  const location = [discovery.region, discovery.state, discovery.country].filter(Boolean).join(', ') || 'Location not specified';

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    const { id, name } = deleteConfirmItem;
    setDeleteConfirmItem(null);

    try {
      await deleteDiscovery(id);
      queryClient.invalidateQueries({ queryKey: ['discoveries'] });
      queryClient.invalidateQueries({ queryKey: ['discoveries-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['exploration-stats'] });
      router.push('/tracking');
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete "${name}". Please try again.`);
    }
  };

  const handleCopy = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    window.setTimeout(() => setCopiedField(null), 2000);
  };

  if (isEditing) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <Surface className="space-y-6 p-5 sm:p-6">
          <SectionHeader
            eyebrow="Edit dossier"
            title={discovery.name}
            description="Update terrain data, coordinates, planning notes, and media."
            action={<Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>}
          />
          <CaptureForm
            initialData={discovery as unknown as CaptureFormData}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['discoveries'] });
              queryClient.invalidateQueries({ queryKey: ['discoveries-timeline'] });
              queryClient.invalidateQueries({ queryKey: ['exploration-stats'] });
              router.refresh();
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        </Surface>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => router.push('/tracking')}>
          <ArrowLeft className="size-4" />
          Tracking
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit3 className="size-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteConfirmItem({ id: discovery.id, name: discovery.name })}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <Surface className="overflow-hidden">
          <button
            type="button"
            onClick={() => setEnlargedMedia(activeMedia)}
            className="group relative block h-[360px] w-full overflow-hidden bg-[var(--surface-muted)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:h-[520px]"
          >
            {activeMedia.fileType === 'VIDEO' ? (
              <video src={getMediaUrl(activeMedia)} controls muted loop className="h-full w-full object-cover" />
            ) : (
              <Image src={getMediaUrl(activeMedia)} alt={activeMedia.name || discovery.name} fill sizes="(max-width: 1024px) 100vw, 840px" className="object-cover transition duration-500 group-hover:scale-[1.02]" priority />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-black/55 p-5 text-white backdrop-blur-sm sm:p-6">
              <p className="text-sm font-medium text-white/80">{location}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">{discovery.name}</h1>
              {discovery.localName ? <p className="mt-2 text-base text-white/85">{discovery.localName}</p> : null}
            </div>
          </button>
        </Surface>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Elevation" value={discovery.elevation ? `${formatNumber(discovery.elevation)}m` : 'No data'} icon={<Mountain className="size-4" />} />
            <StatCard label="Gain" value={discovery.altitudeGain ? `${formatNumber(discovery.altitudeGain)}m` : 'No data'} icon={<Route className="size-4" />} />
            <StatCard label="Difficulty" value={formatEnum(discovery.difficulty) || 'Unrated'} icon={<ShieldAlert className="size-4" />} />
            <StatCard label="Remote" value={discovery.remotenessScore ? `${discovery.remotenessScore}/10` : 'No data'} icon={<Compass className="size-4" />} />
          </div>

          <Surface className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="size-4 text-[var(--accent)]" />
              Location
            </div>
            <CopyRow label="Region" value={discovery.region || 'Unspecified'} copiedField={copiedField} onCopy={handleCopy} />
            <CopyRow label="State" value={discovery.state || 'Unspecified'} copiedField={copiedField} onCopy={handleCopy} />
            <CopyRow label="Country" value={discovery.country || 'Unspecified'} copiedField={copiedField} onCopy={handleCopy} />
            {discovery.latitude != null && discovery.longitude != null ? (
              <CopyRow label="Coordinates" value={`${discovery.latitude.toFixed(5)}, ${discovery.longitude.toFixed(5)}`} copiedField={copiedField} onCopy={handleCopy} />
            ) : null}
          </Surface>
        </div>
      </section>

      {availableMedia.length > 1 ? (
        <Surface className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Media gallery</h2>
            <span className="text-xs text-[var(--muted)]">{availableMedia.length} items</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-premium">
            {availableMedia.map((media) => {
              const isSelected = activeMedia.id === media.id;
              return (
                <button
                  key={media.id}
                  type="button"
                  onClick={() => setActiveMediaId(media.id)}
                  className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-[var(--radius-md)] border transition ${isSelected ? 'border-[var(--accent)] ring-2 ring-[var(--accent-soft)]' : 'hover:border-[var(--border-strong)]'}`}
                  aria-label={`View ${media.name}`}
                >
                  {media.fileType === 'VIDEO' ? (
                    <>
                      <video src={getMediaUrl(media)} className="h-full w-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                        <Play className="size-5 fill-current" />
                      </span>
                    </>
                  ) : (
                    <Image src={getMediaUrl(media)} alt={media.name || 'Thumbnail'} fill sizes="112px" className="object-cover" />
                  )}
                </button>
              );
            })}
          </div>
        </Surface>
      ) : null}

      {discovery.latitude != null && discovery.longitude != null ? (
        <Surface className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Cloud className="size-4 text-[var(--accent)]" />
            Weather telemetry
          </div>
          <WeatherWidget latitude={discovery.latitude} longitude={discovery.longitude} elevation={discovery.elevation} />
        </Surface>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <InfoSection
          title="Route intelligence"
          items={[
            ['Route notes', discovery.routeNotes],
            ['Technicality', discovery.technicality],
            ['Best season', discovery.bestSeason],
            ['Water sources', discovery.waterSources],
            ['Campsites', discovery.campsites],
            ['Permits', discovery.permits],
            ['Acclimatization', discovery.acclimatization],
            ['Crowd level', discovery.crowdLevel],
          ]}
        />
        <InfoSection
          title="Planning notes"
          items={[
            ['Why saved', discovery.whySaved],
            ['Expedition dreams', discovery.expeditionDreams],
            ['Future ideas', discovery.futureIdeas],
            ['Emotional notes', discovery.emotionalNotes],
            ['Comparisons', discovery.comparisons],
            ['Risk notes', discovery.riskNotes],
          ]}
        />
      </section>

      {Array.isArray(discovery.customInfo) && discovery.customInfo.length > 0 ? (
        <Surface className="space-y-3 p-5">
          <h2 className="text-sm font-semibold">Custom fields</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {discovery.customInfo.map((info: { label: string; value: string }, index: number) => (
              <CopyRow key={`${info.label}-${index}`} label={info.label} value={info.value} copiedField={copiedField} onCopy={handleCopy} />
            ))}
          </div>
        </Surface>
      ) : null}

      {discovery.externalLinks && discovery.externalLinks.length > 0 ? (
        <Surface className="space-y-3 p-5">
          <h2 className="text-sm font-semibold">External references</h2>
          <div className="grid gap-2">
            {discovery.externalLinks.map((link, index) => (
              <a key={`${link}-${index}`} href={link} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-3 rounded-[var(--radius-md)] border bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--foreground)] hover:border-[var(--border-strong)]">
                <ExternalLink className="size-4 shrink-0 text-[var(--accent)]" />
                <span className="truncate">{link}</span>
              </a>
            ))}
          </div>
        </Surface>
      ) : null}

      {gpxFiles.map((gpx) => (
        <GPXViewer key={gpx.id} url={getMediaUrl(gpx)} name={discovery.name} />
      ))}

      {documents.length > 0 ? (
        <Surface className="space-y-3 p-5">
          <h2 className="text-sm font-semibold">Documents</h2>
          <div className="grid gap-2">
            {documents.map((doc) => (
              <a key={doc.id} href={getMediaUrl(doc)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border bg-[var(--surface-muted)] px-3 py-2 text-sm hover:border-[var(--border-strong)]">
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-[var(--accent)]" />
                  <span className="truncate font-medium">{doc.name}</span>
                </span>
                <span className="shrink-0 text-xs text-[var(--muted)]">Open</span>
              </a>
            ))}
          </div>
        </Surface>
      ) : null}

      <DeleteDialog item={deleteConfirmItem} onClose={() => setDeleteConfirmItem(null)} onConfirm={handleConfirmDelete} />

      <Dialog open={!!enlargedMedia} onOpenChange={(open) => !open && setEnlargedMedia(null)}>
        <DialogContent className="max-w-5xl border-[var(--border)] bg-[var(--surface)] p-4">
          <DialogHeader>
            <DialogTitle>{enlargedMedia?.name || 'Media preview'}</DialogTitle>
            <DialogDescription>Saved visual reference for this dossier.</DialogDescription>
          </DialogHeader>
          {enlargedMedia ? (
            <div className="relative h-[70vh] overflow-hidden rounded-[var(--radius-lg)] bg-black">
              {enlargedMedia.fileType === 'VIDEO' ? (
                <video src={getMediaUrl(enlargedMedia)} controls autoPlay className="h-full w-full object-contain" />
              ) : (
                <Image src={getMediaUrl(enlargedMedia)} alt={enlargedMedia.name || 'Preview'} fill sizes="100vw" className="object-contain" />
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copiedField,
  onCopy,
}: {
  label: string;
  value: string;
  copiedField: string | null;
  onCopy: (label: string, value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(label, value)}
      className="flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-md)] border bg-[var(--surface-muted)] px-3 py-2 text-left transition hover:border-[var(--border-strong)]"
    >
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase text-[var(--muted)]">{label}</span>
        <span className="block truncate text-sm font-medium text-[var(--foreground)]">{value}</span>
      </span>
      {copiedField === label ? <span className="text-xs font-semibold text-[var(--accent)]">Copied</span> : <Copy className="size-4 shrink-0 text-[var(--muted)]" />}
    </button>
  );
}

function InfoSection({ title, items }: { title: string; items: Array<[string, string | null | undefined]> }) {
  const visibleItems = items.filter(([, value]) => value && value.trim());

  return (
    <Surface className="space-y-4 p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {visibleItems.length > 0 ? (
        <div className="space-y-4">
          {visibleItems.map(([label, value]) => (
            <div key={label} className="space-y-1 border-b pb-4 last:border-b-0 last:pb-0">
              <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">{label}</h3>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">No notes captured yet.</p>
      )}
    </Surface>
  );
}

function DeleteDialog({
  item,
  onClose,
  onConfirm,
}: {
  item: { id: string; name: string } | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete discovery</DialogTitle>
          <DialogDescription>
            This removes &quot;{item?.name}&quot; from your saved discoveries.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getMediaUrl(media: MediaItem) {
  if (!media.url) return '';
  if (!media.url.includes('.r2.cloudflarestorage.com')) return media.url;

  try {
    const urlObj = new URL(media.url);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    const key = parts.slice(1).join('/');
    return `/api/media?key=${encodeURIComponent(key)}`;
  } catch {
    return media.url;
  }
}

function formatEnum(value?: string | null) {
  if (!value) return '';
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}
