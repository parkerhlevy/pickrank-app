import Link from 'next/link';
import { Medal, Trophy } from 'lucide-react';
import { redirect } from 'next/navigation';
import { ContestBoardStagePanel, ContestJourneyRail } from '@/components/contests/contest-board-preview';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getContestById, listPublicFinalContests } from '@/lib/contest-data';
import { getContestLeaderboard } from '@/lib/contest-results';
import { getLeaderboardPlaceholderState, hasPublishedContestResults } from '@/lib/leaderboard-state';
import { getNoPayoutLabel } from '@/lib/launch-mode';
import {
  buildSessionExpiredHref,
  isInvalidSupabaseRefreshTokenError,
} from '@/lib/supabase/session-recovery';

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ contest?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedContestId = resolvedSearchParams?.contest;

  try {
    return await renderLeaderboardPage(requestedContestId);
  } catch (error) {
    if (isInvalidSupabaseRefreshTokenError(error)) {
      redirect(buildSessionExpiredHref(buildLeaderboardReturnPath(requestedContestId)));
    }

    throw error;
  }
}

async function renderLeaderboardPage(requestedContestId?: string) {
  const finalContests = await listPublicFinalContests();
  const fallbackContest = finalContests[0] ?? null;
  const contestId = requestedContestId || fallbackContest?.id;

  if (!contestId) {
    return (
      <div className="space-y-6">
        <section className="screen-header space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Leaderboard</p>
              <h1 className="text-3xl font-black leading-tight">Final Leaderboard</h1>
            </div>
            <span className="status-pill shrink-0 status-pill-muted">Final only</span>
          </div>
          <p className="text-muted-foreground">
            No public final contests are ready yet. Leaderboards appear only after saved final scoring is confirmed.
          </p>
        </section>
        <Card className="section-card">
          <CardContent className="space-y-4 pt-6">
            <div className="empty-state-card text-sm text-muted-foreground">
              Final contests and saved standings will appear here once scoring is confirmed.
            </div>
            <Button asChild className="w-full">
              <Link href="/contests">View Open Contests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  const contest = await getContestById(contestId);
  const hasPublishedResults = hasPublishedContestResults(contest.contestStatus);
  const leaderboard = hasPublishedResults ? await getContestLeaderboard(contestId) : null;

  if (!hasPublishedResults) {
    const placeholder = getLeaderboardPlaceholderState(contest.contestStatus);

    return (
      <div className="space-y-6">
        <section className="screen-header space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Leaderboard</p>
              <h1 className="text-3xl font-black leading-tight">{placeholder.title}</h1>
            </div>
            <span className="status-pill shrink-0 status-pill-muted">{contest.status}</span>
          </div>
          <p className="text-muted-foreground">{placeholder.description}</p>
        </section>

        <Card className="section-card overflow-hidden">
          <CardHeader className="section-card-header">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>{contest.title}</CardTitle>
                <CardDescription className="text-slate-300">
                  {contest.status}. Final leaderboard and results stay placeholder-only until saved final scoring is confirmed.
                </CardDescription>
              </div>
              <span className="status-pill shrink-0 bg-white/10 text-white border-white/15">Final only</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="empty-state-card text-sm text-muted-foreground">{placeholder.description}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild variant="secondary">
                <Link href={`/contests/${contest.id}`}>View Contest Details</Link>
              </Button>
              <Button asChild>
                <Link href="/contests">View Open Contests</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topThree = leaderboard?.rows.slice(0, 3) ?? [];
  const remainingRows = leaderboard?.rows.slice(3) ?? [];
  const finalizedLabel = leaderboard ? new Date(leaderboard.finalizedAt).toLocaleString() : 'Not saved yet';

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
          <ContestBoardStagePanel
            title={contest.title}
            description="This contest board is resolved from saved final scoring. The slate is closed, rankings are final, and lower total score ranks higher."
            slateLabel={contest.slate}
            statCategory={contest.statCategory}
            lockTimeLabel={finalizedLabel}
            rankedCountLabel={`${leaderboard.rows.length} entries`}
            stateLabel="Saved Final"
            rankedLabel="Resolved Board"
            rankedDetail="Final standings"
            timingLabel="Finalized"
            timingDetail="Saved final scoring"
          />

          <ContestJourneyRail currentStage="final-results" />

          <div className="grid gap-3 sm:grid-cols-2">
            {topThree.map((row, index) => (
              <div
                key={row.entryId}
                className={`section-card min-w-0 p-3 ${
                  index === 0 ? 'border-primary/30 bg-blue-50/60 sm:col-span-2 sm:py-4' : 'bg-white'
                }`}
              >
                <div
                  className={`mb-2 flex items-center gap-2 ${index === 0 ? 'justify-start' : 'justify-start'}`}
                >
                  <div
                    className={`flex shrink-0 items-center justify-center rounded-full ${
                      index === 0 ? 'h-10 w-10 bg-primary text-white' : 'h-8 w-8 bg-blue-50 text-primary'
                    }`}
                  >
                    <Medal className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.02em] text-muted-foreground">
                      Rank <span className="numeric">{row.finalRankDisplay}</span>
                    </p>
                    <p
                      className={`truncate font-black leading-tight ${index === 0 ? 'text-base text-slate-950' : 'text-sm text-slate-900'}`}
                      title={row.displayName}
                    >
                      {row.displayName}
                    </p>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-2 border-t border-slate-200 pt-2 text-sm">
                  <span className="numeric font-semibold text-slate-950">{row.totalScore} pts</span>
                  <span className="numeric max-w-[8rem] truncate text-right text-xs font-medium text-primary">
                    {row.payoutAmountCents > 0 ? row.payoutAmount : getNoPayoutLabel(contest.entryFeeCents)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Card className="section-card">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
                    <CardTitle>Final Standings</CardTitle>
                  </div>
                  <CardDescription>
                    Saved final rows only. Lower score wins, with tied totals resolved by the locked contest tiebreakers before
                    shared placements.
                  </CardDescription>
                </div>
                <span className="numeric status-pill shrink-0">{leaderboard.rows.length} entries</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {remainingRows.length > 0 ? (
                remainingRows.map((row) => (
                  <div
                    key={row.entryId}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate font-semibold text-slate-950" title={row.displayName}>
                      <span className="numeric">{row.finalRankDisplay}</span>. {row.displayName}
                    </span>
                    <span className="numeric shrink-0 text-right text-muted-foreground">
                      <span className="block font-semibold text-slate-900">{row.totalScore} pts</span>
                      <span
                        className={
                          row.payoutAmountCents > 0 ? 'block max-w-[7rem] truncate text-xs text-primary' : 'block text-xs'
                        }
                      >
                        {row.payoutAmountCents > 0 ? row.payoutAmount : getNoPayoutLabel(contest.entryFeeCents)}
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

function buildLeaderboardReturnPath(contestId?: string) {
  return contestId ? `/leaderboard?${new URLSearchParams({ contest: contestId }).toString()}` : '/leaderboard';
}
