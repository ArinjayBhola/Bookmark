'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface ShortcutHandlers {
  onToggleCommandPalette?: () => void;
  onToggleQuickAdd?: () => void;
}

export function useKeyboardShortcuts({ onToggleCommandPalette, onToggleQuickAdd }: ShortcutHandlers) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Toggle Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onToggleCommandPalette?.();
      }

      // Cmd/Ctrl + I: Toggle Quick Add Modal
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        onToggleQuickAdd?.();
      }

      // Alt + M: Go to Map
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        router.push('/');
      }

      // Alt + T: Go to Tracking
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        router.push('/tracking');
      }


    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCommandPalette, onToggleQuickAdd, router]);
}
