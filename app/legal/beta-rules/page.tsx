import Link from 'next/link';
import { ListOrdered } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { launchMode } from '@/lib/launch-mode';

export default function BetaRulesPage() {
  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Legal</p>
        <h1 className="text-3xl font-black leading-tight">Beta Contest Rules</h1>
        <p className="text-muted-foreground">
          These rules summarize free beta contest participation. They are pending counsel review.
        </p>
      </section>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Free Beta Contest Rules</CardTitle>
          </div>
          <CardDescription>{launchMode.betaNoCashValueCopy}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Each MVP beta contest uses a 15-quarterback slate and asks users to pick and rank 10 quarterbacks by passing yards.</p>
          <p>Entries lock at the contest lock time. Lineups cannot be edited after lock.</p>
          <p>Final results use saved final stats, rank-differential scoring, and the locked PickRank tiebreakers.</p>
          <p>Lower total score wins the beta leaderboard. Beta standings do not create cash prizes, payouts, or withdrawable balances.</p>
          <p>PickRank can pause, cancel, correct, or rerun a beta contest if testing, data, integrity, or operational issues require it.</p>
          <Link href="/how-it-works" className="inline-link">
            Review How It Works
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
