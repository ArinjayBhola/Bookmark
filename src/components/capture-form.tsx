'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileType } from '@/db/enums';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createDiscovery, updateDiscovery } from '@/app/actions/discovery';
import { Loader2, Upload, Plus, Trash2, ExternalLink, MapPin, Flag, Settings, FolderPlus } from 'lucide-react';
import Image from 'next/image';

interface SearchableManageSelectProps {
  storageKey: string;
  defaultOptions: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  addLabel: string;
  required?: boolean;
}

function SearchableManageSelect({
  storageKey,
  defaultOptions,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  addLabel,
  required,
}: SearchableManageSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [options, setOptions] = React.useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          return JSON.parse(saved);
        }
        localStorage.setItem(storageKey, JSON.stringify(defaultOptions));
        return defaultOptions;
      } catch (e) {
        console.error(e);
      }
    }
    return defaultOptions;
  });
  const [search, setSearch] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newItemName, setNewItemName] = React.useState('');
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAddModal || itemToDelete) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddModal, itemToDelete]);

  const saveOptions = (newOpts: string[]) => {
    setOptions(newOpts);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newOpts));
    } catch (e) {
      console.error(e);
    }
  };

  const confirmAdd = () => {
    if (newItemName && newItemName.trim()) {
      const clean = newItemName.trim();
      if (!options.includes(clean)) {
        const nextOpts = [...options, clean];
        saveOptions(nextOpts);
      }
      onChange(clean);
      setIsOpen(false);
      setSearch('');
      setNewItemName('');
      setShowAddModal(false);
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      const nextOpts = options.filter((o) => o !== itemToDelete);
      saveOptions(nextOpts);
      if (value === itemToDelete) {
        onChange('');
      }
      setItemToDelete(null);
    }
  };

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 bg-white border ${required && !value ? 'border-red-300' : 'border-zinc-200'} rounded-xl text-xs font-medium text-left shadow-xs hover:border-zinc-300 focus:outline-none`}
      >
        <span className={value ? 'text-zinc-900 font-bold' : 'text-zinc-400'}>
          {value || placeholder}
        </span>
        <span className="text-zinc-400 text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-72 animate-fade-in">
          {/* Search Bar */}
          <div className="p-2 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/50">
            <span className="text-zinc-400 text-xs pl-1">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent border-none text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 divide-y divide-zinc-50 max-h-48 scrollbar-thin scrollbar-thumb-zinc-200">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-zinc-400 text-center italic">
                {options.length === 0 ? 'No saved items yet. Click below to add.' : 'No matches found'}
              </div>
            ) : (
              filtered.map((opt) => (
                <div
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`flex items-center justify-between p-3 text-xs cursor-pointer transition-colors ${value === opt ? 'bg-sky-50/50 text-sky-700 font-bold' : 'hover:bg-zinc-50 text-zinc-800'}`}
                >
                  <span className="truncate pr-2">{opt}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      setItemToDelete(opt);
                    }}
                    className="text-zinc-400 hover:text-red-600 p-1 rounded transition-colors"
                    title="Delete option"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add New Footer */}
          <div className="p-2 border-t border-zinc-100 bg-zinc-50/50">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowAddModal(true);
              }}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-colors left-0"
            >
              <Plus className="size-3.5" />
              <span>{addLabel}</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-zinc-100 space-y-4 font-sans z-[9999]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-zinc-900">{addLabel}</DialogTitle>
            <DialogDescription className="sr-only">Enter name for new {addLabel}</DialogDescription>
          </DialogHeader>
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Enter name..."
            className="rounded-xl border-zinc-200 font-medium text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmAdd();
            }}
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="rounded-xl font-bold text-xs px-4 py-2 h-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmAdd}
              className="rounded-xl font-bold text-xs px-5 py-2 h-auto bg-zinc-900 hover:bg-zinc-800 text-white"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent className="max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-zinc-100 space-y-4 font-sans z-[9999]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-zinc-900">Confirm Deletion</DialogTitle>
            <DialogDescription className="sr-only">Confirm deletion of {itemToDelete}</DialogDescription>
          </DialogHeader>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Are you sure you want to remove <span className="font-bold text-zinc-900">&quot;{itemToDelete}&quot;</span> from your saved list?
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setItemToDelete(null)}
              className="rounded-xl font-bold text-xs px-4 py-2 h-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              className="rounded-xl font-bold text-xs px-5 py-2 h-auto bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const discoverySchema = z.object({
  name: z.string().min(1, 'Place name is required'),
  localName: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  elevation: z.coerce.number().optional(),
  region: z.string().optional(),
  state: z.string().min(1, 'State is required'),
  country: z.string().optional(),

  whySaved: z.string().optional(),
  expeditionDreams: z.string().optional(),
  bestSeason: z.string().optional(),
  futureIdeas: z.string().optional(),
  emotionalNotes: z.string().optional(),
  comparisons: z.string().optional(),

  externalLinks: z.array(z.string()).optional(),
  customInfo: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
});

type DiscoveryFormValues = z.infer<typeof discoverySchema>;

interface MediaItem {
  name: string;
  fileType: FileType;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  id?: string;
}

interface CaptureFormProps {
  initialData?: {
    id?: string;
    name?: string;
    localName?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    elevation?: number | null;
    region?: string | null;
    state?: string | null;
    country?: string | null;
    bestSeason?: string | null;
    whySaved?: string | null;
    expeditionDreams?: string | null;
    futureIdeas?: string | null;
    emotionalNotes?: string | null;
    comparisons?: string | null;
    media?: MediaItem[];
    externalLinks?: string[];
    customInfo?: unknown;
    [key: string]: unknown;
  };
  onSuccess: (discovery: { id: string }) => void;
  onCancel: () => void;
}

export function CaptureForm({ initialData, onSuccess, onCancel }: CaptureFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadingMedia, setUploadingMedia] = React.useState(false);
  const [mediaList, setMediaList] = React.useState<MediaItem[]>(initialData?.media || []);
  const [linksList, setLinksList] = React.useState<string[]>(initialData?.externalLinks || []);
  const [customInfoList, setCustomInfoList] = React.useState<Array<{ label: string; value: string }>>(Array.isArray(initialData?.customInfo) ? (initialData.customInfo as Array<{ label: string; value: string }>) : []);
  const [newLink, setNewLink] = React.useState('');
  const [isAutofilling, setIsAutofilling] = React.useState(false);
  const [autofillModal, setAutofillModal] = React.useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info',
  });

  const form = useForm<DiscoveryFormValues>({
    resolver: zodResolver(discoverySchema) as unknown as import('react-hook-form').Resolver<DiscoveryFormValues>,
    defaultValues: (initialData as DiscoveryFormValues) || {
      name: '',
      localName: '',
      latitude: undefined,
      longitude: undefined,
      elevation: undefined,
      region: '',
      state: '',
      country: '',
      bestSeason: '',
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        localName: initialData.localName || '',
        latitude: initialData.latitude ?? undefined,
        longitude: initialData.longitude ?? undefined,
        elevation: initialData.elevation ?? undefined,
        region: initialData.region || '',
        state: initialData.state || '',
        country: initialData.country || '',
        bestSeason: initialData.bestSeason || '',
        whySaved: initialData.whySaved || '',
        expeditionDreams: initialData.expeditionDreams || '',
        futureIdeas: initialData.futureIdeas || '',
        emotionalNotes: initialData.emotionalNotes || '',
        comparisons: initialData.comparisons || '',
      });
    }
  }, [initialData, form]);

  const watchedState = useWatch({ control: form.control, name: 'state' });
  const watchedRegion = useWatch({ control: form.control, name: 'region' });
  const watchedCountry = useWatch({ control: form.control, name: 'country' });

  const handleAddLink = () => {
    if (newLink && newLink.trim() !== '') {
      setLinksList([...linksList, newLink.trim()]);
      setNewLink('');
    }
  };

  const handleRemoveLink = (index: number) => {
    setLinksList(linksList.filter((_, i) => i !== index));
  };

  const handleAddCustomInfo = () => {
    setCustomInfoList([...customInfoList, { label: '', value: '' }]);
  };

  const handleUpdateCustomInfo = (index: number, field: 'label' | 'value', val: string) => {
    const updated = [...customInfoList];
    updated[index][field] = val;
    setCustomInfoList(updated);
  };

  const handleRemoveCustomInfo = (index: number) => {
    setCustomInfoList(customInfoList.filter((_, i) => i !== index));
  };

  const triggerReverseGeocoding = async (lat: number, lon: number) => {
    setIsAutofilling(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'TerrainVault/1.0',
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const country = addr.country || '';
          const state = addr.state || addr.province || addr.region || '';
          const region = addr.county || addr.suburb || addr.city || addr.municipality || '';
          
          let filledAny = false;
          if (country && !form.getValues('country')) {
            form.setValue('country', country, { shouldValidate: true });
            filledAny = true;
          }
          if (state && !form.getValues('state')) {
            form.setValue('state', state, { shouldValidate: true });
            filledAny = true;
          }
          if (region && !form.getValues('region')) {
            form.setValue('region', region, { shouldValidate: true });
            filledAny = true;
          }

          if (filledAny) {
            setAutofillModal({
              isOpen: true,
              title: 'Autofill Success',
              description: `Location details successfully retrieved:\n• Country: ${country || 'N/A'}\n• State: ${state || 'N/A'}\n• Region: ${region || 'N/A'}`,
              type: 'success',
            });
          } else {
            setAutofillModal({
              isOpen: true,
              title: 'No New Information',
              description: 'Coordinates resolved, but the fields (Country, State, Region) are already populated or have no new details.',
              type: 'info',
            });
          }
        } else {
          setAutofillModal({
            isOpen: true,
            title: 'No Location Found',
            description: 'Could not find any location details for the specified coordinates.',
            type: 'error',
          });
        }
      } else {
        setAutofillModal({
          isOpen: true,
          title: 'Autofill Error',
          description: 'Failed to retrieve location details from reverse geocoding service.',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      setAutofillModal({
        isOpen: true,
        title: 'Network Error',
        description: 'A network error occurred while resolving coordinates. Please try again later.',
        type: 'error',
      });
    } finally {
      setIsAutofilling(false);
    }
  };

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

        // Direct GPX extraction: parse coordinate data client-side immediately
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) {
            try {
              const parser = new DOMParser();
              const xml = parser.parseFromString(text, 'text/xml');
              const gpxName = xml.getElementsByTagName('name')[0]?.textContent;
              if (gpxName && !form.getValues('name')) {
                form.setValue('name', gpxName.trim(), { shouldValidate: true });
              }

              const trkpts = xml.getElementsByTagName('trkpt');
              if (trkpts.length > 0) {
                let maxEle = -Infinity;
                let sumLat = 0;
                let sumLon = 0;
                for (let i = 0; i < trkpts.length; i++) {
                  const pt = trkpts[i];
                  const lat = parseFloat(pt.getAttribute('lat') || '0');
                  const lon = parseFloat(pt.getAttribute('lon') || '0');
                  const eleNode = pt.getElementsByTagName('ele')[0];
                  const ele = eleNode ? parseFloat(eleNode.textContent || '0') : 0;
                  if (ele > maxEle) maxEle = ele;
                  sumLat += lat;
                  sumLon += lon;
                }
                const startPt = trkpts[0];
                const startLat = parseFloat(startPt.getAttribute('lat') || '0');
                const startLon = parseFloat(startPt.getAttribute('lon') || '0');

                if (startLat && !form.getValues('latitude')) {
                  form.setValue('latitude', parseFloat(startLat.toFixed(6)), { shouldValidate: true });
                }
                if (startLon && !form.getValues('longitude')) {
                  form.setValue('longitude', parseFloat(startLon.toFixed(6)), { shouldValidate: true });
                }
                if (maxEle > -Infinity && !form.getValues('elevation')) {
                  form.setValue('elevation', Math.round(maxEle), { shouldValidate: true });
                }

                triggerReverseGeocoding(startLat, startLon);
              }
            } catch (err) {
              console.error('GPX extraction error:', err);
            }
          }
        };
        reader.readAsText(file);
      }

      // Direct server-backed upload to bypass Cloudflare R2 CORS restrictions
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload failed');
      }

      const { url, key, size, mimeType, name } = await res.json();

      setMediaList([...mediaList, { name: name || file.name, fileType, url, key, size: size || file.size, mimeType: mimeType || file.type }]);
    } catch (error) {
      console.error('Upload error:', error);
      setAutofillModal({
        isOpen: true,
        title: 'Upload Failed',
        description: 'File upload failed. Check console for details.',
        type: 'error',
      });
    } finally {
      setUploadingMedia(false);
    }
  };


  const onSubmit = async (values: DiscoveryFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        externalLinks: linksList,
        customInfo: customInfoList.filter((item) => item.label.trim() !== ''),
        media: mediaList,
      };

      let result;
      if (initialData?.id) {
        result = await updateDiscovery(initialData.id, payload);
      } else {
        result = await createDiscovery(payload);
      }
      if (!result) throw new Error('Failed to save discovery');
      onSuccess(result);
    } catch (error) {
      console.error('Submission error:', error);
      setAutofillModal({
        isOpen: true,
        title: 'Save Failed',
        description: 'Failed to save mountain discovery record. Please check your network and try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: unknown) => {
    console.error('Form validation errors:', errors);
    setAutofillModal({
      isOpen: true,
      title: 'Validation Errors',
      description: 'Please fill in all required fields: Name and State must be selected.',
      type: 'error',
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm font-sans">
      {/* 1. Core Identification & Coordinates */}
      <div className="space-y-4 pt-2">
        <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 border-b border-zinc-100 pb-2 uppercase tracking-wider">
          <MapPin className="size-4 text-sky-500" />
          <span>1. Core Identification & Coordinates</span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-700">Mountain / Place Name <span className="text-red-600">*</span></label>
          <Input {...form.register('name')} placeholder="e.g. Nanda Devi" className="rounded-xl border-zinc-200 font-medium" />
          {form.formState.errors.name && <span className="text-xs text-red-800">{form.formState.errors.name.message}</span>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">State <span className="text-red-600">*</span></label>
            <SearchableManageSelect
              storageKey="user_states_v2"
              defaultOptions={[]}
              value={watchedState || ''}
              onChange={(val) => form.setValue('state', val, { shouldValidate: true })}
              placeholder="Select State..."
              searchPlaceholder="Search state..."
              addLabel="Add New State"
              required
            />
            {form.formState.errors.state && <span className="text-xs text-red-800">{form.formState.errors.state.message}</span>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">Region</label>
            <SearchableManageSelect
              storageKey="user_regions_v2"
              defaultOptions={[]}
              value={watchedRegion || ''}
              onChange={(val) => form.setValue('region', val, { shouldValidate: true })}
              placeholder="Select Region..."
              searchPlaceholder="Search region..."
              addLabel="Add New Region"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">Country</label>
            <SearchableManageSelect
              storageKey="user_countries_v2"
              defaultOptions={[]}
              value={watchedCountry || ''}
              onChange={(val) => form.setValue('country', val, { shouldValidate: true })}
              placeholder="Select Country..."
              searchPlaceholder="Search country..."
              addLabel="Add New Country"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">Latitude (Optional)</label>
            <Input type="number" step="any" {...form.register('latitude')} placeholder="45.9763" className="rounded-xl border-zinc-200 font-medium" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">Longitude (Optional)</label>
            <Input type="number" step="any" {...form.register('longitude')} placeholder="7.6583" className="rounded-xl border-zinc-200 font-medium" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">Elevation (meters)</label>
            <Input type="number" {...form.register('elevation')} placeholder="4478" className="rounded-xl border-zinc-200 font-medium" />
          </div>
        </div>

        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isAutofilling}
            onClick={() => {
              const lat = parseFloat(form.getValues('latitude') as unknown as string);
              const lon = parseFloat(form.getValues('longitude') as unknown as string);
              if (!isNaN(lat) && !isNaN(lon)) {
                triggerReverseGeocoding(lat, lon);
              } else {
                setAutofillModal({
                  isOpen: true,
                  title: 'Coordinates Missing',
                  description: 'Please enter valid Latitude and Longitude first to autofill location details.',
                  type: 'error',
                });
              }
            }}
            className="rounded-xl font-bold text-xs h-9 px-4 border-zinc-200 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
          >
            {isAutofilling ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin text-sky-500" />
            ) : (
              <MapPin className="size-3.5 mr-1.5" />
            )}
            {isAutofilling ? 'Fetching details...' : 'Autofill Location from Coordinates'}
          </Button>
        </div>
      </div>

      {/* 2. Bucket List & Personal Ambitions */}
      <div className="space-y-4 pt-2">
        <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 border-b border-zinc-100 pb-2 uppercase tracking-wider">
          <Flag className="size-4 text-emerald-500" />
          <span>2. Bucket List & Personal Ambitions</span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-700">When I Am Planning To Do This (Target Date / Season) (Optional)</label>
          <Input {...form.register('bestSeason')} placeholder="e.g. Summer 2026, or October 15th" className="rounded-xl border-zinc-200 font-medium" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-700">Why I Saved This Discovery / Inspiration</label>
          <Textarea {...form.register('whySaved')} placeholder="Saw an incredible alpine traverse reel on Instagram. Looks like the perfect dream expedition..." rows={3} className="rounded-xl border-zinc-200 p-3 font-medium text-sm" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-700">Expedition Dreams & Ambitions</label>
          <Textarea {...form.register('expeditionDreams')} placeholder="Future expedition goals, alpine style ascents, ridge traverses..." rows={2} className="rounded-xl border-zinc-200 p-3 font-medium text-sm" />
        </div>
      </div>

      {/* 3. Custom Attributes (Village, Valley, etc.) */}
      <div className="space-y-4 pt-2">
        <div className="text-xs font-bold text-zinc-800 flex items-center justify-between border-b border-zinc-100 pb-2 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Settings className="size-4 text-indigo-500" />
            <span>3. Custom Attributes (Village, Valley, Nearest Road, etc.)</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddCustomInfo} className="rounded-xl font-bold text-xs h-8 px-3 flex items-center gap-1 border-zinc-200 text-zinc-800 hover:bg-zinc-100">
            <Plus className="size-3.5" /> Add Custom Label
          </Button>
        </div>

        {customInfoList.length === 0 ? (
          <div className="text-xs text-zinc-500 bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-center font-medium">
            No custom attributes added yet. Click &quot;Add Custom Label&quot; to include details like Village, Valley, or Approach Route.
          </div>
        ) : (
          <div className="space-y-2.5">
            {customInfoList.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-bold text-zinc-600">Custom Label</label>
                  <Input value={item.label} onChange={(e) => handleUpdateCustomInfo(i, 'label', e.target.value)} placeholder="e.g. Village, Valley, Permit Office" className="rounded-xl border-zinc-200 font-medium text-xs bg-white" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-bold text-zinc-600">Value</label>
                  <Input value={item.value} onChange={(e) => handleUpdateCustomInfo(i, 'value', e.target.value)} placeholder="e.g. Tosh, Parvati Valley" className="rounded-xl border-zinc-200 font-medium text-xs bg-white" />
                </div>
                <button type="button" onClick={() => handleRemoveCustomInfo(i)} className="text-red-800 hover:text-red-950 p-2 self-end mb-0.5">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Media & External References */}
      <div className="space-y-6 pt-2">
        <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 border-b border-zinc-100 pb-2 uppercase tracking-wider">
          <FolderPlus className="size-4 text-indigo-500" />
          <span>4. Expedition Media & External References</span>
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-700 block mb-2">Upload Expedition Media (Images, Videos, GPX, PDFs)</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl cursor-pointer text-xs font-bold transition-colors shadow-xs">
              {uploadingMedia ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              <span>{uploadingMedia ? 'Uploading to R2...' : 'Select File'}</span>
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingMedia} />
            </label>
            <span className="text-xs text-zinc-500 font-medium">Supports direct Cloudflare R2 uploads (Images & Videos)</span>
          </div>

          {mediaList.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Attached Media ({mediaList.length})</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mediaList.map((m, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs relative group transition-all hover:shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-bold text-zinc-800 flex items-center gap-1.5" title={m.name}>
                        <span className="text-[10px] bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-md font-sans uppercase font-extrabold">{m.fileType}</span>
                        <span className="truncate">{m.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMediaList(mediaList.filter((_, idx) => idx !== i))}
                        className="text-zinc-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete media"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    {m.fileType === FileType.IMAGE && m.url && (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden border border-zinc-200 bg-white">
                        <Image
                          src={m.key ? `/api/media?key=${encodeURIComponent(m.key)}` : m.url}
                          alt={m.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-cover"
                        />
                        <a
                          href={m.key ? `/api/media?key=${encodeURIComponent(m.key)}` : m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-extrabold tracking-wide transition-opacity duration-200 cursor-pointer text-xs"
                        >
                          View Full Image ↗
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <label className="text-xs font-bold text-zinc-700 block mb-2">Social Media / Reference Link (Instagram, YouTube, Reddit)</label>
          <div className="flex gap-2 mb-3">
            <Input value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="https://instagram.com/reel/..." className="rounded-xl border-zinc-200 font-medium text-xs" />
            <Button type="button" variant="secondary" onClick={handleAddLink} className="rounded-xl font-bold text-xs px-4">
              <Plus className="size-4 mr-1" /> Add
            </Button>
          </div>

          {linksList.length > 0 && (
            <div className="space-y-1.5">
              {linksList.map((link, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                  <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-zinc-800 hover:underline truncate pr-2 font-medium">
                    <ExternalLink className="size-3.5 shrink-0 text-sky-500" />
                    <span className="truncate">{link}</span>
                  </a>
                  <button type="button" onClick={() => handleRemoveLink(i)} className="text-red-800 hover:text-red-950 p-1">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl font-bold text-xs px-5 py-2.5 h-auto">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold text-xs px-6 py-2.5 h-auto shadow-md bg-zinc-900 hover:bg-zinc-800 text-white">
          {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
          {initialData ? 'Update Discovery' : 'Commit to Terrain Vault'}
        </Button>
      </div>

      <Dialog open={autofillModal.isOpen} onOpenChange={(open) => setAutofillModal((prev) => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md bg-white border border-zinc-200 shadow-2xl rounded-3xl p-6 text-zinc-900 font-sans">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold font-serif text-zinc-950 flex items-center gap-2">
              <MapPin className={`size-5 ${autofillModal.type === 'success' ? 'text-emerald-500' : autofillModal.type === 'error' ? 'text-red-500' : 'text-sky-500'}`} />
              <span>{autofillModal.title}</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-600 whitespace-pre-line leading-relaxed font-medium">
              {autofillModal.description}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={() => setAutofillModal((prev) => ({ ...prev, isOpen: false }))}
              className="rounded-xl text-xs font-bold px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white shadow-md"
            >
              Okay
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
