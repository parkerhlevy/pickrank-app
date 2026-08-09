import Link from 'next/link';
import { legalEntityName, legalLinks } from '@/lib/legal';
import { cn } from '@/lib/utils';

export function LegalFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('mx-auto w-full px-4 text-xs leading-5 text-slate-500', className)}>
      <div className="border-t border-slate-200 py-5">
        <div className="flex flex-wrap gap-x-4 gap-y-2 font-semibold">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-slate-600 hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </div>
        <p className="mt-3">
          {legalEntityName}. Early Access Beta is free to play. No purchase, entry fee, cash prize, payout, deposit, or withdrawal is available during beta.
        </p>
      </div>
    </footer>
  );
}
