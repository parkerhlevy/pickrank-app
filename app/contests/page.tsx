import Link from 'next/link';
import { ArrowRight, BarChart3, CheckCircle2, Clock, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listPublicContests, type ContestSummary } from '@/lib/contest-data';
import { getContestEntryProgressHref } from '@/lib/contest-entry-flow';
import { listPersistedContestIdsForViewer } from '@/lib/persisted-contest-entry';
import { getViewerIdentity } from '@/lib/viewer-identity';

export default async function ContestsPage() {
  const [contests, viewerIdentity] = await Promise.all([listPublicContests(), getViewerIdentity()]);
  const enteredContestIds = await listPersistedContestIdsForViewer(
    viewerIdentity.userId,
    contests.map((contest) => contest.id),
  );

  return (
    <div className="space-y-6">
      <div className="screen-header space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Contests</p>
            <h1 className="text-3xl font-black leading-tight">Open contests</h1>
          </div>
          <Button asChild variant="secondary" size="sm" className="shrink-0 gap-2">
            <Link href="/how-it-works">
              How it works
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">
          Find and enter a contest, evaluate the 20-player pool, and build the most accurate board possible to beat the
          field.
        </p>
      </div>

      {contests.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2" aria-label="Available contests">
          {contests.map((contest) => {
            const hasEntry = enteredContestIds.has(contest.id);
            const canEditBoard = hasEntry && contest.contestStatus === 'open';
            const contestHref = canEditBoard
              ? getContestEntryProgressHref(contest.id, 'lineup')
              : `/contests/${contest.id}`;

            return (
              <Card
                key={contest.id}
                className="interactive-card section-card flex flex-col overflow-hidden"
                data-testid={`contest-card-${contest.id}`}
              >
                <CardHeader className="section-card-header">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle>{contest.title}</CardTitle>
                      <CardDescription className="text-slate-300">{contest.task}</CardDescription>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
                      <span
                        className="status-pill border-white/15 bg-white/10 text-white"
                        data-testid="contest-lifecycle-status"
                      >
                        {contest.status}
                      </span>
                      {hasEntry ? (
                        <span
                          className="status-pill gap-1 border-emerald-300 bg-emerald-100 !text-emerald-800"
                          data-testid="contest-entry-status"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Entered
                        </span>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pt-4">
                  <ContestStats contest={contest} />
                  <Button
                    asChild
                    className={
                      canEditBoard
                        ? 'mt-auto w-full bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-600'
                        : 'mt-auto w-full'
                    }
                  >
                    <Link href={contestHref} transitionTypes={['nav-forward']} className="gap-2">
                      {canEditBoard
                        ? 'Edit your board'
                        : contest.contestStatus === 'open'
                          ? 'Enter free beta contest'
                          : 'View contest'}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ) : (
        <Card className="section-card">
          <CardContent className="pt-6">
            <div className="empty-state-card space-y-2 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">No contests are available right now.</p>
              <p>Check back soon for the next published contest.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ContestStats({ contest }: { contest: ContestSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <Stat icon={Users} label="Entries" value={contest.entries} />
      <Stat icon={Clock} label="Lock time" value={formatLockTime(contest.lockTime)} />
      <Stat icon={BarChart3} label="Stat category" value={contest.statCategory} />
      <Stat icon={Clock} label="Status" value={contest.status} />
    </div>
  );
}

function formatLockTime(lockTime: string) {
  return lockTime.replace(/^Locks\s+/, '');
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="metric-tile">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="numeric font-semibold">{value}</p>
    </div>
  );
}
