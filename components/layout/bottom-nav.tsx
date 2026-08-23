'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListOrdered, Trophy, UserCircle } from 'lucide-react';
import { isAdminRoute } from '@/lib/app-route-scope';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/contests', label: 'Contests', icon: Trophy },
  { href: '/leaderboard', label: 'Results', icon: ListOrdered },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/' || isAdminRoute(pathname)) {
    return null;
  }

  return (
    <nav
      aria-label="Primary navigation"
      className="app-bottom-nav fixed inset-x-0 bottom-0 border-t border-slate-200/90 bg-white/95 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 px-2 py-2.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === '/contests' && pathname.startsWith('/contests'));

          return (
            <Link
              key={item.href}
              href={item.href}
              transitionTypes={['nav-switch']}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex min-h-14 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg px-2 text-xs font-semibold text-muted-foreground transition-[background-color,color,transform] duration-[var(--duration-state)] ease-[var(--ease-out-ui)] hover:bg-slate-100 hover:text-foreground active:scale-[0.97] motion-reduce:active:scale-100',
                isActive && 'bg-primary/8 text-primary',
              )}
            >
              <span
                className={cn(
                  'absolute inset-x-3 top-0 h-0.5 origin-center rounded-full bg-primary transition-transform duration-[var(--duration-state)] ease-[var(--ease-out-ui)]',
                  isActive ? 'scale-x-100' : 'scale-x-0',
                )}
                aria-hidden="true"
              />
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform duration-[var(--duration-state)] ease-[var(--ease-out-ui)]',
                  isActive && '-translate-y-0.5 scale-105',
                )}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
