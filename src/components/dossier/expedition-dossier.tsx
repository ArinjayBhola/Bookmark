'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDiscoveryById, getDiscoveries, deleteDiscovery } from '@/app/actions/discovery';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { GPXViewer } from './gpx-viewer';
import { MarkdownJournal } from './markdown-journal';
import { WeatherWidget } from './weather-widget';
import { GearChecklist } from './gear-checklist';
import { CaptureForm } from '@/components/capture-form';
import Image from 'next/image';
import {
  MapPin,
  Mountain,
  Compass,
  Activity,
  FileText,
  ExternalLink,
  Edit3,
  ChevronRight,
  Trash2,
} from 'lucide-react';

interface MediaItem {
  id: string;
  fileType: string;
  url: string;
  name: string;
}

interface NearbyItem {
  id: string;
  name: string;
  elevation?: number | null;
}

interface ExpeditionDossierProps {
  discoveryId: string | null;
  onClose: () => void;
  onSelectDiscovery?: (id: string) => void;
}

export function ExpeditionDossier({ discoveryId, onClose, onSelectDiscovery }: ExpeditionDossierProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  const handleDelete = async () => {
    if (!discovery) return;
    if (confirm('Are you sure you want to delete this mountain record?')) {
      try {
        await deleteDiscovery(discovery.id);
        onClose();
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete discovery');
      }
    }
  };

  const { data: discovery, isLoading } = useQuery({
    queryKey: ['discovery', discoveryId],
    queryFn: () => (discoveryId ? getDiscoveryById(discoveryId) : null),
    enabled: !!discoveryId,
    placeholderData: (previousData) => previousData,
  });

  const { data: nearby = [] } = useQuery({
    queryKey: ['nearby', discovery?.region],
    queryFn: () =>
      discovery?.region
        ? getDiscoveries({ region: discovery.region })
        : Promise.resolve([]),
    enabled: !!discovery?.region,
    placeholderData: (previousData) => previousData,
  });

  if (!discoveryId) return null;

  if (isLoading || !discovery) {
    return (
      <SheetContent side="right" className="w-full sm:max-w-3xl p-8 space-y-8 bg-[#fafafa] border-l border-zinc-200">
        <div className="space-y-3">
          <Skeleton className="h-12 w-2/3 bg-zinc-200 rounded-2xl" />
          <Skeleton className="h-4 w-1/3 bg-zinc-200 rounded-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-3xl bg-zinc-200" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-28 bg-zinc-200 rounded-2xl" />
          <Skeleton className="h-28 bg-zinc-200 rounded-2xl" />
          <Skeleton className="h-28 bg-zinc-200 rounded-2xl" />
          <Skeleton className="h-28 bg-zinc-200 rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full bg-zinc-200 rounded-3xl" />
      </SheetContent>
    );
  }

  if (isEditing) {
    return (
      <SheetContent side="right" className="w-full sm:max-w-3xl p-8 bg-[#fafafa] border-l border-zinc-200 overflow-y-auto max-h-screen text-zinc-900">
        <SheetHeader className="mb-6 border-b border-zinc-200 pb-4">
          <SheetTitle className="text-2xl font-bold font-serif text-zinc-900">Editing Mountain Intelligence</SheetTitle>
          <SheetDescription className="text-sm text-zinc-500 font-medium">Update terrain data, coordinates, and expedition logistics.</SheetDescription>
        </SheetHeader>
        <CaptureForm
          initialData={discovery}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </SheetContent>
    );
  }

  const images = discovery.media?.filter((m: MediaItem) => m.fileType === 'IMAGE') || [];
  const videos = discovery.media?.filter((m: MediaItem) => m.fileType === 'VIDEO') || [];
  const gpxFiles = discovery.media?.filter((m: MediaItem) => m.fileType === 'GPX') || [];
  const documents = discovery.media?.filter((m: MediaItem) => m.fileType === 'DOCUMENT') || [];

  const heroImage = images[0]?.url;

  const otherNearby = nearby.filter((n: NearbyItem) => n.id !== discovery.id).slice(0, 5);

  return (
    <SheetContent side="right" className="w-full sm:max-w-3xl p-0 bg-[#fafafa] overflow-y-auto max-h-screen flex flex-col border-l border-zinc-200 text-zinc-900 shadow-2xl font-sans">
      {/* Cinematic Hero Section */}
      <div className="relative h-80 w-full bg-white overflow-hidden shrink-0 border-b border-zinc-200 flex items-center justify-center shadow-sm">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={discovery.name}
            fill
            sizes="(max-width: 1024px) 100vw, 768px"
            className="object-cover opacity-90"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50">
            <Mountain className="size-48 text-zinc-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

        <div className="absolute top-6 right-12 z-10 flex items-center gap-2">
          <Button size="sm" onClick={() => setIsEditing(true)} className="backdrop-blur-xl bg-white/90 hover:bg-white text-zinc-900 border border-zinc-200 rounded-xl px-4 font-bold shadow-sm text-xs">
            <Edit3 className="size-3.5 mr-2 text-sky-500" /> Edit Dossier
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete} className="backdrop-blur-xl bg-red-600/90 hover:bg-red-600 text-white border border-red-500 rounded-xl px-4 font-bold shadow-sm text-xs">
            <Trash2 className="size-3.5 mr-2" /> Delete
          </Button>
        </div>

        <div className="absolute bottom-6 left-8 right-8 z-10">
          <div className="flex items-baseline justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold font-serif text-white drop-shadow-md">{discovery.name}</h1>
              {discovery.localName && <p className="text-sm font-serif italic text-white/90 drop-shadow-md">{discovery.localName}</p>}
            </div>
            {discovery.elevation && (
              <div className="text-right bg-white/90 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/20 shadow-lg">
                <div className="text-2xl font-bold text-zinc-900">{discovery.elevation.toLocaleString()}<span className="text-zinc-500 font-medium">m</span></div>
                <div className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">Elevation</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metadata Panels */}
      <div className="p-8 space-y-8 flex-1 bg-[#fafafa]">
        {/* Quick Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-1">
            <div className="text-[11px] text-zinc-500 font-bold uppercase flex items-center gap-1.5 tracking-wider">
              <MapPin className="size-3.5 text-sky-500" /> State
            </div>
            <div className="text-sm font-bold text-zinc-900 truncate">{discovery.state || 'Unspecified'}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-1">
            <div className="text-[11px] text-zinc-500 font-bold uppercase flex items-center gap-1.5 tracking-wider">
              <MapPin className="size-3.5 text-sky-500" /> Region
            </div>
            <div className="text-sm font-bold text-zinc-900 truncate">{discovery.region || 'Unspecified'}</div>
          </div>
          {discovery.country && (
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-1">
              <div className="text-[11px] text-zinc-500 font-bold uppercase flex items-center gap-1.5 tracking-wider">
                <MapPin className="size-3.5 text-sky-500" /> Country
              </div>
              <div className="text-sm font-bold text-zinc-900 truncate">{discovery.country}</div>
            </div>
          )}
          {discovery.latitude != null && discovery.longitude != null && (
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-1">
              <div className="text-[11px] text-zinc-500 font-bold uppercase flex items-center gap-1.5 tracking-wider">
                <Compass className="size-3.5 text-emerald-500" /> Coordinates
              </div>
              <div className="text-sm font-medium text-zinc-900 truncate">
                {discovery.latitude.toFixed(4)}, {discovery.longitude.toFixed(4)}
              </div>
            </div>
          )}
          {Array.isArray(discovery.customInfo) && discovery.customInfo.map((info: { label: string; value: string }, idx: number) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-1">
              <div className="text-[11px] text-zinc-500 font-bold uppercase flex items-center gap-1.5 tracking-wider">
                <MapPin className="size-3.5 text-indigo-500" /> {info.label}
              </div>
              <div className="text-sm font-bold text-zinc-900 truncate">{info.value}</div>
            </div>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="intelligence" className="w-full">
          <TabsList className={`grid w-full bg-zinc-100 border border-zinc-200 rounded-2xl p-1.5 shadow-inner ${discoveryId === '45feaeaf-a30d-4672-aee0-421ed5f0fd94' ? 'grid-cols-4' : 'grid-cols-5'}`}>
            <TabsTrigger value="intelligence" className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Logistics</TabsTrigger>
            <TabsTrigger value="journals" className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Journals</TabsTrigger>
            <TabsTrigger value="gear" className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Packing</TabsTrigger>
            {discoveryId !== '45feaeaf-a30d-4672-aee0-421ed5f0fd94' && (
              <TabsTrigger value="media" className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Gallery</TabsTrigger>
            )}
            <TabsTrigger value="personal" className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Notes</TabsTrigger>
          </TabsList>

          {/* Route & Logistics */}
          <TabsContent value="intelligence" className="space-y-6 pt-6">
            {discovery.latitude != null && discovery.longitude != null && (
              <WeatherWidget latitude={discovery.latitude} longitude={discovery.longitude} elevation={discovery.elevation} />
            )}

            {/* Route Notes */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 space-y-3 shadow-sm">
              <div className="text-sm font-bold font-serif text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
                <FileText className="size-5 text-sky-500" /> Route Notes & Approach Intelligence
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap pt-1">
                {discovery.routeNotes || 'No specific approach notes documented yet.'}
              </p>
            </div>

            {/* External Links */}
            {discovery.externalLinks && discovery.externalLinks.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 space-y-3 shadow-sm">
                <div className="text-sm font-bold font-serif text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
                  <ExternalLink className="size-5 text-sky-500" /> External Expedition Reports & Archives
                </div>
                <div className="space-y-2 pt-1">
                  {discovery.externalLinks.map((link: string, i: number) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-zinc-600 hover:text-sky-600 hover:underline truncate block transition-colors bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      <ChevronRight className="size-4 text-zinc-400 shrink-0" />
                      <span className="truncate font-medium">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Field Journals */}
          <TabsContent value="journals" className="pt-6">
            <MarkdownJournal discoveryId={discovery.id} entries={discovery.journalEntries} />
          </TabsContent>

          {/* Gear Packing Checklist */}
          <TabsContent value="gear" className="pt-6">
            <GearChecklist discoveryId={discovery.id} category="Equipment" />
          </TabsContent>


          {/* Gallery & GPX */}
          {discoveryId !== '45feaeaf-a30d-4672-aee0-421ed5f0fd94' && (
            <TabsContent value="media" className="space-y-8 pt-6">
              {gpxFiles.map((gpx: MediaItem) => (
                <GPXViewer key={gpx.id} url={gpx.url} name={discovery.name} />
              ))}

              <div className="bg-white p-6 rounded-3xl border border-zinc-200 space-y-4 shadow-sm">
                <div className="text-sm font-bold font-serif text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-3 flex items-center justify-between">
                  <span>Expedition Gallery ({images.length + videos.length})</span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 rounded-lg">Cloudflare R2 Storage</span>
                </div>
                {images.length === 0 && videos.length === 0 ? (
                  <div className="text-sm text-zinc-500 font-medium py-8 text-center bg-zinc-50 rounded-2xl border border-zinc-100 shadow-inner">
                    No images or videos uploaded yet. Use Edit Dossier to attach R2 media.
                  </div>
                ) : (
                  <div className="space-y-6 pt-2">
                    {videos.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="size-3.5 text-sky-500" /> Video Footage & Alpine Clips
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {videos.map((vid: MediaItem) => (
                            <div key={vid.id} className="rounded-2xl overflow-hidden border border-zinc-200 bg-black shadow-md group">
                              <video src={vid.url} controls className="w-full aspect-video object-contain bg-black" />
                              <div className="bg-white p-3 text-xs font-bold text-zinc-900 truncate border-t border-zinc-200">
                                {vid.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {images.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Mountain className="size-3.5 text-sky-500" /> Photographic Archive
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          {images.map((img: MediaItem) => (
                            <div key={img.id} className="relative group rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 aspect-video shadow-md">
                              <Image
                                src={img.url}
                                alt={img.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-md p-3 text-xs font-bold text-zinc-900 truncate border-t border-zinc-200">
                                {img.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {documents.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 space-y-4 shadow-sm">
                  <div className="text-sm font-bold font-serif text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-3 flex items-center justify-between">
                    <span>Survey Documents & PDFs ({documents.length})</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 rounded-lg">Encrypted PDF</span>
                  </div>
                  <div className="space-y-3 pt-1">
                    {documents.map((doc: MediaItem) => (
                      <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-sm text-zinc-700 hover:border-zinc-300 hover:shadow-sm transition-all">
                        <span className="truncate font-bold">{doc.name}</span>
                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100 shadow-sm uppercase tracking-wider">PDF Document</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          )}

          {/* Personal Notes */}
          <TabsContent value="personal" className="space-y-6 pt-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 space-y-3 shadow-sm">
              <div className="text-sm font-bold font-serif text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-3">Why I Saved This Discovery</div>
              <p className="text-sm text-zinc-600 leading-relaxed pt-1">{discovery.whySaved || 'No personal motivation recorded.'}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-200 space-y-3 shadow-sm">
              <div className="text-sm font-bold font-serif text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-3">Expedition Dreams & Ambitions</div>
              <p className="text-sm text-zinc-600 leading-relaxed pt-1">{discovery.expeditionDreams || 'No expedition dreams recorded.'}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-200 space-y-3 shadow-sm">
              <div className="text-sm font-bold font-serif text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-3">Emotional Notes & Atmosphere</div>
              <p className="text-sm text-zinc-600 leading-relaxed pt-1">{discovery.emotionalNotes || 'No emotional notes recorded.'}</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Nearby Related Discoveries */}
        {otherNearby.length > 0 && (
          <div className="border-t border-zinc-200 pt-8 space-y-4">
            <div className="text-sm font-bold font-serif text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="size-5 text-sky-500" /> Nearby Related Discoveries in {discovery.region || 'Region'}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              {otherNearby.map((n: NearbyItem) => (
                <div
                  key={n.id}
                  onClick={() => onSelectDiscovery?.(n.id)}
                  className="bg-white p-5 rounded-2xl border border-zinc-200 cursor-pointer hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between group shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="text-base font-bold font-serif text-zinc-900 truncate group-hover:text-sky-600 transition-colors">{n.name}</div>
                    <div className="text-xs font-medium text-zinc-500 truncate">{n.elevation ? `${n.elevation}m` : 'N/A'}</div>
                  </div>
                  <div className="text-[11px] font-bold text-sky-600 mt-4 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                    <span>Explore dossier</span> <ChevronRight className="size-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SheetContent>
  );
}
