import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type NoticeProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  variant?: 'success' | 'info' | 'warning' | 'error' | 'muted';
  className?: string;
};

export function Notice({
  title,
  description,
  icon: Icon,
  badge,
  variant = 'muted',
  className,
}: NoticeProps) {
  return (
    <div className={cn('notice-panel', `notice-panel-${variant}`, className)}>
      <div className="flex items-start gap-3">
        <div className="notice-panel-icon">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="notice-panel-title">{title}</p>
            {badge ? <span className="notice-panel-badge">{badge}</span> : null}
          </div>
          <p className="notice-panel-description">{description}</p>
        </div>
      </div>
    </div>
  );
}
