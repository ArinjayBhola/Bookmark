'use client';

import * as React from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Compass, RefreshCw, Thermometer } from 'lucide-react';

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
