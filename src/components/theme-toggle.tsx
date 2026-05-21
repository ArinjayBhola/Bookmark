'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

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

  const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;

  const handleSelect = (next: ThemeMode) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Theme: ${mode}. Change theme`}
          title={`Theme: ${mode}`}
          className="shrink-0"
        >
          <Icon className="size-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 min-w-[8rem] overflow-hidden rounded-[var(--radius-md)] border bg-[var(--surface)] p-1 text-[var(--foreground)] shadow-[var(--shadow-popover)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <DropdownMenu.Item
            className="relative flex cursor-default select-none items-center rounded-[var(--radius-sm)] px-2 py-1.5 text-sm outline-none transition-colors focus:bg-[var(--surface-muted)] focus:text-[var(--foreground)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            onClick={() => handleSelect('light')}
          >
            <Sun className="mr-2 size-4" />
            <span>Light</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="relative flex cursor-default select-none items-center rounded-[var(--radius-sm)] px-2 py-1.5 text-sm outline-none transition-colors focus:bg-[var(--surface-muted)] focus:text-[var(--foreground)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            onClick={() => handleSelect('dark')}
          >
            <Moon className="mr-2 size-4" />
            <span>Dark</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="relative flex cursor-default select-none items-center rounded-[var(--radius-sm)] px-2 py-1.5 text-sm outline-none transition-colors focus:bg-[var(--surface-muted)] focus:text-[var(--foreground)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            onClick={() => handleSelect('system')}
          >
            <Monitor className="mr-2 size-4" />
            <span>System</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
