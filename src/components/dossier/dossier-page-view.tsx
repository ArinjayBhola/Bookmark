'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Compass, ExternalLink, ChevronRight, Edit3, Trash2, Play, Copy } from 'lucide-react';
import { GPXViewer } from '@/components/dossier/gpx-viewer';
import Image from 'next/image';
import { CaptureForm } from '@/components/capture-form';
import { deleteDiscovery } from '@/app/actions/discovery';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
    category: string;
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
    explorationStatus: string;
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

  const images = (discovery.media || []).filter((m: MediaItem) => m.fileType === 'IMAGE');
  const videos = (discovery.media || []).filter((m: MediaItem) => m.fileType === 'VIDEO');
  const gpxFiles = (discovery.media || []).filter((m: MediaItem) => m.fileType === 'GPX');
  const documents = (discovery.media || []).filter((m: MediaItem) => m.fileType === 'DOCUMENT');

  const visualMedia = [...images, ...videos];

  const fallbackMedia: MediaItem = {
    id: 'fallback-bg',
    fileType: 'IMAGE',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop',
    name: 'Cinematic Alpine Mountain',
  };

  const availableMedia = visualMedia.length > 0 ? visualMedia : [fallbackMedia];
  const [activeMediaId, setActiveMediaId] = React.useState<string>(availableMedia[0]?.id || 'fallback-bg');

  const activeMedia = availableMedia.find((m) => m.id === activeMediaId) || availableMedia[0] || fallbackMedia;

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
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getMediaUrl = (m: MediaItem) => {
    if (!m || !m.url) return '';
    if (m.url.includes('.r2.cloudflarestorage.com')) {
      const urlObj = new URL(m.url);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      const key = parts.slice(1).join('/');
      return `/api/media?key=${encodeURIComponent(key)}`;
    }
    return m.url;
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-3xl border border-zinc-200 shadow-xl my-8 space-y-6">
        <div className="border-b border-zinc-200 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-serif text-zinc-900">Editing Mountain Intelligence</h2>
            <p className="text-sm text-zinc-500">Update terrain data, coordinates, and expedition logistics.</p>
          </div>
        </div>
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
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8 bg-[#fafafa] min-h-screen text-zinc-900 font-sans">
      {/* Cinematic Hero Section (Main Big Image/Video Showcase) */}
      <div className="relative h-96 w-full bg-zinc-900 overflow-hidden rounded-3xl border border-zinc-200 shadow-xl flex items-center justify-center group/hero">
        {activeMedia.fileType === 'VIDEO' ? (
          <video
            src={getMediaUrl(activeMedia)}
            controls
            autoPlay
            muted
            loop
            className="w-full h-full object-cover opacity-95 transition-all duration-700"
          />
        ) : (
          <Image
            src={getMediaUrl(activeMedia)}
            alt={activeMedia.name || discovery.name}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover opacity-90 transition-all duration-700"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

        <div className="absolute top-6 left-6 flex gap-2.5 z-10 pointer-events-auto">
          <Badge variant="terrain" className="backdrop-blur-xl bg-white/90 text-sky-600 border border-zinc-200/50 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm">
            {discovery.category}
          </Badge>
          <Badge variant="status" className="backdrop-blur-xl bg-white/90 text-zinc-700 border border-zinc-200/50 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm">
            {discovery.explorationStatus.replace('_', ' ')}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2.5 pointer-events-auto">
          <Button
            onClick={() => setIsEditing(true)}
            className="backdrop-blur-xl bg-white/90 hover:bg-white text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2 font-bold shadow-md text-xs flex items-center gap-2 transition-all"
          >
            <Edit3 className="size-4 text-sky-500" /> Edit Dossier
          </Button>
          <Button
            onClick={() => setDeleteConfirmItem({ id: discovery.id, name: discovery.name })}
            className="backdrop-blur-xl bg-red-600/90 hover:bg-red-600 text-white border border-red-500 rounded-xl px-4 py-2 font-bold shadow-md text-xs flex items-center gap-2 transition-all"
          >
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>

        <div className="absolute bottom-8 left-8 right-8 z-10 pointer-events-auto">
          <div className="flex items-baseline justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold font-serif text-white drop-shadow-md">{discovery.name}</h1>
              {discovery.localName && <p className="text-lg font-serif italic text-white/90 drop-shadow-md">{discovery.localName}</p>}
            </div>
            {discovery.elevation && (
              <div className="text-right bg-white/90 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-lg border border-white/20">
                <div className="text-3xl font-bold text-zinc-900">{discovery.elevation.toLocaleString()}<span className="text-zinc-500 font-medium">m</span></div>
                <div className="text-xs uppercase text-zinc-500 tracking-wider font-semibold">Elevation</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Amazon/Flipkart Style Media Selector (Thumbnails Below Main Big Showcase) */}
      {availableMedia.length > 1 && (
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-3">
          <div className="text-xs font-bold font-serif text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <span>🖼️ Expedition Media Gallery ({availableMedia.length})</span>
            <span className="text-[10px] text-zinc-400 font-sans font-normal">• Click thumbnail to view main showcase</span>
          </div>
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-200">
            {availableMedia.map((m) => {
              const isSelected = activeMedia.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMediaId(m.id)}
                  className={`relative size-24 rounded-2xl overflow-hidden shrink-0 border-2 transition-all group ${
                    isSelected ? 'border-sky-500 ring-4 ring-sky-500/20 shadow-md' : 'border-zinc-200 hover:border-zinc-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  {m.fileType === 'VIDEO' ? (
                    <>
                      <video src={getMediaUrl(m)} className="w-full h-full object-cover pointer-events-none" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="p-1.5 bg-white/90 backdrop-blur-md rounded-full text-zinc-900 shadow-sm">
                          <Play className="size-3 fill-current" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <Image src={getMediaUrl(m)} alt={m.name || 'Thumbnail'} fill sizes="96px" className="object-cover" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Metadata Panels */}
      <div className="grid grid-cols-4 gap-6">
        <div
          onClick={() => handleCopy('State', discovery.state || 'Unspecified')}
          className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-1 hover:shadow-md transition-all cursor-pointer group relative"
        >
          <div className="text-xs text-zinc-500 font-bold uppercase flex items-center justify-between tracking-wider">
            <span className="flex items-center gap-1.5"><MapPin className="size-4 text-sky-500" /> State</span>
            {copiedField === 'State' ? (
              <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 animate-fade-in">Copied!</span>
            ) : (
              <Copy className="size-3.5 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
            )}
          </div>
          <div className="text-base font-bold text-zinc-900 truncate mt-1">{discovery.state || 'Unspecified'}</div>
        </div>
        <div
          onClick={() => handleCopy('Region', discovery.region || discovery.country || 'Unspecified')}
          className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-1 hover:shadow-md transition-all cursor-pointer group relative"
        >
          <div className="text-xs text-zinc-500 font-bold uppercase flex items-center justify-between tracking-wider">
            <span className="flex items-center gap-1.5"><MapPin className="size-4 text-sky-500" /> Region</span>
            {copiedField === 'Region' ? (
              <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 animate-fade-in">Copied!</span>
            ) : (
              <Copy className="size-3.5 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
            )}
          </div>
          <div className="text-base font-bold text-zinc-900 truncate mt-1">{discovery.region || discovery.country || 'Unspecified'}</div>
        </div>
        {discovery.latitude != null && discovery.longitude != null && (
          <div
            onClick={() => handleCopy('Coordinates', `${discovery.latitude?.toFixed(4)}, ${discovery.longitude?.toFixed(4)}`)}
            className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-1 hover:shadow-md transition-all cursor-pointer group relative"
          >
            <div className="text-xs text-zinc-500 font-bold uppercase flex items-center justify-between tracking-wider">
              <span className="flex items-center gap-1.5"><Compass className="size-4 text-emerald-500" /> Coordinates</span>
              {copiedField === 'Coordinates' ? (
                <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 animate-fade-in">Copied!</span>
              ) : (
                <Copy className="size-3.5 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
              )}
            </div>
            <div className="text-base font-medium text-zinc-900 truncate mt-1">
              {discovery.latitude.toFixed(4)}, {discovery.longitude.toFixed(4)}
            </div>
          </div>
        )}
        {Array.isArray(discovery.customInfo) && discovery.customInfo.map((info: { label: string; value: string }, idx: number) => (
          <div
            key={idx}
            onClick={() => handleCopy(info.label, info.value)}
            className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-1 hover:shadow-md transition-all cursor-pointer group relative"
          >
            <div className="text-xs text-zinc-500 font-bold uppercase flex items-center justify-between tracking-wider">
              <span className="flex items-center gap-1.5"><MapPin className="size-4 text-indigo-500" /> {info.label}</span>
              {copiedField === info.label ? (
                <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 animate-fade-in">Copied!</span>
              ) : (
                <Copy className="size-3.5 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
              )}
            </div>
            <div className="text-base font-bold text-zinc-900 truncate mt-1">{info.value}</div>
          </div>
        ))}
      </div>

      {/* External Links */}
      {discovery.externalLinks && discovery.externalLinks.length > 0 && (
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 space-y-4 shadow-sm">
          <div className="text-sm font-bold font-serif text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-4">
            <ExternalLink className="size-5 text-sky-500" /> External Expedition Reports & Archives
          </div>
          <div className="space-y-3 pt-2">
            {discovery.externalLinks.map((link: string, i: number) => (
              <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-base text-zinc-600 hover:text-sky-600 hover:underline truncate block transition-colors bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <ChevronRight className="size-5 text-zinc-400 shrink-0" />
                <span className="truncate font-medium">{link}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* GPX Files */}
      {gpxFiles.map((gpx: MediaItem) => (
        <GPXViewer key={gpx.id} url={gpx.url} name={discovery.name} />
      ))}

      {/* Gallery */}
      {images.length > 0 && (
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 space-y-6 shadow-sm">
          <div className="text-sm font-bold font-serif text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-4 flex items-center justify-between">
            <span>Expedition Gallery ({images.length})</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 rounded-lg">Cloudflare R2 Storage</span>
          </div>
          <div className="grid grid-cols-2 gap-8 pt-2">
            {images.map((img: MediaItem) => (
              <div key={img.id} onClick={() => setEnlargedMedia(img)} className="relative group rounded-3xl overflow-hidden border border-zinc-200 bg-zinc-50 aspect-video shadow-md cursor-pointer">
                <Image
                  src={getMediaUrl(img)}
                  alt={img.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500"
                />
                <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-md p-4 text-sm font-medium text-zinc-900 truncate border-t border-zinc-200">
                  {img.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 space-y-6 shadow-sm">
          <div className="text-sm font-bold font-serif text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-4 flex items-center justify-between">
            <span>Survey Documents & PDFs ({documents.length})</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 rounded-lg">Encrypted PDF</span>
          </div>
          <div className="space-y-3 pt-2">
            {documents.map((doc: MediaItem) => (
              <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 bg-zinc-50 rounded-2xl border border-zinc-200 text-sm text-zinc-700 hover:border-zinc-300 hover:shadow-sm transition-all">
                <span className="truncate font-bold">{doc.name}</span>
                <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100 shadow-sm uppercase tracking-wider">PDF Document</span>
              </a>
            ))}
          </div>
        </div>
      )}

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

      {/* Enlarged Media Modal Lightbox */}
      <Dialog open={!!enlargedMedia} onOpenChange={(open) => !open && setEnlargedMedia(null)}>
        <DialogContent className="max-w-5xl bg-black/95 border border-zinc-800 shadow-2xl rounded-3xl p-6 overflow-hidden flex flex-col items-center justify-center min-h-[80vh]">
          <DialogHeader className="absolute top-4 left-6 z-20">
            <DialogTitle className="text-lg font-bold font-serif text-white drop-shadow">
              {enlargedMedia?.name || 'Expedition Media'}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              High-resolution R2 cloud archive view.
            </DialogDescription>
          </DialogHeader>

          {enlargedMedia && (
            <div className="relative w-full h-[70vh] flex items-center justify-center mt-8 z-10">
              {enlargedMedia.fileType === 'VIDEO' ? (
                <video
                  src={getMediaUrl(enlargedMedia)}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
                />
              ) : (
                <Image
                  src={getMediaUrl(enlargedMedia)}
                  alt={enlargedMedia.name || 'Enlarged view'}
                  fill
                  sizes="100vw"
                  className="object-contain rounded-2xl shadow-2xl"
                  priority
                />
              )}
            </div>
          )}

          <DialogFooter className="mt-4 w-full flex justify-end z-20">
            <Button
              variant="secondary"
              onClick={() => setEnlargedMedia(null)}
              className="rounded-xl text-xs font-bold px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
            >
              Close View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
