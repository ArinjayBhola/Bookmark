'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Compass, MapPin, Plus, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenQuickAdd: () => void;
  onSelectDiscovery: (id: string) => void;
}

interface DiscoverySearchItem {
  id: string;
  name: string;
  region?: string | null;
  country?: string | null;
  elevation?: number | null;
}

export function CommandPalette({ open, onOpenChange, onOpenQuickAdd, onSelectDiscovery }: CommandPaletteProps) {
  const [search, setSearch] = React.useState('');
  const [activeItemIndex, setActiveItemIndex] = React.useState(0);
  const router = useRouter();

  const { data: discoveries = [], isLoading } = useQuery<DiscoverySearchItem[]>({
    queryKey: ['discoveries-search', search],
    queryFn: async () => {
      const res = await fetch(`/api/discoveries?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Failed to fetch discoveries');
      return res.json();
    },
    enabled: open,
  });

  const quickActions = React.useMemo(
    () => [
      { label: 'New discovery', detail: 'Capture coordinates, notes, and media', icon: Plus, action: onOpenQuickAdd, shortcut: 'Ctrl I' },
      { label: 'Open map', detail: 'Return to spatial exploration', icon: Compass, action: () => router.push('/'), shortcut: 'Alt M' },
      { label: 'Open tracking', detail: 'Review saved discoveries', icon: BarChart2, action: () => router.push('/tracking'), shortcut: 'Alt T' },
    ],
    [onOpenQuickAdd, router]
  );

  const showQuickActions = search.trim() === '';
  const totalItemsCount = (showQuickActions ? quickActions.length : 0) + discoveries.length;

  const handleSelectAction = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (totalItemsCount === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveItemIndex((prev) => (prev + 1) % totalItemsCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveItemIndex((prev) => (prev - 1 + totalItemsCount) % totalItemsCount);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showQuickActions && activeItemIndex < quickActions.length) {
        handleSelectAction(quickActions[activeItemIndex].action);
        return;
      }
      const discoveryIdx = activeItemIndex - (showQuickActions ? quickActions.length : 0);
      const discovery = discoveries[discoveryIdx];
      if (discovery) handleSelectAction(() => onSelectDiscovery(discovery.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center border-b px-4">
          <Search className="mr-3 size-5 shrink-0 text-[var(--muted)]" />
          <input
            type="text"
            className="h-14 w-full bg-transparent text-base text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
            placeholder="Search discoveries or run a command"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveItemIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        <div className="max-h-[62vh] space-y-5 overflow-y-auto p-3 scrollbar-premium">
          {showQuickActions && (
            <CommandSection title="Commands">
              {quickActions.map((item, idx) => (
                <CommandItem
                  key={item.label}
                  active={activeItemIndex === idx}
                  icon={<item.icon className="size-4" />}
                  title={item.label}
                  detail={item.detail}
                  shortcut={item.shortcut}
                  onMouseEnter={() => setActiveItemIndex(idx)}
                  onClick={() => handleSelectAction(item.action)}
                />
              ))}
            </CommandSection>
          )}

          <CommandSection title={showQuickActions ? 'Discoveries' : 'Matching discoveries'}>
            {isLoading ? (
              <div className="rounded-[var(--radius-md)] border bg-[var(--surface-muted)] p-4 text-center text-sm text-[var(--muted)]">Searching archive...</div>
            ) : discoveries.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border bg-[var(--surface-muted)] p-4 text-center text-sm text-[var(--muted)]">
                No discoveries found{search ? ` for "${search}"` : ''}.
              </div>
            ) : (
              discoveries.map((d, idx) => {
                const globalIdx = idx + (showQuickActions ? quickActions.length : 0);
                return (
                  <CommandItem
                    key={d.id}
                    active={activeItemIndex === globalIdx}
                    icon={<MapPin className="size-4" />}
                    title={d.name}
                    detail={`${d.region || d.country || 'Unknown region'}${d.elevation ? ` • ${d.elevation.toLocaleString()}m` : ''}`}
                    onMouseEnter={() => setActiveItemIndex(globalIdx)}
                    onClick={() => handleSelectAction(() => onSelectDiscovery(d.id))}
                  />
                );
              })
            )}
          </CommandSection>
        </div>

        <div className="flex items-center justify-between border-t bg-[var(--surface-muted)] px-4 py-2 text-xs text-[var(--muted)]">
          <span>Esc to close</span>
          <span>Arrow keys to navigate, Enter to select</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommandSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="px-1 text-xs font-semibold uppercase text-[var(--muted)]">{title}</div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function CommandItem({
  active,
  icon,
  title,
  detail,
  shortcut,
  onClick,
  onMouseEnter,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  detail?: string;
  shortcut?: string;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        active ? 'bg-[var(--surface-muted)] text-[var(--foreground)]' : 'text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border bg-[var(--surface)] text-[var(--accent)]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {detail && <span className="block truncate text-xs text-[var(--muted)]">{detail}</span>}
      </span>
      {shortcut && <kbd className="rounded border bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">{shortcut}</kbd>}
    </button>
  );
}
