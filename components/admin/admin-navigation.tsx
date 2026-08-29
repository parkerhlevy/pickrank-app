'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileCheck2, LayoutDashboard, ShieldCheck, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
  {
    href: '/admin',
    label: 'Overview',
    description: 'Status and evidence health',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/contests',
    label: 'Contest operations',
    description: 'Setup, validation, and results',
    icon: Trophy,
  },
  {
    href: '/admin/eligibility',
    label: 'Internal eligibility',
    description: 'Controlled test accounts only',
    icon: ShieldCheck,
  },
  {
    href: '/admin/users',
    label: 'User data',
    description: 'Profiles, entries, and boards',
    icon: Users,
  },
  {
    href: '/admin/evidence',
    label: 'Evidence',
    description: 'Completeness and exports',
    icon: FileCheck2,
  },
] as const;

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin navigation"
      className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/admin'
          ? pathname === '/admin'
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group flex min-w-56 items-start gap-3 rounded-lg border px-3 py-3 transition-[background-color,border-color,box-shadow]',
              isActive
                ? 'border-primary/20 bg-primary/10 text-primary shadow-sm'
                : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950',
            )}
          >
            <span
              className={cn(
                'mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 group-hover:text-slate-950',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold">{item.label}</span>
              <span className={cn('mt-0.5 block text-xs leading-4', isActive ? 'text-primary/75' : 'text-slate-500')}>
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
