import * as React from 'react';
import { cn } from '@/lib/utils';

export function Surface({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-[var(--radius-lg)] border bg-[var(--surface)] shadow-sm', className)}
      {...props}
    />
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 space-y-1">
        {eyebrow && <p className="text-xs font-semibold uppercase text-[var(--muted)]">{eyebrow}</p>}
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Surface className={cn('mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center', className)}>
      {icon && <div className="flex size-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-soft)] text-[var(--accent)]">{icon}</div>}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
        {description && <p className="text-sm leading-6 text-[var(--muted)]">{description}</p>}
      </div>
      {action}
    </Surface>
  );
}

export function StatCard({
  label,
  value,
  icon,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="group min-w-0 rounded-[var(--radius-md)] border bg-[var(--surface)] p-4 text-left shadow-sm transition hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--muted)]">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 truncate text-base font-semibold text-[var(--foreground)]">{value}</div>
    </Comp>
  );
}
