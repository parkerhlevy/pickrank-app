import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResponsiblePlayPage() {
  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Legal</p>
        <h1 className="text-3xl font-black leading-tight">Responsible play</h1>
        <p className="text-muted-foreground">
          PickRank Early Access Beta is free to play. Responsible-play controls remain part of the future paid-contest foundation.
        </p>
      </section>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Beta boundaries</CardTitle>
          </div>
          <CardDescription>No payouts, no cash prizes, no deposits, and no withdrawals during beta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>PickRank Early Access Beta participation is limited to users who are at least 18 years old.</p>
          <p>PickRank avoids betting, wagering, odds, parlay, sportsbook, risk-free, and guaranteed-profit language.</p>
          <p>Users can request account help or contest-entry restriction if they do not want to participate.</p>
          <p>Future paid contests require legal, provider, payment, withdrawal, eligibility, and responsible-play review before launch.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/legal/beta-rules" className="inline-link">
              Review beta contest rules
            </Link>
            <Link href="/legal/terms" className="inline-link">
              Review Beta Terms
            </Link>
            <Link href="/legal/privacy" className="inline-link">
              Review Privacy Policy
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
