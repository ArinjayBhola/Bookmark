'use client';

import * as React from 'react';
import { Activity, TrendingUp, Map as MapIcon, RefreshCw } from 'lucide-react';

interface GPXViewerProps {
  url: string;
  name: string;
}

interface TrackPoint {
  lat: number;
  lon: number;
  ele: number;
  dist: number; // cumulative distance in km
}

export function GPXViewer({ url, name }: GPXViewerProps) {
  const [trackPoints, setTrackPoints] = React.useState<TrackPoint[]>([]);
  const [stats, setStats] = React.useState({ distance: 0, maxEle: 0, minEle: 0, eleGain: 0 });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchGPX() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch GPX file');
        const text = await res.text();

        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const trkpts = xml.getElementsByTagName('trkpt');

        if (trkpts.length === 0) {
          throw new Error('No track points found in GPX file');
        }

        const pts: TrackPoint[] = [];
        let cumDist = 0;
        let maxEle = -Infinity;
        let minEle = Infinity;
        let eleGain = 0;

        // Haversine formula helper
        const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 6371; // km
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };

        for (let i = 0; i < trkpts.length; i++) {
          const pt = trkpts[i];
          const lat = parseFloat(pt.getAttribute('lat') || '0');
          const lon = parseFloat(pt.getAttribute('lon') || '0');
          const eleNode = pt.getElementsByTagName('ele')[0];
          const ele = eleNode ? parseFloat(eleNode.textContent || '0') : 0;

          if (i > 0) {
            const prev = pts[i - 1];
            const d = getDist(prev.lat, prev.lon, lat, lon);
            cumDist += d;
            if (ele > prev.ele) {
              eleGain += ele - prev.ele;
            }
          }

          if (ele > maxEle) maxEle = ele;
          if (ele < minEle) minEle = ele;

          pts.push({ lat, lon, ele, dist: cumDist });
        }

        setTrackPoints(pts);
        setStats({
          distance: Math.round(cumDist * 10) / 10,
          maxEle: Math.round(maxEle),
          minEle: Math.round(minEle),
          eleGain: Math.round(eleGain),
        });
      } catch (err: unknown) {
        console.error('GPX parse error:', err);
        setError(err instanceof Error ? err.message : 'Failed to parse GPX file');
      } finally {
        setLoading(false);
      }
    }

    fetchGPX();
  }, [url]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#e8e6dd] rounded-lg border border-stone-300 animate-pulse">
        <RefreshCw className="size-6 animate-spin text-stone-600 mb-2" />
        <span className="text-xs text-stone-600 font-mono">Parsing GPX telemetry for {name}...</span>
      </div>
    );
  }

  if (error || trackPoints.length === 0) {
    return (
      <div className="p-4 bg-red-100/50 rounded-lg border border-red-300 text-xs text-red-900 font-mono">
        Failed to render GPX track: {error || 'Invalid GPX data structure'}
      </div>
    );
  }

  // Generate SVG polygon points for elevation profile
  const width = 500;
  const height = 140;
  const eleRange = stats.maxEle - stats.minEle || 1;
  const distRange = stats.distance || 1;

  const pointsStr = trackPoints
    .map((p) => {
      const x = (p.dist / distRange) * width;
      const y = height - ((p.ele - stats.minEle) / eleRange) * height * 0.85 - 10;
      return `${x},${y}`;
    })
    .join(' ');

  const areaStr = `0,${height} ${pointsStr} ${width},${height}`;

  return (
    <div className="bg-[#f1efe9] p-4 rounded-lg border border-stone-300 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-stone-300 pb-2">
        <div className="flex items-center gap-2">
          <MapIcon className="size-4 text-stone-700" />
          <span className="text-xs font-bold font-mono text-stone-800">{name} Track Analysis</span>
        </div>
        <span className="text-[10px] bg-[#e8e6dd] px-2 py-0.5 rounded font-mono text-stone-600 border border-stone-300">GPX Telemetry</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-[#e8e6dd] p-2 rounded border border-stone-300">
          <div className="text-[10px] text-stone-500 font-semibold uppercase">Distance</div>
          <div className="text-sm font-bold font-mono text-stone-900 mt-0.5 flex items-center justify-center gap-1">
            <Activity className="size-3.5 text-stone-600" />
            <span>{stats.distance} km</span>
          </div>
        </div>
        <div className="bg-[#e8e6dd] p-2 rounded border border-stone-300">
          <div className="text-[10px] text-stone-500 font-semibold uppercase">Elevation Gain</div>
          <div className="text-sm font-bold font-mono text-stone-900 mt-0.5 flex items-center justify-center gap-1">
            <TrendingUp className="size-3.5 text-emerald-800" />
            <span>+{stats.eleGain} m</span>
          </div>
        </div>
        <div className="bg-[#e8e6dd] p-2 rounded border border-stone-300">
          <div className="text-[10px] text-stone-500 font-semibold uppercase">Max Altitude</div>
          <div className="text-sm font-bold font-mono text-stone-900 mt-0.5">{stats.maxEle} m</div>
        </div>
        <div className="bg-[#e8e6dd] p-2 rounded border border-stone-300">
          <div className="text-[10px] text-stone-500 font-semibold uppercase">Min Altitude</div>
          <div className="text-sm font-bold font-mono text-stone-900 mt-0.5">{stats.minEle} m</div>
        </div>
      </div>

      {/* SVG Elevation Profile */}
      <div className="space-y-1">
        <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Topographic Elevation Profile</div>
        <div className="relative bg-[#e8e6dd] rounded border border-stone-300 p-2 overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 overflow-visible">
            <defs>
              <linearGradient id="eleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#44403c" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#44403c" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#d5d3c9" strokeDasharray="4,4" strokeWidth="1" />
            <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#d5d3c9" strokeDasharray="4,4" strokeWidth="1" />
            <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#d5d3c9" strokeDasharray="4,4" strokeWidth="1" />

            {/* Elevation Area */}
            <polygon points={areaStr} fill="url(#eleGrad)" />
            {/* Elevation Line */}
            <polyline points={pointsStr} fill="none" stroke="#292524" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="absolute left-2 top-2 text-[10px] font-mono font-bold text-stone-700 bg-[#f1efe9]/80 px-1 rounded">
            {stats.maxEle}m
          </div>
          <div className="absolute left-2 bottom-2 text-[10px] font-mono font-bold text-stone-700 bg-[#f1efe9]/80 px-1 rounded">
            {stats.minEle}m
          </div>
          <div className="absolute right-2 bottom-2 text-[10px] font-mono font-bold text-stone-700 bg-[#f1efe9]/80 px-1 rounded">
            {stats.distance}km
          </div>
        </div>
      </div>
    </div>
  );
}
