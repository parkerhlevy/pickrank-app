import { ArrowRight, ChartNoAxesCombined, Target, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProfilePerformanceStats } from '@/lib/profile-performance-stats';

export function ProfilePerformanceStatsCard({ stats }: { stats: ProfilePerformanceStats }) {
  if (stats.status === 'unavailable') {
    return (
      <Card className="section-card overflow-hidden">
        <StatsHeader />
        <CardContent className="pt-5">
          <div className="empty-state-card text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Stats are unavailable right now.</p>
            <p className="mt-1">Your saved results are not affected.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stats.status === 'empty') {
    return (
      <Card className="section-card overflow-hidden">
        <StatsHeader />
        <CardContent className="space-y-4 pt-5">
          <div className="empty-state-card text-sm text-muted-foreground">
            Your stats will appear after your first completed contest.
          </div>
          <Button asChild className="w-full">
            <Link href="/contests">
              View contests
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="section-card overflow-hidden">
      <StatsHeader />
      <CardContent className="space-y-5 pt-5">
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Contests completed" value={String(stats.contestsCompleted)} detail="Saved final results" />
          <Metric
            label="Best finish"
            value={`${stats.bestFinish.finalRankDisplay} of ${stats.bestFinish.fieldSize}`}
            detail={stats.bestFinish.contestTitle}
          />
          <Metric label="Top-3 finishes" value={String(stats.topThreeFinishes)} detail="Shared ranks included" />
          <Metric
            label="Exact pick rate"
            value={`${stats.accuracy.exactPickRate}%`}
            detail={`${stats.accuracy.exactPicks} of ${stats.accuracy.scoredPicks} picks`}
          />
        </dl>

        <div className="section-card-muted flex items-center justify-between gap-4 px-3 py-3 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <Target className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Within one spot</p>
              <p className="text-xs text-muted-foreground">Exact picks and picks one rank away</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="numeric text-lg font-black text-slate-950">{stats.accuracy.withinOneSpotRate}%</p>
            <p className="numeric text-xs text-muted-foreground">
              {stats.accuracy.withinOneSpotPicks} of {stats.accuracy.scoredPicks}
            </p>
          </div>
        </div>

        <section aria-labelledby="recent-results-heading" className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Recent form</p>
              <h3 id="recent-results-heading" className="text-lg font-black text-slate-950">
                Recent results
              </h3>
            </div>
            <span className="status-pill status-pill-muted shrink-0">Last {stats.recentResults.length}</span>
          </div>
          <ol className="space-y-2">
            {stats.recentResults.map((result) => (
              <li key={result.entryId} className="section-card-muted px-3 py-3">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-950" title={result.contestTitle}>
                      {result.contestTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Finalized {formatFinalizedDate(result.scoreFinalizedAt)}
                    </p>
                    <p className="numeric mt-1 text-sm text-slate-700">
                      {result.finalRankDisplay} of {result.fieldSize} · {result.totalScore} pts · {result.exactPicks} of{' '}
                      {result.scoredPicks} exact
                    </p>
                  </div>
                  <Button asChild className="w-full shrink-0 sm:w-auto" size="sm" variant="secondary">
                    <Link href={`/contests/${result.contestSlug}/results`}>
                      View result
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </CardContent>
    </Card>
  );
}

function StatsHeader() {
  return (
    <CardHeader className="section-card-header">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ChartNoAxesCombined className="h-5 w-5 text-blue-300" aria-hidden="true" />
            <CardTitle>My Stats</CardTitle>
          </div>
          <CardDescription className="text-slate-300">
            Your performance across completed PickRank contests.
          </CardDescription>
        </div>
        <span className="status-pill shrink-0 border-white/15 bg-white/10 text-white">
          <Trophy className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Lifetime
        </span>
      </div>
    </CardHeader>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="metric-tile min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="numeric mt-1 truncate text-xl font-black text-slate-950" title={value}>
        {value}
      </dd>
      <dd className="mt-1 truncate text-xs text-muted-foreground" title={detail}>
        {detail}
      </dd>
    </div>
  );
}

function formatFinalizedDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(value));
}
