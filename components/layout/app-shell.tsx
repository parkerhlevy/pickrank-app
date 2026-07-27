'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/layout/bottom-nav';
import { isAdminRoute } from '@/lib/app-route-scope';
import { cn } from '@/lib/utils';

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isAdmin = isAdminRoute(pathname);

  return (
    <>
      <main
        className={cn(
          'mx-auto min-h-screen px-4 pt-6',
          isLandingPage && 'max-w-5xl pb-12',
          isAdmin && 'max-w-screen-2xl pb-12 sm:px-6 lg:px-8',
          !isLandingPage && !isAdmin && 'max-w-md pb-24',
        )}
      >
        {children}
      </main>
      <BottomNav />
    </>
  );
}
