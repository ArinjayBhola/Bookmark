'use client';

import * as React from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Compass, RefreshCw, Thermometer, AlertTriangle, ShieldAlert } from 'lucide-react';

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
  elevation?: number | null;
}

interface CurrentWeather {
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  time: string;
}

interface DailyWeather {
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  snowfall_sum?: number[];
  wind_speed_10m_max?: number[];
  wind_gusts_10m_max?: number[];
}

export function WeatherWidget({ latitude, longitude, elevation }: WeatherWidgetProps) {
  const [current, setCurrent] = React.useState<CurrentWeather | null>(null);
  const [daily, setDaily] = React.useState<DailyWeather | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleRefresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/weather?latitude=${latitude}&longitude=${longitude}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch weather telemetry');
      const data = await res.json();
      setCurrent(data.current_weather);
      setDaily(data.daily);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Weather fetch error');
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude]);

  React.useEffect(() => {
    let active = true;
    const loadWeather = async () => {
      try {
        const url = `/api/weather?latitude=${latitude}&longitude=${longitude}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch weather telemetry');
        const data = await res.json();
        if (active) {
          setCurrent(data.current_weather);
          setDaily(data.daily);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (active) {
          console.error(err);
          setError(err instanceof Error ? err.message : 'Weather fetch error');
          setLoading(false);
        }
      }
    };

    loadWeather();
    return () => {
      active = false;
    };
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-zinc-50 rounded-2xl border border-zinc-200 animate-pulse">
        <RefreshCw className="size-5 animate-spin text-zinc-400 mb-2" />
        <span className="text-xs text-zinc-500 font-medium">Scanning meteorological satellites...</span>
      </div>
    );
  }

  if (error || !current) {
    return (
      <div className="p-4 bg-red-50/50 rounded-2xl border border-red-200 text-xs text-red-800 font-medium">
        Failed to fetch alpine weather forecast: {error || 'No telemetry received'}
      </div>
    );
  }

  // WMO Weather interpretation codes
  const getWeatherDesc = (code: number) => {
    if (code === 0) return { label: 'Clear Sky', icon: <Sun className="size-8 text-amber-500" /> };
    if (code >= 1 && code <= 3) return { label: 'Partly Cloudy', icon: <Cloud className="size-8 text-sky-400" /> };
    if (code >= 45 && code <= 48) return { label: 'Fog / Mist', icon: <Cloud className="size-8 text-zinc-400" /> };
    if (code >= 51 && code <= 67) return { label: 'Rain / Drizzle', icon: <CloudRain className="size-8 text-sky-500" /> };
    if (code >= 71 && code <= 77) return { label: 'Snow Flurries', icon: <CloudSnow className="size-8 text-sky-100 fill-sky-200" /> };
    if (code >= 80 && code <= 82) return { label: 'Heavy Showers', icon: <CloudRain className="size-8 text-sky-600" /> };
    if (code >= 85 && code <= 86) return { label: 'Heavy Snowfall', icon: <CloudSnow className="size-8 text-sky-300 fill-sky-300 animate-bounce" /> };
    return { label: 'Stormy Skies', icon: <CloudRain className="size-8 text-red-500" /> };
  };

  const weather = getWeatherDesc(current.weathercode);

  // Compass directions helper
  const getWindDirectionDesc = (degree: number) => {
    const sectors = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((degree % 360) / 45) % 8);
    return sectors[index];
  };

  // Alpine Avalanche Risk Assessment (AARA) model
  const getAvalancheRisk = (snowfall: number, windSpeed: number, maxTemp: number) => {
    let score = 1; // 1 = Low, 2 = Moderate, 3 = Considerable, 4 = High, 5 = Extreme
    let reasons: string[] = [];

    if (snowfall >= 30) {
      score = Math.max(score, 5);
      reasons.push('Extreme fresh snowfall (>30cm)');
    } else if (snowfall >= 15) {
      score = Math.max(score, 4);
      reasons.push('Heavy fresh snowfall (>15cm)');
    } else if (snowfall >= 8) {
      score = Math.max(score, 3);
      reasons.push('Moderate fresh snowfall (>8cm)');
    } else if (snowfall >= 3) {
      score = Math.max(score, 2);
      reasons.push('Light snowfall');
    }

    if (windSpeed >= 45) {
      score = Math.max(score, score >= 3 ? 5 : 4);
      reasons.push('Gale force winds (>45km/h) creating wind slabs');
    } else if (windSpeed >= 25) {
      score = Math.max(score, score >= 2 ? score + 1 : 2);
      reasons.push('Moderate-to-high winds creating snow drifts');
    }

    if (maxTemp >= 4 && snowfall > 0) {
      score = Math.min(5, score + 1);
      reasons.push('Rapid daytime warming triggering wet loose slides');
    }

    const levels = [
      { 
        level: 'Low', 
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200', 
        score: 1, 
        desc: 'Generally safe climbing conditions. Natural avalanches very unlikely.' 
      },
      { 
        level: 'Moderate', 
        color: 'text-amber-700 bg-amber-50 border-amber-200', 
        score: 2, 
        desc: 'Human-triggered avalanches possible on steep slope terrain. Natural avalanches unlikely.' 
      },
      { 
        level: 'Considerable', 
        color: 'text-orange-700 bg-orange-50 border-orange-200', 
        score: 3, 
        desc: 'Human-triggered slab avalanches likely. Natural avalanches possible. Exercise high caution.' 
      },
      { 
        level: 'High', 
        color: 'text-rose-700 bg-rose-50 border-rose-200 font-bold', 
        score: 4, 
        desc: 'Natural avalanches highly likely. Dangerous slab propagation. Avoid steep alpine aspects.' 
      },
      { 
        level: 'Extreme', 
        color: 'text-red-700 bg-red-50 border-red-200 font-bold animate-pulse', 
        score: 5, 
        desc: 'Widespread natural avalanches certain. Extreme danger. Avoid any travel in avalanche terrain.' 
      }
    ];

    const currentRisk = levels[score - 1];
    return {
      ...currentRisk,
      reasons: reasons.length > 0 ? reasons.join(', ') : 'Stable temperature, minimal wind, and no new snowfall.'
    };
  };

  return (
    <div className="bg-[#fcfbf9] p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
        <div className="flex items-center gap-2">
          <Thermometer className="size-5 text-sky-500" />
          <span className="text-xs font-bold font-serif text-zinc-900 uppercase tracking-wider">Live Alpine Conditions</span>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors border border-transparent hover:border-zinc-200"
          title="Refresh forecast"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      {/* Hero Current Weather Panel */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-zinc-150 shadow-2xs">
        <div className="flex items-center gap-4">
          {weather.icon}
          <div>
            <div className="text-3xl font-bold font-sans text-zinc-950">{current.temperature}°C</div>
            <div className="text-xs font-bold text-zinc-600">{weather.label}</div>
            {elevation && <div className="text-[10px] text-zinc-400 font-medium">Station grid elevation model</div>}
          </div>
        </div>

        {/* Wind details (Crucial for alpine) */}
        <div className="text-right space-y-1 border-l border-zinc-100 pl-6">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Summit Wind</div>
          <div className="flex items-center gap-1.5 justify-end text-sm font-bold text-zinc-800">
            <Wind className="size-4 text-zinc-500" />
            <span>{current.windspeed} km/h</span>
          </div>
          <div className="flex items-center gap-1 justify-end text-xs font-medium text-zinc-500">
            <Compass className="size-3 text-sky-500" />
            <span>{current.winddirection}° ({getWindDirectionDesc(current.winddirection)})</span>
          </div>
        </div>
      </div>

      {/* Avalanche Hazard Advisory */}
      {daily && (
        (() => {
          const snowfall = daily.snowfall_sum?.[0] ?? 0;
          const windSpeed = daily.wind_speed_10m_max?.[0] ?? current.windspeed ?? 0;
          const maxTemp = daily.temperature_2m_max?.[0] ?? current.temperature ?? 0;
          const windGusts = daily.wind_gusts_10m_max?.[0] ?? 0;
          
          const risk = getAvalancheRisk(snowfall, windSpeed, maxTemp);

          return (
            <div className={`p-4 rounded-2xl border ${risk.color} flex flex-col gap-2 shadow-3xs`}>
              <div className="flex items-center justify-between border-b border-current/10 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="size-4 shrink-0" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Avalanche Advisory</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase border border-current">
                  Level {risk.score} / 5
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-extrabold flex items-center gap-1">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  Risk Level: {risk.level}
                </div>
                <p className="text-[10px] leading-relaxed opacity-95 font-medium">
                  {risk.desc}
                </p>
                <div className="text-[9px] opacity-80 font-bold">
                  Key Concerns: <span className="font-medium italic">{risk.reasons}</span>
                </div>
              </div>

              {/* Telemetry sub-grid */}
              <div className="grid grid-cols-3 gap-2 mt-1 pt-1.5 border-t border-current/10 text-[9px] font-extrabold">
                <div>
                  <span className="opacity-75 block text-[8px] uppercase tracking-wider">Daily Snowfall</span>
                  <span>{snowfall.toFixed(1)} cm</span>
                </div>
                <div>
                  <span className="opacity-75 block text-[8px] uppercase tracking-wider">Peak Gusts</span>
                  <span>{windGusts.toFixed(1)} km/h</span>
                </div>
                <div>
                  <span className="opacity-75 block text-[8px] uppercase tracking-wider">Max Temp</span>
                  <span>{maxTemp.toFixed(1)}°C</span>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* 3-Day Outline Forecast */}
      {daily && daily.time && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">3-Day Forecast Outlook</div>
          <div className="grid grid-cols-3 gap-3">
            {daily.time.slice(1, 4).map((time, idx) => {
              const forecastIdx = idx + 1; // skip today
              const dateObj = new Date(time);
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
              const minT = Math.round(daily.temperature_2m_min[forecastIdx]);
              const maxT = Math.round(daily.temperature_2m_max[forecastIdx]);
              const dayWeather = getWeatherDesc(daily.weathercode[forecastIdx]);

              return (
                <div key={time} className="bg-white p-3.5 rounded-xl border border-zinc-150 text-center space-y-1.5 shadow-3xs">
                  <div className="text-xs font-bold text-zinc-500">{dayName}</div>
                  <div className="flex justify-center">{dayWeather.icon}</div>
                  <div className="text-[10px] font-bold text-zinc-800">{dayWeather.label}</div>
                  <div className="text-[11px] font-bold font-sans text-zinc-900 mt-1">
                    {maxT}° / <span className="text-zinc-500 font-medium">{minT}°</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
