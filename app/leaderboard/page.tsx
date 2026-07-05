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
        <h1 className="text-3xl font-black leading-tight">Final Leaderboard</h1>
        <p className="text-muted-foreground">No public final contests are ready yet. Leaderboards appear only after saved final scoring is confirmed.</p>
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
            <h1 className="text-3xl font-black leading-tight">Final Leaderboard</h1>
          </div>
        </div>
        <p className="text-muted-foreground">
          Final standings load only after confirmed QB stats are scored and saved. Lower total score ranks higher.
        </p>
      </section>

      <Card className="section-card overflow-hidden">
        <CardHeader className="section-card-header">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>{contest.title}</CardTitle>
              <CardDescription className="text-slate-300">
                {contest.status}. {leaderboard ? `Finalized ${new Date(leaderboard.finalizedAt).toLocaleString()}.` : 'Final standings are not saved yet.'}
              </CardDescription>
            </div>
            <span className="status-pill shrink-0 bg-white/10 text-white border-white/15">Final</span>
          </div>
        </CardHeader>
      </Card>

      {leaderboard ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            {topThree.map((row) => (
              <div key={row.entryId} className="section-card p-3 text-center">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-primary">
                  <Medal className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.02em] text-muted-foreground">Rank {row.finalRankDisplay}</p>
                <p className="mt-1 truncate text-sm font-semibold">{row.displayName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{row.totalScore} pts</p>
                <p className="mt-2 text-xs font-medium text-primary">
                  {row.payoutAmountCents > 0 ? row.payoutAmount : 'No payout'}
                </p>
              </div>
            ))}
          </div>

          <Card className="section-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle>Final Standings</CardTitle>
              </div>
              <CardDescription>Saved final rows only. Lower score wins, with tied totals resolved by the locked contest tiebreakers before shared placements.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {remainingRows.length > 0 ? (
                remainingRows.map((row) => (
                  <div key={row.entryId} className="detail-row text-sm">
                    <span className="font-medium">
                      {row.finalRankDisplay}. {row.displayName}
                    </span>
                    <span className="text-right text-muted-foreground">
                      <span className="block">{row.totalScore} pts</span>
                      <span className={row.payoutAmountCents > 0 ? 'block text-primary' : 'block'}>
                        {row.payoutAmountCents > 0 ? row.payoutAmount : 'No payout'}
                      </span>
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state-card text-sm text-muted-foreground">
                  Top-three results are saved for this contest. Additional final rows are not available yet.
                </div>
              )}
              <Button asChild variant="secondary" className="w-full">
                <Link href="/contests">View Open Contests</Link>
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="section-card">
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
