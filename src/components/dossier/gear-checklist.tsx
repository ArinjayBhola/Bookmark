'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExpeditionGear, createGearItem, toggleGearItem, deleteGearItem, loadGearPresets } from '@/app/actions/gear';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Plus, Trash2, RefreshCw, Loader2 } from 'lucide-react';

interface GearChecklistProps {
  discoveryId: string;
  category: string; // Discovery category to load presets
}

interface GearItem {
  id: string;
  itemName: string;
  category: string;
  packed: boolean;
}

export function GearChecklist({ discoveryId }: GearChecklistProps) {
  const queryClient = useQueryClient();
  const [newItemName, setNewItemName] = React.useState('');
  const [newCategory, setNewCategory] = React.useState('Equipment');

  const { data: gearList = [], isLoading } = useQuery({
    queryKey: ['gear-checklist', discoveryId],
    queryFn: () => getExpeditionGear(discoveryId),
    placeholderData: (previousData) => previousData,
  });

  const addMutation = useMutation({
    mutationFn: (data: { discoveryId: string; itemName: string; category: string }) => createGearItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gear-checklist', discoveryId] });
      setNewItemName('');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { id: string; packed: boolean }) => toggleGearItem(data.id, data.packed, discoveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gear-checklist', discoveryId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGearItem(id, discoveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gear-checklist', discoveryId] });
    },
  });

  const presetMutation = useMutation({
    mutationFn: (presetCat: string) => loadGearPresets(discoveryId, presetCat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gear-checklist', discoveryId] });
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    addMutation.mutate({ discoveryId, itemName: newItemName, category: newCategory });
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-zinc-500 animate-pulse bg-zinc-50 rounded-2xl border border-zinc-200">
        Reviewing packing lists...
      </div>
    );
  }

  // Group items by category
  const categories = ['Camp & Pack', 'Apparel', 'Equipment', 'Safety & Navigation'];
  const groupedGear = gearList.reduce((acc, item) => {
    const cat = item.category || 'Equipment';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, GearItem[]>);

  const totalItems = gearList.length;
  const packedItems = gearList.filter((item) => item.packed).length;
  const progressPercent = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-sky-500" />
          <h3 className="text-sm font-bold font-serif text-zinc-950">Expedition Packing Checklist</h3>
        </div>
        {totalItems > 0 && (
          <div className="text-right">
            <span className="text-xs font-bold text-sky-600 bg-sky-50 border border-sky-100 px-3 py-1.5 rounded-xl shadow-xs">
              Packed: {packedItems} / {totalItems} ({progressPercent}%)
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {totalItems > 0 && (
        <div className="w-full bg-zinc-150 h-2 rounded-full overflow-hidden border border-zinc-200/50 shadow-inner">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {totalItems === 0 ? (
        <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-200 shadow-inner text-center space-y-4">
          <p className="text-sm text-zinc-500 font-medium">No items added to this expedition checklist yet.</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => presetMutation.mutate('ROUTE')}
              disabled={presetMutation.isPending}
              className="rounded-xl text-xs font-bold px-4 py-2 border-zinc-200 text-zinc-800"
            >
              {presetMutation.isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              Load Route Pack Template
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => presetMutation.mutate('GLACIER')}
              disabled={presetMutation.isPending}
              className="rounded-xl text-xs font-bold px-4 py-2 border-zinc-200 text-sky-600 hover:bg-sky-50"
            >
              {presetMutation.isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              Load Glacier Traverse Template
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => presetMutation.mutate('CAMPSITE')}
              disabled={presetMutation.isPending}
              className="rounded-xl text-xs font-bold px-4 py-2 border-zinc-200 text-zinc-800"
            >
              {presetMutation.isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              Load Camp & Kitchen Template
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((catName) => {
            const items = groupedGear[catName] || [];
            if (items.length === 0) return null;

            return (
              <div key={catName} className="space-y-2 bg-zinc-50/50 p-5 rounded-2xl border border-zinc-200 shadow-xs">
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-150 pb-1.5">
                  {catName}
                </div>
                <div className="space-y-1.5 pt-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 transition-all shadow-2xs group"
                    >
                      <label className="flex items-center gap-3 cursor-pointer select-none min-w-0 pr-4 flex-1">
                        <input
                          type="checkbox"
                          checked={item.packed}
                          onChange={(e) => toggleMutation.mutate({ id: item.id, packed: e.target.checked })}
                          disabled={toggleMutation.isPending}
                          className="size-4.5 rounded border-zinc-300 text-sky-600 focus:ring-sky-500/50 transition-colors cursor-pointer"
                        />
                        <span className={`text-xs font-medium truncate ${item.packed ? 'line-through text-zinc-400 font-normal' : 'text-zinc-900'}`}>
                          {item.itemName}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove "${item.itemName}"?`)) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="text-zinc-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove item"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Item Form */}
      <form onSubmit={handleAddItem} className="flex gap-2.5 bg-zinc-50 p-4 rounded-2xl border border-zinc-200 shadow-2xs">
        <Input
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Add custom packing item... e.g. Goretex Gaiters"
          className="bg-white border-zinc-200 text-xs font-medium rounded-xl h-10 px-3 flex-1"
        />
        <Select value={newCategory} onValueChange={setNewCategory}>
          <SelectTrigger className="w-44 bg-white border-zinc-200 text-xs font-medium rounded-xl h-10">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-white border-zinc-200 text-xs font-medium rounded-xl">
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="submit"
          disabled={addMutation.isPending || !newItemName.trim()}
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 h-10 rounded-xl text-xs shadow-sm flex items-center gap-1.5"
        >
          {addMutation.isPending ? <RefreshCw className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          Add
        </Button>
      </form>
    </div>
  );
}
