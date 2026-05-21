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
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">New discovery</DialogTitle>
          <DialogDescription>
            Save coordinates, planning notes, references, and expedition media.
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
