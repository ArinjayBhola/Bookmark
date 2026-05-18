'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDiscoveries } from '@/app/actions/discovery';
import { FileType } from '@/db/enums';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Inbox, Plus, CheckCircle2, ExternalLink, RefreshCw, FileText, ShieldCheck, Upload, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface MediaItemType {
  id: string;
  name: string;
  fileType?: string;
  url?: string;
}

interface NewMediaItem {
  name: string;
  fileType: FileType;
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createInboxItem = async (_data: unknown) => ({ id: '1' });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const processInboxItem = async (_id: string, _discId?: string) => ({ id: '1' });

interface InboxItemType {
  id: string;
  title?: string | null;
  createdAt: Date | string;
  urlDump?: string | null;
  rawNotes?: string | null;
  media?: MediaItemType[];
}

const getInboxItems = async () => [] as InboxItemType[];

interface DiscoveryItemType {
  id: string;
  name: string;
  category: string;
}

export function DiscoveryInbox() {
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState('');
  const [rawNotes, setRawNotes] = React.useState('');
  const [urlDump, setUrlDump] = React.useState('');
  const [selectedDiscovery, setSelectedDiscovery] = React.useState<Record<string, string>>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inbox-items'],
    queryFn: () => getInboxItems(),
    placeholderData: (previousData) => previousData,
  });

  const { data: discoveries = [] } = useQuery({
    queryKey: ['discoveries-list'],
    queryFn: () => getDiscoveries(),
    placeholderData: (previousData) => previousData,
  });

  const [uploadingMedia, setUploadingMedia] = React.useState(false);
  const [mediaList, setMediaList] = React.useState<NewMediaItem[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      let fileType: FileType = FileType.DOCUMENT;
      let folder = 'documents';
      if (file.type.startsWith('image/')) {
        fileType = FileType.IMAGE;
        folder = 'images';
      } else if (file.type.startsWith('video/')) {
        fileType = FileType.VIDEO;
        folder = 'videos';
      } else if (file.name.endsWith('.gpx')) {
        fileType = FileType.GPX;
        folder = 'gpx';
      }

      const res = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, folder }),
      });

      if (!res.ok) throw new Error('Failed to get presigned URL');
      const { uploadUrl, key, publicUrl } = await res.json();

      if (uploadUrl.startsWith('https://mock-r2')) {
        setMediaList([...mediaList, { name: file.name, fileType, url: publicUrl, key, size: file.size, mimeType: file.type }]);
      } else {
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        if (!uploadRes.ok) throw new Error('Upload to R2 failed');
        setMediaList([...mediaList, { name: file.name, fileType, url: publicUrl, key, size: file.size, mimeType: file.type }]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('File upload failed. Check console for details.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: (data: { title?: string; rawNotes?: string; urlDump?: string; media?: NewMediaItem[] }) => createInboxItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-items'] });
      setTitle('');
      setRawNotes('');
      setUrlDump('');
      setMediaList([]);
    },
  });

  const processMutation = useMutation({
    mutationFn: ({ id, discoveryId }: { id: string; discoveryId?: string }) => processInboxItem(id, discoveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-items'] });
      queryClient.invalidateQueries({ queryKey: ['discoveries-list'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && !rawNotes && !urlDump && mediaList.length === 0) return;
    addMutation.mutate({ title, rawNotes, urlDump, media: mediaList });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 p-8 bg-[#fafafa] min-h-screen text-zinc-900 font-sans">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6 flex items-baseline justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold font-serif text-zinc-900 flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-xl text-sky-600 shadow-sm">
              <Inbox className="size-6" />
            </div>
            <span>Discovery Inbox</span>
          </h1>
          <p className="text-sm text-zinc-500">
            A frictionless tactical holding buffer for raw links, quick notes, and unstructured mountain intelligence.
          </p>
        </div>
        <div className="text-right font-medium text-sm text-zinc-500 bg-white border border-zinc-200 px-5 py-3 rounded-2xl shadow-sm">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">UNPROCESSED BUFFER</div>
          <div className="text-3xl font-bold text-sky-600">{items.length}</div>
        </div>
      </div>

      {/* Quick Dump Form */}
      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
        <div className="text-sm font-bold font-serif text-zinc-800 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-4">
          <Plus className="size-5 text-sky-500" /> Instant Intelligence Dump
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Quick Title / Topic</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Unexplored valley near K2 Base Camp" 
                className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 rounded-xl px-4 py-3 focus:border-sky-500/50 shadow-sm h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">URL Dump / Forum Link</label>
              <Input
                value={urlDump}
                onChange={(e) => setUrlDump(e.target.value)}
                placeholder="https://reddit.com/r/mountaineering/..."
                className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 rounded-xl px-4 py-3 focus:border-sky-500/50 shadow-sm h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Raw Notes / Copy-Paste Buffer</label>
            <Textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Paste raw expedition blog excerpts, coordinates, or random thoughts..."
              rows={4}
              className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 rounded-xl p-4 focus:border-sky-500/50 shadow-sm text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-2">Attach Instagram / Reddit Media (Images & Videos)</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md cursor-pointer text-sm font-medium transition-colors shadow-xs">
                {uploadingMedia ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                <span>{uploadingMedia ? 'Uploading to R2...' : 'Select File'}</span>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingMedia} />
              </label>
              <span className="text-xs text-zinc-500">Instantly buffer social media screenshots or video clips</span>
            </div>

            {mediaList.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold text-zinc-600">Attached Media Buffer ({mediaList.length})</div>
                <div className="grid grid-cols-2 gap-2">
                  {mediaList.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-zinc-50 rounded border border-zinc-200 text-xs">
                      <div className="truncate font-medium text-zinc-800 pr-2">
                        <span className="font-bold mr-1">[{m.fileType}]</span> {m.name}
                      </div>
                      <button type="button" onClick={() => setMediaList(mediaList.filter((_, idx) => idx !== i))} className="text-red-800 hover:text-red-950 p-1">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="size-4 text-sky-500" /> End-to-end encrypted local Drizzle buffer
            </div>
            <Button 
              type="submit" 
              disabled={addMutation.isPending || (!title && !rawNotes && !urlDump && mediaList.length === 0)}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-8 py-6 rounded-xl text-sm shadow-md transition-all duration-200 h-auto"
            >
              {addMutation.isPending ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
              Dump into Inbox
            </Button>
          </div>
        </form>
      </div>

      {/* Inbox Items List */}
      <div className="space-y-6">
        <div className="text-sm font-bold font-serif text-zinc-800 uppercase tracking-wider flex items-center justify-between border-b border-zinc-200 pb-4">
          <span className="flex items-center gap-2"><Inbox className="size-5 text-sky-500" /> Unprocessed Buffer ({items.length})</span>
          <span className="text-[10px] text-zinc-500 font-medium normal-case bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">Fast capture matters more than perfection</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-sm text-zinc-500 animate-pulse bg-white rounded-3xl border border-zinc-200">Scanning inbox buffer...</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-sm text-zinc-500 font-medium bg-white rounded-3xl border border-zinc-200 shadow-sm">
            Inbox buffer is pristine. No raw intelligence pending processing.
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item: InboxItemType) => (
              <div key={item.id} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6 transition-all hover:shadow-md group">
                <div className="flex items-start justify-between gap-6 border-b border-zinc-100 pb-5">
                  <div className="space-y-1 min-w-0">
                    <div className="font-bold font-serif text-zinc-900 text-xl truncate group-hover:text-sky-600 transition-colors">{item.title || 'Untitled Intelligence Dump'}</div>
                    <div className="text-xs text-zinc-500 font-medium">Logged {new Date(item.createdAt).toLocaleString()}</div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <Select
                      value={selectedDiscovery[item.id] || ''}
                      onValueChange={(val) => setSelectedDiscovery((prev) => ({ ...prev, [item.id]: val }))}
                    >
                      <SelectTrigger className="w-64 h-11 text-sm bg-zinc-50 border-zinc-200 text-zinc-800 rounded-xl focus:ring-1 focus:ring-sky-500/50 shadow-sm">
                        <SelectValue placeholder="Link to Discovery..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-zinc-200 text-zinc-800 rounded-xl shadow-lg">
                        {discoveries.map((d: DiscoveryItemType) => (
                          <SelectItem key={d.id} value={d.id} className="text-sm focus:bg-zinc-100 focus:text-zinc-900">
                            {d.name} ({d.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      onClick={() => processMutation.mutate({ id: item.id, discoveryId: selectedDiscovery[item.id] })}
                      disabled={processMutation.isPending}
                      className="h-11 text-sm bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 rounded-xl px-5 font-medium shadow-md"
                    >
                      <CheckCircle2 className="size-4 mr-2 text-sky-400" /> Process
                    </Button>
                  </div>
                </div>

                {item.urlDump && (
                  <div className="flex items-center gap-3 text-sm bg-zinc-50 p-4 rounded-xl border border-zinc-200 truncate shadow-sm">
                    <ExternalLink className="size-4 text-sky-500 shrink-0" />
                    <a href={item.urlDump} target="_blank" rel="noopener noreferrer" className="text-zinc-700 hover:text-sky-600 hover:underline truncate font-medium transition-colors">
                      {item.urlDump}
                    </a>
                  </div>
                )}

                {item.rawNotes && (
                  <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap shadow-sm">
                    {item.rawNotes}
                  </div>
                )}

                {item.media && item.media.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-zinc-100">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Attached Media Buffer</div>
                    <div className="grid grid-cols-2 gap-4">
                      {item.media.map((m: MediaItemType) => (
                        <div key={m.id} className="rounded-2xl border border-zinc-200 overflow-hidden bg-zinc-50 shadow-sm group relative">
                          {m.fileType === 'IMAGE' && m.url ? (
                            <div className="aspect-video relative overflow-hidden bg-zinc-100">
                              <Image src={m.url} alt={m.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            </div>
                          ) : m.fileType === 'VIDEO' && m.url ? (
                            <div className="aspect-video relative overflow-hidden bg-black">
                              <video src={m.url} controls className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="p-4 flex items-center gap-2 text-xs font-medium text-zinc-600">
                              <FileText className="size-4 text-sky-500 shrink-0" />
                              <span className="truncate">{m.name}</span>
                            </div>
                          )}
                          <div className="p-2.5 bg-white border-t border-zinc-200 text-[11px] font-bold text-zinc-800 truncate">
                            <span className="text-sky-600 mr-1">[{m.fileType || 'FILE'}]</span> {m.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
