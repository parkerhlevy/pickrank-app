import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronDown, ListOrdered, Trophy } from 'lucide-react';
import { ContestBoardStagePanel, ContestJourneyRail } from '@/components/contests/contest-board-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getContestById, listPublicContests } from '@/lib/contest-data';
import { getContestResultForUser } from '@/lib/contest-results';
import { getNoPayoutLabel } from '@/lib/launch-mode';
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
  const finalizedLabel = new Date(result.finalizedAt).toLocaleString();

  return (
    <div className="space-y-6 pb-28">
      <section className="screen-header space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Final Results</p>
            <h1 className="text-3xl font-black leading-tight">{result.contestTitle}</h1>
          </div>
          <span className="status-pill shrink-0">Saved Final</span>
        </div>
        <p className="text-muted-foreground">Your final finish and board breakdown now read from the saved contest results.</p>
      </section>

      <ContestBoardStagePanel
        title={result.contestTitle}
        description="Your contest board is resolved from saved final scoring. Review your finish, score, and saved ranked 10 against the final QB order."
        slateLabel={contest.slate}
        statCategory={contest.statCategory}
        lockTimeLabel={finalizedLabel}
        rankedCountLabel={`Rank ${result.entry.finalRankDisplay}`}
        stateLabel="Saved Final"
        rankedLabel="Your Result"
        rankedDetail="Final placement"
        timingLabel="Finalized"
        timingDetail="Saved final scoring"
      />

      <ContestJourneyRail currentStage="final-results" />

      <Card className="section-card overflow-hidden">
        <CardHeader className="section-card-header">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.02em] text-blue-200">Saved Final Summary</p>
              <CardTitle>
                You finished <span className="numeric">{result.entry.finalRankDisplay}</span>
              </CardTitle>
              <CardDescription className="text-slate-300">
                Lower total score ranks higher after the locked contest tiebreakers are applied.
              </CardDescription>
            </div>
            <span className="status-pill shrink-0 bg-white/10 text-white border-white/15">
              <span className="numeric">
                {result.entry.payoutAmountCents > 0 ? result.entry.payoutAmount : getLeaderboardLabel(contest.entryFeeCents)}
              </span>
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-5 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <ResultStat label="Final Rank" value={result.entry.finalRankDisplay} emphasis />
            <ResultStat label="Your Score" value={`${result.entry.totalScore} pts`} emphasis />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <ResultStat
              label={contest.entryFeeCents === 0 ? 'Leaderboard' : 'Final Result'}
              value={result.entry.payoutAmountCents > 0 ? result.entry.payoutAmount : getLeaderboardLabel(contest.entryFeeCents)}
            />
            <ResultStat label="Exact Picks" value={String(result.entry.exactPicks)} />
            <ResultStat label="One-Off-Or-Better" value={String(result.entry.oneOffOrBetterPicks)} />
          </div>
          {result.averageMissDistance !== null ? (
            <div className="section-card-muted flex items-center justify-between gap-3 px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">Average Miss Distance</p>
              <p className="numeric text-sm font-semibold text-slate-950">{result.averageMissDistance} spots</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle>Results Snapshot</CardTitle>
              </div>
              <CardDescription>This screen reflects your saved final finish, score, and beta result status.</CardDescription>
            </div>
            <span className="status-pill shrink-0 status-pill-muted">Saved rows</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="detail-row">
            <span className="font-medium">Final placement</span>
            <span className="numeric text-muted-foreground">{result.entry.finalRankDisplay}</span>
          </div>
          <div className="detail-row">
            <span className="font-medium">Leaderboard status</span>
            <span className="text-muted-foreground">Saved final standings</span>
          </div>
          <div className="detail-row">
            <span className="font-medium">Leaderboard path</span>
            <span className="text-muted-foreground">Saved final standings</span>
          </div>
        </CardContent>
      </Card>

      {result.bestUniquePick ? (
        <Card className="section-card">
          <CardHeader>
            <CardTitle>Best Unique Pick</CardTitle>
            <CardDescription>
              {result.bestUniquePick.playerName} delivered your strongest differentiated call against the field.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="truncate font-semibold" title={result.bestUniquePick.playerName}>
              {result.bestUniquePick.playerName} ({result.bestUniquePick.teamAbbreviation})
            </p>
            <p className="text-muted-foreground">
              <span className="numeric">
                You: {result.bestUniquePick.userRank} | Field: {Math.round(result.bestUniquePick.fieldAverageRank)} | Actual:{' '}
                {result.bestUniquePick.actualRankDisplay} | {result.bestUniquePick.pointsAwarded} pts
              </span>
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="section-card">
        <CardHeader>
          <CardTitle>Board Breakdown</CardTitle>
          <CardDescription>Review the saved final distances for each quarterback in your board order.</CardDescription>
        </CardHeader>
        <CardContent>
          <details>
            <summary className="section-card-muted flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-semibold">
              <span>View Player Breakdown</span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <span className="numeric">{result.playerBreakdown.length} saved rows</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </span>
            </summary>
            <div className="mt-3 space-y-1.5">
              {result.playerBreakdown.map((row) => (
                <div
                  key={`${row.entryId}-${row.userRank}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate font-semibold text-slate-950"
                      title={`${row.playerName} (${row.teamAbbreviation})`}
                    >
                      #<span className="numeric">{row.userRank}</span> {row.playerName} ({row.teamAbbreviation})
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="numeric">
                        You: {row.userRank} | Actual: {row.actualRankDisplay} | {row.pointsAwarded} pts
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0">
                    <ResultTone distance={row.distance} />
                  </div>
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
            View Final Leaderboard
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

function ResultStat({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="section-card-muted min-w-0 px-3 py-3">
      <p className="truncate text-xs text-muted-foreground" title={label}>
        {label}
      </p>
      <p className={`numeric truncate font-semibold ${emphasis ? 'text-lg text-slate-950' : 'text-sm'}`} title={value}>
        {value}
      </p>
    </div>
  );
}

function getLeaderboardLabel(entryFeeCents: number) {
  return entryFeeCents === 0 ? 'Leaderboard' : getNoPayoutLabel(entryFeeCents);
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
