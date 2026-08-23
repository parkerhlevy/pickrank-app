'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type PresenceProps = {
  present: boolean;
  children: React.ReactNode;
  className?: string;
  exitDuration?: number;
};

export function Presence({ present, children, className, exitDuration = 180 }: PresenceProps) {
  const [shouldRender, setShouldRender] = useState(present);

  useEffect(() => {
    if (present) {
      const frameId = window.requestAnimationFrame(() => setShouldRender(true));
      return () => window.cancelAnimationFrame(frameId);
    }

    if (!shouldRender) {
      return;
    }

    const timeoutId = window.setTimeout(() => setShouldRender(false), exitDuration);
    return () => window.clearTimeout(timeoutId);
  }, [exitDuration, present, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={cn('ui-presence', className)}
      data-state={present ? 'open' : 'closed'}
      aria-hidden={present ? undefined : true}
    >
      {children}
    </div>
  );
}
