'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ThemeMode = 'light' | 'dark' | 'system';
const THEME_STORAGE_KEY = 'terrain-vault-theme';
const THEME_CHANGE_EVENT = 'terrain-vault-theme-change';

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', mode === 'dark' || (mode === 'system' && prefersDark));
  document.documentElement.dataset.theme = mode;
}

function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function subscribeTheme(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

export function ThemeToggle() {
  const mode = React.useSyncExternalStore<ThemeMode>(subscribeTheme, readStoredTheme, () => 'system');

  React.useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const current = readStoredTheme();
      if (current === 'system') applyTheme('system');
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [mode]);

  const nextMode: Record<ThemeMode, ThemeMode> = {
    light: 'dark',
    dark: 'system',
    system: 'light',
  };

  const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={`Theme: ${mode}. Change theme`}
      title={`Theme: ${mode}`}
      onClick={() => {
        const next = nextMode[mode];
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
        applyTheme(next);
        window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
      }}
      className="shrink-0"
    >
      <Icon className="size-4" />
    </Button>
  );
}
