import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="text-base font-medium text-text-primary">{title}</p>
      {description && <p className="text-sm text-text-secondary">{description}</p>}
      {action}
    </div>
  );
}
