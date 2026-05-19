'use client';

import * as React from 'react';
import Map, { Marker, NavigationControl, ViewStateChangeEvent, Source, Layer } from 'react-map-gl/maplibre';
import useSupercluster from 'use-supercluster';
import { Mountain, MapPin } from 'lucide-react';
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
        attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }
    },
    layers: [
      {
        id: 'satellite',
        type: 'raster',
        source: 'esri-satellite',
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

  const [clickedLocation, setClickedLocation] = React.useState<{ latitude: number; longitude: number } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('terrain_vault_clicked_location');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return null;
  });

  const [userGeolocation, setUserGeolocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [copiedPin, setCopiedPin] = React.useState(false);
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

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (clickedLocation) {
        sessionStorage.setItem('terrain_vault_clicked_location', JSON.stringify(clickedLocation));
      } else {
        sessionStorage.removeItem('terrain_vault_clicked_location');
      }
    }
  }, [clickedLocation]);

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
    <div className="w-full h-full relative bg-[#fafafa]">
      {/* Map Style Toggle Overlay */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-zinc-200/80 flex items-center gap-1 font-sans">
        <button
          type="button"
          onClick={() => setMapMode('STREET')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${mapMode === 'STREET' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          🗺️ Street
        </button>
        <button
          type="button"
          onClick={() => setMapMode('SATELLITE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${mapMode === 'SATELLITE' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          🛰️ Satellite
        </button>
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        onClick={(evt) => {
          if (evt.lngLat) {
            setClickedLocation({
              latitude: evt.lngLat.lat,
              longitude: evt.lngLat.lng,
            });
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
              <div className="absolute -top-1 size-8 bg-sky-500/30 rounded-full animate-ping pointer-events-none" />
              <div className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 text-white rounded-2xl border-2 border-white shadow-xl backdrop-blur-md transition-transform active:scale-95">
                <MapPin className="size-4 animate-pulse text-white shrink-0" />
                <span className="text-xs font-bold font-sans tracking-tight">
                  {copiedUserPin ? '✅ Copied My Coordinates!' : 'My Location'}
                </span>
              </div>
              <div className="w-1.5 h-3 bg-sky-800 shadow-md rounded-b-sm" />
            </div>
          </Marker>
        )}

        {/* Clicked / Dropped Pin Marker */}
        {clickedLocation && (
          <Marker latitude={clickedLocation.latitude} longitude={clickedLocation.longitude} anchor="bottom">
            <div
              className="relative flex flex-col items-center cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                const textToCopy = `${clickedLocation.latitude.toFixed(6)}, ${clickedLocation.longitude.toFixed(6)}`;
                navigator.clipboard.writeText(textToCopy);
                setCopiedPin(true);
                setTimeout(() => setCopiedPin(false), 2000);
              }}
            >
              <div className="absolute -top-1 size-8 bg-purple-500/30 rounded-full animate-ping pointer-events-none" />
              <div className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 text-white rounded-2xl border-2 border-white shadow-xl backdrop-blur-md transition-transform active:scale-95">
                <MapPin className="size-4 animate-pulse text-white shrink-0" />
                <span className="text-xs font-bold font-sans tracking-tight">
                  {copiedPin ? '✅ Copied Coordinates!' : `Dropped Pin (${clickedLocation.latitude.toFixed(2)}, ${clickedLocation.longitude.toFixed(2)})`}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setClickedLocation(null);
                  }}
                  className="ml-1 p-0.5 rounded-full hover:bg-purple-700 transition-colors text-white/80 hover:text-white"
                  title="Remove pin"
                >
                  ✕
                </button>
              </div>
              <div className="w-1.5 h-3 bg-purple-800 shadow-md rounded-b-sm" />
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
                  className="flex items-center justify-center size-10 rounded-full bg-white backdrop-blur-md text-sky-600 font-bold text-sm border-2 border-sky-500 shadow-xl cursor-pointer hover:scale-110 transition-transform"
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
                  <div className="bg-white/95 backdrop-blur-md text-zinc-800 text-sm px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap font-sans flex items-center gap-1.5 border border-zinc-200">
                    <span className="font-bold">{name}</span>
                    {elevation && <span className="text-sky-600 font-semibold">({elevation}m)</span>}
                  </div>
                  <div className="size-2 bg-white rotate-45 -mt-1 border-r border-b border-zinc-200" />
                </div>

                {/* Marker Pin */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-md transition-all group-hover:scale-105 group-hover:shadow-lg ${
                    activeDossierId === discoveryId
                      ? 'bg-zinc-950 text-white border-zinc-900 shadow-zinc-950/20'
                      : 'bg-white/95 text-zinc-900 border-zinc-200/80 hover:bg-white shadow-zinc-900/10'
                  }`}
                >
                  <Mountain className="size-4 text-sky-500" />
                  <span className="text-xs font-bold font-sans tracking-tight max-w-[120px] truncate">{name}</span>
                </div>
                <div className="w-1 h-2.5 bg-zinc-300 shadow-sm rounded-b-sm" />
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
