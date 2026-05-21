'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart2, Compass, Map, Plus, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import NextTopLoader from 'nextjs-toploader';
import { CommandPalette } from '@/components/command-palette';
import { QuickAddModal } from '@/components/quick-add-modal';
import { ExpeditionDossier } from '@/components/dossier/expedition-dossier';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { cn } from '@/lib/utils';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);
  const [selectedDossierId, setSelectedDossierId] = React.useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  useKeyboardShortcuts({
    onToggleCommandPalette: () => setCmdOpen((prev) => !prev),
    onToggleQuickAdd: () => setQuickAddOpen((prev) => !prev),
  });

  const handleQuickAddSuccess = (discovery: { id: string }) => {
    queryClient.invalidateQueries({ queryKey: ['discoveries'] });
    queryClient.invalidateQueries({ queryKey: ['exploration-stats'] });
    router.push(`/dossier/${discovery.id}`);
  };

  const navItems = [
    { name: 'Map', href: '/', icon: Compass },
    { name: 'Tracking', href: '/tracking', icon: BarChart2 },
  ];

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <NextTopLoader color="var(--accent)" height={2} showSpinner={false} shadow={false} />

      <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b bg-[var(--surface)]/95 px-3 shadow-sm backdrop-blur md:px-5">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex min-w-0 items-center gap-3 rounded-[var(--radius-md)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] border bg-[var(--surface-muted)] text-[var(--accent)]">
            <Map className="size-4" />
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-semibold tracking-tight">Terrain Vault</div>
            <div className="text-xs text-[var(--muted)]">Private expedition archive</div>
          </div>
        </button>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-[var(--radius-md)] border bg-[var(--surface-muted)] p-1 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => router.push(item.href)}
                className={cn(
                  'flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                  isActive
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                )}
              >
                <item.icon className="size-4" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setCmdOpen(true)} className="hidden sm:inline-flex">
            <Search className="size-4" />
            <span>Search</span>
            <kbd className="ml-1 rounded border bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">Ctrl K</kbd>
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => setCmdOpen(true)} className="sm:hidden" aria-label="Open search">
            <Search className="size-4" />
          </Button>
          <ThemeToggle />
          <Button type="button" onClick={() => setQuickAddOpen(true)}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </header>

      <nav className="grid h-12 shrink-0 grid-cols-2 border-b bg-[var(--surface)] md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => router.push(item.href)}
              className={cn('flex items-center justify-center gap-2 text-sm font-semibold', isActive ? 'text-[var(--foreground)]' : 'text-[var(--muted)]')}
            >
              <item.icon className="size-4" />
              {item.name}
            </button>
          );
        })}
      </nav>

      <main className="relative flex-1 overflow-y-auto bg-[var(--background)] scrollbar-premium">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<{ onSelectDiscovery?: (id: string) => void; activeDossierId?: string | null }>, {
              onSelectDiscovery: setSelectedDossierId,
              activeDossierId: selectedDossierId,
            });
          }
          return child;
        })}
      </main>

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onOpenQuickAdd={() => setQuickAddOpen(true)}
        onSelectDiscovery={setSelectedDossierId}
      />

      <QuickAddModal open={quickAddOpen} onOpenChange={setQuickAddOpen} onSuccess={handleQuickAddSuccess} />

      <Sheet open={!!selectedDossierId} onOpenChange={(open) => !open && setSelectedDossierId(null)}>
        <ExpeditionDossier discoveryId={selectedDossierId} onClose={() => setSelectedDossierId(null)} onSelectDiscovery={setSelectedDossierId} />
      </Sheet>
    </div>
  );
}
