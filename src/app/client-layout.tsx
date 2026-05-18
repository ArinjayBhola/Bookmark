'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Compass, BarChart2, Plus, Mountain, Search } from 'lucide-react';
import { CommandPalette } from '@/components/command-palette';
import { QuickAddModal } from '@/components/quick-add-modal';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { Sheet } from '@/components/ui/sheet';
import { ExpeditionDossier } from '@/components/dossier/expedition-dossier';
import { useQueryClient } from '@tanstack/react-query';
import NextTopLoader from 'nextjs-toploader';

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

  const handleSelectDiscovery = (id: string) => {
    setSelectedDossierId(id);
  };

  const handleQuickAddSuccess = (discovery: { id: string }) => {
    queryClient.invalidateQueries({ queryKey: ['discoveries'] });
    queryClient.invalidateQueries({ queryKey: ['exploration-stats'] });
    router.push(`/dossier/${discovery.id}`);
  };

  const navItems = [
    { name: 'Map', href: '/', icon: Compass, shortcut: '⌥M' },
    { name: 'Tracking', href: '/tracking', icon: BarChart2, shortcut: '⌥T' },
  ];

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-[#fafafa] text-zinc-900 font-sans antialiased">
      <NextTopLoader color="#0ea5e9" height={3} showSpinner={false} shadow="0 0 10px #0ea5e9,0 0 5px #0ea5e9" />
      
      {/* Premium Light Mode Top Navigation */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shadow-sm">
            <Mountain className="size-4" />
          </div>
          <span className="font-serif font-bold text-lg text-zinc-800 tracking-tight">Terrain Vault</span>
        </div>

        {/* Central Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-100/50 p-1 rounded-2xl border border-zinc-200">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-sky-600 shadow-sm border border-zinc-200/50' 
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
                }`}
              >
                <item.icon className="size-4" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-medium transition-colors"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white border border-zinc-300 rounded text-zinc-500 shadow-sm">Ctrl+K</kbd>
          </button>
          
          <button
            onClick={() => setQuickAddOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="size-4" />
            <span>Add</span>
            <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-zinc-700 rounded text-zinc-200">Ctrl+I</kbd>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-[#fafafa]">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<{ onSelectDiscovery?: (id: string) => void }>, { onSelectDiscovery: handleSelectDiscovery });
          }
          return child;
        })}
      </main>

      {/* Global Modals & Sheets */}
      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onOpenQuickAdd={() => setQuickAddOpen(true)}
        onSelectDiscovery={handleSelectDiscovery}
      />

      <QuickAddModal open={quickAddOpen} onOpenChange={setQuickAddOpen} onSuccess={handleQuickAddSuccess} />

      <Sheet open={!!selectedDossierId} onOpenChange={(open) => !open && setSelectedDossierId(null)}>
        <ExpeditionDossier discoveryId={selectedDossierId} onClose={() => setSelectedDossierId(null)} onSelectDiscovery={handleSelectDiscovery} />
      </Sheet>
    </div>
  );
}
