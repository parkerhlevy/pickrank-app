import Link from 'next/link';
import { Trophy, ListOrdered, HelpCircle, UserCircle } from 'lucide-react';

const navItems = [
  { href: '/contests', label: 'Contests', icon: Trophy },
  { href: '/leaderboard', label: 'Leaderboard', icon: ListOrdered },
  { href: '/how-it-works', label: 'How It Works', icon: HelpCircle },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t bg-background/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
