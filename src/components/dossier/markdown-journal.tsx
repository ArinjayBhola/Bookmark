'use client';

import * as React from 'react';
import { addJournalEntry } from '@/app/actions/discovery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, BookOpen, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

interface JournalEntryItem {
  id: string;
  title: string;
  content: string;
  date?: Date | string;
  createdAt?: Date | string;
}

interface MarkdownJournalProps {
  discoveryId: string;
  entries: JournalEntryItem[];
}

export function MarkdownJournal({ discoveryId, entries: initialEntries }: MarkdownJournalProps) {
  const [entries, setEntries] = React.useState<JournalEntryItem[]>(initialEntries || []);
  const [isAdding, setIsAdding] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});

  const handleToggleCollapse = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setSubmitting(true);
    try {
      const newEntry = await addJournalEntry(discoveryId, { title, content });
      setEntries([newEntry, ...entries]);
      setTitle('');
      setContent('');
      setIsAdding(false);
    } catch (error) {
      console.error('Journal error:', error);
      alert('Failed to add journal entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between border-b border-stone-300 pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-stone-700" />
          <h3 className="text-sm font-bold font-serif text-stone-900">Expedition Field Journals</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="size-4 mr-1" /> {isAdding ? 'Cancel' : 'New Entry'}
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-[#f1efe9] p-4 rounded-lg border border-stone-300 space-y-3 shadow-xs">
          <div className="text-xs font-semibold text-stone-700">Add Field Journal Entry</div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry Title e.g. Acclimatization Rotation 1" required />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write expedition notes in markdown... e.g. Left camp at 0400. Weather clear but high wind shear on the upper ridge."
            rows={5}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Saving...' : 'Commit Entry'}
            </Button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <div className="text-xs text-stone-500 italic text-center py-6 bg-[#e8e6dd]/50 rounded border border-stone-300">
          No field journals logged for this location yet. Click &quot;New Entry&quot; to start recording.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const isCollapsed = collapsed[entry.id];
            return (
              <div key={entry.id} className="bg-[#f1efe9] rounded-lg border border-stone-300 overflow-hidden shadow-xs transition-colors">
                <div
                  className="flex items-center justify-between p-3 bg-[#e8e6dd] cursor-pointer select-none hover:bg-stone-300/70"
                  onClick={() => handleToggleCollapse(entry.id)}
                >
                  <div className="flex items-center gap-3 truncate pr-2">
                    <Calendar className="size-4 text-stone-600 shrink-0" />
                    <span className="text-xs font-bold font-serif text-stone-900 truncate">{entry.title}</span>
                    <span className="text-[10px] font-mono text-stone-500 shrink-0">
                      {new Date(entry.date || entry.createdAt || new Date()).toLocaleDateString()}
                    </span>
                  </div>
                  {isCollapsed ? <ChevronDown className="size-4 text-stone-600" /> : <ChevronUp className="size-4 text-stone-600" />}
                </div>

                {!isCollapsed && (
                  <div className="p-4 text-xs text-stone-800 font-sans leading-relaxed whitespace-pre-wrap border-t border-stone-300 bg-[#f6f5f2]">
                    {entry.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
