import Link from 'next/link';
import { ListOrdered } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { betaCancellationThreshold, officialDataProvider, resultsFinalityWindow } from '@/lib/legal';
import { launchMode } from '@/lib/launch-mode';

export default function BetaRulesPage() {
  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Legal</p>
        <h1 className="text-3xl font-black leading-tight">Beta contest rules</h1>
        <p className="text-muted-foreground">
          These rules summarize free beta contest participation.
        </p>
      </section>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Free beta contest rules</CardTitle>
          </div>
          <CardDescription>{launchMode.betaNoCashValueCopy}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Participation requires a PickRank account that has confirmed 18+ beta eligibility.</p>
          <p>Each MVP beta contest uses a 20-quarterback player pool and asks users to pick and rank 10 quarterbacks by passing yards.</p>
          <p>Actual rank is measured against the full 20-player pool, not only against the 10 quarterbacks on your board.</p>
          <p>If quarterbacks tie in the final stat, they share an actual rank range. PickRank does not break player-stat ties with completions, attempts, interceptions, touchdowns, alphabetical order, or manual judgment.</p>
          <p>Entries lock at the contest lock time. You can edit and save your board until lock. Your latest saved board is final after lock.</p>
          <p>Final results use saved final stats from {officialDataProvider}, rank-differential scoring, and the locked PickRank tiebreakers: exact picks, one-off-or-better picks, closest placement of actual QB1, then passing-touchdown checks for the user&apos;s selected QB1 through QB5.</p>
          <p>PickRank aims to finalize beta results within {resultsFinalityWindow}.</p>
          <p>Lower total score wins the beta leaderboard. Beta standings do not create cash prizes, payouts, or withdrawable balances.</p>
          <p>There is no cash-prize cancellation threshold during free beta. Current threshold: {betaCancellationThreshold}.</p>
          <p>PickRank can pause, cancel, correct, or rerun a beta contest if testing, data, integrity, or operational issues require it.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/how-it-works" className="inline-link">
              Review how it works
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
