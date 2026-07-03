import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronDown, ListOrdered, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getContestById, listPublicContests } from '@/lib/contest-data';
import { getContestResultForUser } from '@/lib/contest-results';
import { getViewerIdentity } from '@/lib/viewer-identity';

export default async function ContestResultsPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const { contestId } = await params;
  const contest = await getContestById(contestId);
  const viewerIdentity = await getViewerIdentity();

  if (!viewerIdentity.isAuthenticated || !viewerIdentity.userId) {
    redirect(`/auth?next=${encodeURIComponent(`/contests/${contest.id}/results`)}`);
  }

  if (!['final', 'paid_out'].includes(contest.contestStatus)) {
    redirect(`/contests/${contest.id}`);
  }

  const result = await getContestResultForUser(contest.id, viewerIdentity.userId);

  if (!result) {
    redirect(`/leaderboard?contest=${contest.id}`);
  }

  const nextContest = (await listPublicContests()).find((candidate) => candidate.id !== contest.id) ?? null;

  return (
    <div className="space-y-6 pb-28">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Final Results</p>
        <h1 className="text-3xl font-black leading-tight">{result.contestTitle}</h1>
        <p className="text-muted-foreground">Your final finish and pick breakdown are now reading from the saved contest results.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>You finished {result.entry.finalRankDisplay}</CardTitle>
          <CardDescription>Lower total score ranks higher after the locked contest tiebreakers are applied.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <ResultStat label="Your Score" value={`${result.entry.totalScore} pts`} />
          <ResultStat label="Payout" value={result.entry.payoutAmount} />
          <ResultStat label="Exact Picks" value={String(result.entry.exactPicks)} />
          <ResultStat label="One-Off-Or-Better" value={String(result.entry.oneOffOrBetterPicks)} />
          {result.averageMissDistance !== null ? (
            <div className="col-span-2 rounded-lg border bg-slate-50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Average Miss Distance</p>
              <p className="text-sm font-semibold">{result.averageMissDistance} spots</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {result.bestUniquePick ? (
        <Card>
          <CardHeader>
            <CardTitle>Best Unique Pick</CardTitle>
            <CardDescription>{result.bestUniquePick.playerName} delivered your strongest differentiated call against the field.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold">
              {result.bestUniquePick.playerName} ({result.bestUniquePick.teamAbbreviation})
            </p>
            <p className="text-muted-foreground">
              You: {result.bestUniquePick.userRank} | Field: {Math.round(result.bestUniquePick.fieldAverageRank)} | Actual:{' '}
              {result.bestUniquePick.actualRankDisplay} | {result.bestUniquePick.pointsAwarded} pts
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Picks Summary</CardTitle>
          <CardDescription>Review the saved final distances for each quarterback in your lineup order.</CardDescription>
        </CardHeader>
        <CardContent>
          <details>
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border bg-slate-50 px-3 py-3 text-sm font-semibold">
              View Player Breakdown
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </summary>
            <div className="mt-3 space-y-2">
              {result.playerBreakdown.map((row) => (
                <div key={`${row.entryId}-${row.userRank}`} className="rounded-lg border bg-white px-3 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">
                      #{row.userRank} {row.playerName} ({row.teamAbbreviation})
                    </p>
                    <ResultTone distance={row.distance} />
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    You: {row.userRank} | Actual: {row.actualRankDisplay} | {row.pointsAwarded} pts
                  </p>
                </div>
              ))}
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild variant="secondary">
          <Link href={`/leaderboard?contest=${contest.id}`}>
            <ListOrdered className="mr-2 h-4 w-4" aria-hidden="true" />
            View Leaderboard
          </Link>
        </Button>
        <Button asChild>
          <Link href={nextContest ? `/contests/${nextContest.id}` : '/contests'}>
            <Trophy className="mr-2 h-4 w-4" aria-hidden="true" />
            Enter Next Contest
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function ResultTone({ distance }: { distance: number }) {
  const label = distance === 0 ? 'Exact' : distance <= 1 ? 'Close' : 'Miss';
  const className =
    distance === 0
      ? 'bg-emerald-50 text-emerald-700'
      : distance <= 1
        ? 'bg-amber-50 text-amber-700'
        : 'bg-slate-100 text-slate-700';

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}
