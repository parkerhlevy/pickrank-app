import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { launchMode } from '@/lib/launch-mode';

export default function BetaTermsPage() {
  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Legal</p>
        <h1 className="text-3xl font-black leading-tight">Beta Terms</h1>
        <p className="text-muted-foreground">
          These beta terms describe Early Access Beta participation. They are pending counsel review before broader public use.
        </p>
      </section>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>{launchMode.displayName}</CardTitle>
          </div>
          <CardDescription>{launchMode.betaNoCashValueCopy}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Beta contests are free to play. Paid contests are planned for a later launch.</p>
          <p>Users need an account, public username, age confirmation, state capture, Beta Terms acceptance, and Privacy Policy acceptance before beta entry.</p>
          <p>Beta access can change, pause, or end while PickRank tests contest setup, lineup save, lock, scoring, and final results workflows.</p>
          <p>These terms do not authorize real-money payments, deposits, withdrawals, payouts, or cash prizes.</p>
          <Link href="/legal/privacy" className="inline-link">
            Review Privacy Policy
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
