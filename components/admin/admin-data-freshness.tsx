'use client';

import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function AdminDataFreshness({ loadedAt }: { loadedAt: string }) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  function refreshData() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 text-xs text-slate-500">
      <p>
        Data loaded{' '}
        <time dateTime={loadedAt} className="font-semibold text-slate-700">
          {formatLoadedAtUtc(loadedAt)}
        </time>
      </p>
      <Button type="button" variant="secondary" size="sm" onClick={refreshData} disabled={isRefreshing}>
        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
        {isRefreshing ? 'Refreshing data' : 'Refresh data'}
      </Button>
    </div>
  );
}

function formatLoadedAtUtc(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(value)) + ' UTC';
}
