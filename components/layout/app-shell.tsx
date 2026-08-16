'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/layout/bottom-nav';
import { LegalFooter } from '@/components/layout/legal-footer';
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
          !isLandingPage && !isAdmin && 'max-w-md pb-24 md:max-w-4xl lg:max-w-5xl',
        )}
      >
        {children}
      </main>
      {!isAdmin ? (
        <LegalFooter
          className={cn(
            isLandingPage && 'max-w-5xl pb-8',
            !isLandingPage && 'max-w-md pb-28 md:max-w-4xl lg:max-w-5xl',
          )}
        />
      ) : null}
      <BottomNav />
    </>
  );
}
