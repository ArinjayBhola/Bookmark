'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CaptureForm } from './capture-form';

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (discovery: { id: string }) => void;
}

export function QuickAddModal({ open, onOpenChange, onSuccess }: QuickAddModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white border-zinc-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-serif text-zinc-900">Instant Terrain Capture</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Rapidly log mountain intelligence, coordinates, and expedition notes into your private vault.
          </DialogDescription>
        </DialogHeader>

        <CaptureForm
          onSuccess={(discovery) => {
            onOpenChange(false);
            onSuccess?.(discovery);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
