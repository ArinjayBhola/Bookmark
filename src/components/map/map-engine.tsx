'use client';

import * as React from 'react';
import { GoogleMap, useJsApiLoader, Polyline, OverlayView } from '@react-google-maps/api';
import useSupercluster from 'use-supercluster';
import { Layers, LocateFixed, Mountain } from 'lucide-react';
import { getDiscoveryById } from '@/app/actions/discovery';
import { useQuery } from '@tanstack/react-query';

interface DiscoveryMapItem {
  id: string;
  name: string;
  elevation?: number | null;
  latitude: number;
  longitude: number;
}

interface ClusterProperties {
  cluster?: boolean;
  point_count?: number;
  discoveryId: string;
  name: string;
  elevation?: number | null;
}

interface MapEngineProps {
  discoveries: DiscoveryMapItem[];
  activeDossierId?: string | null;
  onSelectDiscovery: (id: string) => void;
}

interface ViewState {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

export function MapEngine({ discoveries, activeDossierId, onSelectDiscovery }: MapEngineProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [map, setMap] = React.useState<google.maps.Map | null>(null);

  // GPX Active Dossier Overlay State & Query
  const [routeLine, setRouteLine] = React.useState<{lat: number, lng: number}[] | null>(null);

  const { data: activeDiscovery } = useQuery({
    queryKey: ['active-dossier-map', activeDossierId],
    queryFn: () => (activeDossierId ? getDiscoveryById(activeDossierId) : null),
    enabled: !!activeDossierId,
  });

  const gpxFiles = React.useMemo(() => {
    return activeDiscovery?.media?.filter((m) => m.fileType === 'GPX') || [];
  }, [activeDiscovery]);

  // Synchronously reset routeLine during the render phase when the active dossier changes
  const [prevActiveDossierId, setPrevActiveDossierId] = React.useState<string | null | undefined>(activeDossierId);
  if (activeDossierId !== prevActiveDossierId) {
    setPrevActiveDossierId(activeDossierId);
    setRouteLine(null);
  }

  React.useEffect(() => {
    if (gpxFiles.length === 0) {
      return;
    }

    const loadGPXRoute = async () => {
      try {
        const file = gpxFiles[0];
        if (!file.url) return;

        const res = await fetch(file.url);
        if (!res.ok) throw new Error('GPX fetch failed');
        const text = await res.text();

        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const trkpts = xml.getElementsByTagName('trkpt');
        const coords: {lat: number, lng: number}[] = [];

        for (let i = 0; i < trkpts.length; i++) {
          const pt = trkpts[i];
          const lat = parseFloat(pt.getAttribute('lat') || '0');
          const lon = parseFloat(pt.getAttribute('lon') || '0');
          if (lat && lon) {
            coords.push({ lat, lng: lon });
          }
        }

        if (coords.length > 0) {
          setRouteLine(coords);

          if (map) {
            const bounds = new google.maps.LatLngBounds();
            for (const coord of coords) {
              bounds.extend(coord);
            }
            map.fitBounds(bounds, 80);
          }
        }
      } catch (err) {
        console.error('GPX map overlay parse error:', err);
        setRouteLine(null);
      }
    };

    loadGPXRoute();
  }, [gpxFiles, map]);

  const [userGeolocation, setUserGeolocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [copiedUserPin, setCopiedUserPin] = React.useState(false);

  // Track if we restored from session storage so we don't overwrite with initial geolocation flyTo
  const isRestoredSession = React.useRef(false);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('terrain_vault_view_state')) {
        isRestoredSession.current = true;
      }
    }
  }, []);

  // 1. Session Storage Initialization
  const [mapMode, setMapMode] = React.useState<'STREET' | 'SATELLITE'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('terrain_vault_map_mode');
      if (saved === 'STREET' || saved === 'SATELLITE') return saved;
    }
    return 'SATELLITE'; // Default to Satellite for Google Earth look
  });

  const [viewState, setViewState] = React.useState<ViewState>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('terrain_vault_view_state');
      if (saved) {
        try { return JSON.parse(saved) as ViewState; } catch (e) { console.error(e); }
      }
    }
    return {
      latitude: 28.3,
      longitude: 84.1,
      zoom: 5.2,
      bearing: 0,
      pitch: 0,
    };
  });

  // Fly-to selected discovery if there is no GPX file overlay
  React.useEffect(() => {
    if (activeDiscovery && activeDiscovery.latitude != null && activeDiscovery.longitude != null) {
      const hasGpx = activeDiscovery.media?.some((m) => m.fileType === 'GPX');
      if (!hasGpx) {
        if (map) {
          map.panTo({ lat: activeDiscovery.latitude, lng: activeDiscovery.longitude });
          map.setZoom(12);
        }
        
        setTimeout(() => {
          setViewState((prev) => ({
            ...prev,
            latitude: activeDiscovery.latitude!,
            longitude: activeDiscovery.longitude!,
            zoom: 12,
          }));
        }, 0);
      }
    }
  }, [activeDiscovery, map]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('terrain_vault_map_mode', mapMode);
    }
  }, [mapMode]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('terrain_vault_view_state', JSON.stringify(viewState));
    }
  }, [viewState]);

  React.useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserGeolocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          // Only flyTo and update viewState if we didn't restore a saved session state!
          if (!isRestoredSession.current) {
            if (map) {
              map.panTo({ lat: position.coords.latitude, lng: position.coords.longitude });
              map.setZoom(10);
            }
            setViewState((prev) => ({
              ...prev,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              zoom: 10,
            }));
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  }, [map]);

  const points = React.useMemo(() => {
    return discoveries.map((d) => ({
      type: 'Feature' as const,
      properties: {
        cluster: false,
        discoveryId: d.id,
        name: d.name,
        elevation: d.elevation,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [d.longitude, d.latitude],
      },
    }));
  }, [discoveries]);

  const [bounds, setBounds] = React.useState<[number, number, number, number]>([-180, -90, 180, 90]);

  React.useEffect(() => {
    if (map) {
      const updateBounds = () => {
        const mapBounds = map.getBounds();
        if (mapBounds) {
          const ne = mapBounds.getNorthEast();
          const sw = mapBounds.getSouthWest();
          setBounds([sw.lng(), sw.lat(), ne.lng(), ne.lat()]);
        }
        setViewState((prev) => ({
          ...prev,
          zoom: map.getZoom() || prev.zoom,
          latitude: map.getCenter()?.lat() || prev.latitude,
          longitude: map.getCenter()?.lng() || prev.longitude,
          bearing: map.getHeading() || prev.bearing,
          pitch: map.getTilt() || prev.pitch,
        }));
      };
      
      const listener = map.addListener('idle', updateBounds);
      updateBounds();

      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [map]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options: { radius: 50, maxZoom: 14 },
  });

  const activeMapTypeId = React.useMemo(() => {
    return mapMode === 'STREET' ? 'roadmap' : 'satellite';
  }, [mapMode]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div className="h-full w-full bg-[var(--background)] flex items-center justify-center text-[var(--muted)]">Loading Map...</div>;

  return (
    <div className="relative h-full w-full bg-[var(--background)]">
      {/* Map Style Toggle Overlay */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-[var(--radius-md)] border bg-[var(--surface)]/95 p-1 font-sans shadow-[var(--shadow-soft)] backdrop-blur">
        <button
          type="button"
          onClick={() => { setMapMode('STREET'); }}
          className={`flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition ${mapMode === 'STREET' ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
        >
          <Layers className="size-3.5" />
          Street
        </button>
        <button
          type="button"
          onClick={() => { setMapMode('SATELLITE'); }}
          className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition ${mapMode === 'SATELLITE' ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
        >
          Satellite
        </button>
      </div>

      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat: viewState.latitude, lng: viewState.longitude }}
        zoom={viewState.zoom}
        tilt={0}
        options={{
          mapTypeId: activeMapTypeId,
          disableDefaultUI: false,
          streetViewControl: true,
          mapTypeControl: false,
        }}
        onLoad={setMap}
      >
        {/* GPX Route Polyline Overlay */}
        {routeLine && routeLine.length > 0 && (
          <Polyline
            path={routeLine}
            options={{
              strokeColor: '#0ea5e9',
              strokeWeight: 5,
              strokeOpacity: 0.85,
            }}
          />
        )}

        {/* User Actual Geolocation Marker */}
        {userGeolocation && (
          <OverlayView
            position={{ lat: userGeolocation.latitude, lng: userGeolocation.longitude }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div style={{ transform: 'translate(-50%, -100%)' }}>
              <div
                className="relative flex flex-col items-center cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  const textToCopy = `${userGeolocation.latitude.toFixed(6)}, ${userGeolocation.longitude.toFixed(6)}`;
                  navigator.clipboard.writeText(textToCopy);
                  setCopiedUserPin(true);
                  setTimeout(() => setCopiedUserPin(false), 2000);
                }}
              >
                <div className="absolute -top-1 size-8 rounded-full bg-[var(--accent)]/25 animate-ping pointer-events-none" />
                <div className="flex items-center gap-1.5 rounded-[var(--radius-md)] border-2 border-white bg-[var(--accent)] px-3.5 py-2 text-white shadow-[var(--shadow-soft)] transition-transform active:scale-95 dark:text-zinc-950">
                  <LocateFixed className="size-4 shrink-0" />
                  <span className="text-xs font-bold font-sans tracking-tight">
                    {copiedUserPin ? 'Copied coordinates' : 'My location'}
                  </span>
                </div>
                <div className="h-3 w-1.5 rounded-b-sm bg-[var(--accent)] shadow-md" />
              </div>
            </div>
          </OverlayView>
        )}

        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount, discoveryId, name, elevation } = cluster.properties as ClusterProperties;

          if (isCluster) {
            return (
              <OverlayView
                key={`cluster-${cluster.id}`}
                position={{ lat: latitude, lng: longitude }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div style={{ transform: 'translate(-50%, -50%)' }}>
                  <div
                    className="flex size-10 cursor-pointer items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--surface)] text-sm font-bold text-[var(--accent)] shadow-[var(--shadow-soft)] backdrop-blur transition-transform hover:scale-105"
                    onClick={() => {
                      const expansionZoom = Math.min(supercluster?.getClusterExpansionZoom(cluster.id as number) || 12, 16);
                      if (map) {
                        map.panTo({ lat: latitude, lng: longitude });
                        map.setZoom(expansionZoom);
                      }
                    }}
                  >
                    {pointCount}
                  </div>
                </div>
              </OverlayView>
            );
          }

          return (
            <OverlayView
              key={`marker-${discoveryId}`}
              position={{ lat: latitude, lng: longitude }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div style={{ transform: 'translate(-50%, -100%)' }}>
                <div
                  className="group relative flex flex-col items-center cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDiscovery(discoveryId);
                  }}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-20">
                    <div className="flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] border bg-[var(--surface)] px-3 py-1.5 font-sans text-sm text-[var(--foreground)] shadow-[var(--shadow-soft)]">
                      <span className="font-bold">{name}</span>
                      {elevation && <span className="font-semibold text-[var(--accent)]">({elevation}m)</span>}
                    </div>
                    <div className="-mt-1 size-2 rotate-45 border-b border-r bg-[var(--surface)]" />
                  </div>

                  {/* Marker Pin */}
                  <div
                    className={`flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 py-1.5 shadow-sm backdrop-blur transition-all group-hover:scale-105 group-hover:shadow-[var(--shadow-soft)] ${
                      activeDossierId === discoveryId
                        ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'border-[var(--border)] bg-[var(--surface)]/95 text-[var(--foreground)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    <Mountain className="size-4 text-[var(--accent)]" />
                    <span className="text-xs font-bold font-sans tracking-tight max-w-[120px] truncate">{name}</span>
                  </div>
                  <div className="h-2.5 w-1 rounded-b-sm bg-[var(--border-strong)] shadow-sm" />
                </div>
              </div>
            </OverlayView>
          );
        })}
      </GoogleMap>
    </div>
  );
}
