import Link from 'next/link';
import { Medal, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getContestById, listPublicFinalContests } from '@/lib/contest-data';
import { getContestLeaderboard } from '@/lib/contest-results';

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ contest?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedContestId = resolvedSearchParams?.contest;
  const finalContests = await listPublicFinalContests();
  const fallbackContest = finalContests[0] ?? null;
  const contestId = requestedContestId || fallbackContest?.id;

  if (!contestId) {
    return (
      <div className="space-y-6">
        <section className="screen-header space-y-2">
          <p className="eyebrow">Leaderboard</p>
          <h1 className="text-3xl font-black leading-tight">Final Results</h1>
          <p className="text-muted-foreground">No public final contests are ready yet. Leaderboards appear only after internal final scoring is confirmed.</p>
        </section>
        <Button asChild className="w-full">
          <Link href="/contests">View Open Contests</Link>
        </Button>
      </div>
    );
  }

  const contest = await getContestById(contestId);
  const leaderboard = await getContestLeaderboard(contestId);
  const topThree = leaderboard?.rows.slice(0, 3) ?? [];
  const remainingRows = leaderboard?.rows.slice(3) ?? [];

  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Leaderboard</p>
            <h1 className="text-3xl font-black leading-tight">Final Results</h1>
          </div>
        </div>
        <p className="text-muted-foreground">
          Final standings load only after confirmed QB stats are scored and saved. Lower total score ranks higher.
        </p>
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-950 text-white">
          <CardTitle>{contest.title}</CardTitle>
          <CardDescription className="text-slate-300">
            {contest.status}. {leaderboard ? `Finalized ${new Date(leaderboard.finalizedAt).toLocaleString()}.` : 'Final results are not saved yet.'}
          </CardDescription>
        </CardHeader>
      </Card>

      {leaderboard ? (
        <>
      <div className="grid grid-cols-3 gap-2">
        {topThree.map((row) => (
          <div key={row.entryId} className="rounded-lg border bg-card p-3 text-center shadow-sm">
            <Medal className="mx-auto mb-2 h-5 w-5 text-primary" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">Rank {row.finalRankDisplay}</p>
            <p className="truncate text-sm font-semibold">{row.displayName}</p>
            <p className="text-sm text-muted-foreground">{row.totalScore} pts</p>
            {row.payoutAmountCents > 0 ? <p className="text-xs font-medium text-primary">{row.payoutAmount}</p> : null}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Ranking Rows</CardTitle>
          </div>
          <CardDescription>Saved final rows only. Lower score wins, with tied totals resolved by the locked repo tiebreakers before shared placements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {remainingRows.map((row) => (
            <div key={row.entryId} className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2 text-sm">
              <span className="font-medium">
                {row.finalRankDisplay}. {row.displayName}
              </span>
              <span className="text-right text-muted-foreground">
                <span className="block">{row.totalScore} pts</span>
                {row.payoutAmountCents > 0 ? <span className="block text-primary">{row.payoutAmount}</span> : null}
              </span>
            </div>
          ))}
          <Button asChild variant="secondary" className="w-full">
            <Link href="/contests">View Open Contests</Link>
          </Button>
        </CardContent>
      </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Results Pending</CardTitle>
            <CardDescription>This contest is marked final, but no saved leaderboard rows were found yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/contests">View Open Contests</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
