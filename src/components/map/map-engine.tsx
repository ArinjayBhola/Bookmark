'use client';

import * as React from 'react';
import Map, { Marker, NavigationControl, ViewStateChangeEvent, Source, Layer } from 'react-map-gl/maplibre';
import useSupercluster from 'use-supercluster';
import { Layers, LocateFixed, Mountain, Rotate3D } from 'lucide-react';
import { getDiscoveryById } from '@/app/actions/discovery';
import { useQuery } from '@tanstack/react-query';
import 'maplibre-gl/dist/maplibre-gl.css';
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

const MAP_STYLES = {
  STREET: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  SATELLITE: {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: 'Tiles © Esri'
      },
      'esri-reference': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256
      },
      'esri-transportation': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256
      }
    },
    layers: [
      {
        id: 'satellite',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 18
      },
      {
        id: 'transportation',
        type: 'raster',
        source: 'esri-transportation',
        minzoom: 0,
        maxzoom: 18
      },
      {
        id: 'reference',
        type: 'raster',
        source: 'esri-reference',
        minzoom: 0,
        maxzoom: 18
      }
    ]
  }
};

interface ViewState {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

export function MapEngine({ discoveries, activeDossierId, onSelectDiscovery }: MapEngineProps) {
  const mapRef = React.useRef<import('react-map-gl/maplibre').MapRef>(null);

  // GPX Active Dossier Overlay State & Query
  const [routeLine, setRouteLine] = React.useState<[number, number][] | null>(null);

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
        const coords: [number, number][] = [];

        for (let i = 0; i < trkpts.length; i++) {
          const pt = trkpts[i];
          const lat = parseFloat(pt.getAttribute('lat') || '0');
          const lon = parseFloat(pt.getAttribute('lon') || '0');
          if (lat && lon) {
            coords.push([lon, lat]);
          }
        }

        if (coords.length > 0) {
          setRouteLine(coords);

          // Fit bounds to make the route overlay beautifully centered
          let minLat = Infinity, maxLat = -Infinity;
          let minLon = Infinity, maxLon = -Infinity;
          for (const [lon, lat] of coords) {
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
          }

          mapRef.current?.fitBounds(
            [minLon, minLat, maxLon, maxLat],
            { padding: 80, duration: 1500 }
          );
        }
      } catch (err) {
        console.error('GPX map overlay parse error:', err);
        setRouteLine(null);
      }
    };

    loadGPXRoute();
  }, [gpxFiles]);

  // Fly-to selected discovery if there is no GPX file overlay
  // 1. Session Storage Initialization
  const [mapMode, setMapMode] = React.useState<'STREET' | 'SATELLITE'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('terrain_vault_map_mode');
      if (saved === 'STREET' || saved === 'SATELLITE') return saved;
    }
    return 'STREET';
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
        mapRef.current?.flyTo({
          center: [activeDiscovery.longitude, activeDiscovery.latitude],
          zoom: 12,
          duration: 1500,
        });
        
        // Defer setViewState to avoid synchronous cascading renders during commit phase
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
  }, [activeDiscovery]);



  const [userGeolocation, setUserGeolocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [copiedUserPin, setCopiedUserPin] = React.useState(false);
  const [is3D, setIs3D] = React.useState(false);

  // Track if we restored from session storage so we don't overwrite with initial geolocation flyTo
  const isRestoredSession = React.useRef(false);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('terrain_vault_view_state')) {
        isRestoredSession.current = true;
      }
    }
  }, []);

  // Save state changes to sessionStorage
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



  // Load and apply AWS public Terrarium 3D elevation tiles to Maplibre
  React.useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const applyTerrain = () => {
      if (is3D) {
        if (!map.getSource('terrain-source')) {
          map.addSource('terrain-source', {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            encoding: 'terrarium',
            tileSize: 256,
          });
        }
        map.setTerrain({ source: 'terrain-source', exaggeration: 1.5 });

        // Add Hillshade layer if not exists
        if (!map.getLayer('hillshade-layer')) {
          const firstSymbolId = map.getStyle().layers.find((layer: { id: string; type: string }) => layer.type === 'symbol' || layer.id === 'reference' || layer.id === 'transportation')?.id;
          map.addLayer({
            id: 'hillshade-layer',
            type: 'hillshade',
            source: 'terrain-source',
            paint: {
              'hillshade-shadow-color': '#0f172a',
              'hillshade-highlight-color': '#ffffff',
              'hillshade-exaggeration': 0.8
            }
          }, firstSymbolId);
        }


      } else {
        map.setTerrain(null);
        if (map.getLayer('hillshade-layer')) map.removeLayer('hillshade-layer');
      }
    };

    if (map.isStyleLoaded()) {
      applyTerrain();
    } else {
      map.on('style.load', applyTerrain);
    }

    return () => {
      map.off('style.load', applyTerrain);
    };
  }, [is3D, mapMode]);

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
            mapRef.current?.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 10,
              duration: 2000,
            });
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
  }, []);

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
    if (mapRef.current) {
      const mapBounds = mapRef.current.getMap().getBounds();
      setBounds([mapBounds.getWest(), mapBounds.getSouth(), mapBounds.getEast(), mapBounds.getNorth()]);
    }
  }, [viewState]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options: { radius: 50, maxZoom: 14 },
  });

  const activeMapStyle = mapMode === 'STREET' ? MAP_STYLES.STREET : (MAP_STYLES.SATELLITE as unknown as import('maplibre-gl').StyleSpecification);

  return (
    <div className="relative h-full w-full bg-[var(--background)]">
      {/* Map Style Toggle Overlay */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-[var(--radius-md)] border bg-[var(--surface)]/95 p-1 font-sans shadow-[var(--shadow-soft)] backdrop-blur">
        <button
          type="button"
          onClick={() => setMapMode('STREET')}
          className={`flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition ${mapMode === 'STREET' ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
        >
          <Layers className="size-3.5" />
          Street
        </button>
        <button
          type="button"
          onClick={() => setMapMode('SATELLITE')}
          className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition ${mapMode === 'SATELLITE' ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
        >
          Satellite
        </button>
        <div className="mx-1 h-4 w-px bg-[var(--border)]" />
        <button
          type="button"
          onClick={() => {
            const new3D = !is3D;
            setIs3D(new3D);
            if (new3D) {
              mapRef.current?.easeTo({
                pitch: 60,
                duration: 1000,
              });
              setViewState((prev) => ({
                ...prev,
                pitch: 60,
              }));
            } else {
              mapRef.current?.easeTo({
                pitch: 0,
                duration: 1000,
              });
              setViewState((prev) => ({
                ...prev,
                pitch: 0,
              }));
            }
          }}
          className={`flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition ${
            is3D 
              ? 'bg-[var(--accent)] text-white shadow-sm dark:text-zinc-950' 
              : 'text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <Rotate3D className="size-3.5" />
          3D
        </button>
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        maxPitch={85}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        onLoad={() => {
          if (mapRef.current) {
            const mapBounds = mapRef.current.getMap().getBounds();
            setBounds([mapBounds.getWest(), mapBounds.getSouth(), mapBounds.getEast(), mapBounds.getNorth()]);
          }
        }}
        onResize={() => {
          if (mapRef.current) {
            const mapBounds = mapRef.current.getMap().getBounds();
            setBounds([mapBounds.getWest(), mapBounds.getSouth(), mapBounds.getEast(), mapBounds.getNorth()]);
          }
        }}

        style={{ width: '100%', height: '100%' }}
        mapStyle={activeMapStyle}
        maxZoom={18}
        minZoom={3}
      >
        <NavigationControl position="bottom-right" />

        {/* GPX Route Polyline Overlay */}
        {routeLine && routeLine.length > 0 && (
          <Source
            id="route-polyline"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeLine,
              },
            }}
          >
            <Layer
              id="route-line-layer"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
              paint={{
                'line-color': '#0ea5e9',
                'line-width': 5,
                'line-opacity': 0.85,
              }}
            />
          </Source>
        )}

        {/* User Actual Geolocation Marker */}
        {userGeolocation && (
          <Marker latitude={userGeolocation.latitude} longitude={userGeolocation.longitude} anchor="bottom">
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
          </Marker>
        )}



        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount, discoveryId, name, elevation } = cluster.properties as ClusterProperties;

          if (isCluster) {
            return (
              <Marker key={`cluster-${cluster.id}`} latitude={latitude} longitude={longitude}>
                <div
                  className="flex size-10 cursor-pointer items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--surface)] text-sm font-bold text-[var(--accent)] shadow-[var(--shadow-soft)] backdrop-blur transition-transform hover:scale-105"
                  onClick={() => {
                    const expansionZoom = Math.min(supercluster?.getClusterExpansionZoom(cluster.id as number) || 12, 16);
                    mapRef.current?.flyTo({
                      center: [longitude, latitude],
                      zoom: expansionZoom,
                      duration: 800,
                    });
                  }}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }

          return (
            <Marker key={`marker-${discoveryId}`} latitude={latitude} longitude={longitude} anchor="bottom">
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
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
