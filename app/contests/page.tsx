import Link from 'next/link';
import { ArrowRight, Clock, DollarSign, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ContestBoardPreview } from '@/components/contests/contest-board-preview';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getContestDefaultLineupOrder, getContestSelectablePlayers, listPublicContests, type ContestSummary } from '@/lib/contest-data';

export default async function ContestsPage() {
  const contests = await listPublicContests();
  const featuredContest = contests[0] ?? null;
  const supportingContests = contests.slice(1);

  return (
    <div className="space-y-6">
      <div className="screen-header space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Contests</p>
            <h1 className="text-3xl font-black leading-tight">Open Contests</h1>
          </div>
          <Link href="/how-it-works" className="inline-link">
            How It Works
          </Link>
        </div>
        <p className="text-muted-foreground">
          Browse the current contest slate now. After you sign in, PickRank preserves your place and sends you into
          entry, payment review, and lineup setup for the contest you choose.
        </p>
      </div>

      {featuredContest ? (
        <Card className="section-card overflow-hidden">
          <CardHeader className="section-card-header">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-blue-300">Featured</p>
                <CardTitle>{featuredContest.title}</CardTitle>
                <CardDescription className="text-slate-300">{featuredContest.task}</CardDescription>
              </div>
              <span className="status-pill shrink-0 bg-white/10 text-white border-white/15">{featuredContest.status}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ContestStats contest={featuredContest} />
            <ContestBoardPreview
              title={featuredContest.title}
              slateLabel={featuredContest.slate}
              statCategory={featuredContest.statCategory}
              lockTimeLabel={formatLockTime(featuredContest.lockTime)}
              rankedPlayers={getContestDefaultLineupOrder(featuredContest)}
              slatePlayers={getContestSelectablePlayers(featuredContest)}
              variant="feature"
            />
            <Button asChild className="w-full">
              <Link href={`/contests/${featuredContest.id}`}>
                {featuredContest.contestStatus === 'open' ? 'Enter Contest' : 'View Contest'}
              </Link>
            </Button>
          </CardContent>
        </Card>
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

      <section className="space-y-3">
        <div className="screen-header space-y-1">
          <p className="eyebrow">More to Browse</p>
          <h2 className="text-xl font-bold">More Open Contests</h2>
          <p className="text-sm text-muted-foreground">
            Keep browsing public contest details now. Sign in only when you are ready to continue into payment review
            and Build Your Lineup.
          </p>
        </div>
        {supportingContests.length > 0 ? (
          supportingContests.map((contest) => (
            <Card key={contest.id} className="section-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{contest.title}</CardTitle>
                    <CardDescription>{formatLockTime(contest.lockTime)}</CardDescription>
                  </div>
                  <span className="status-pill">{contest.status}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ContestStats contest={contest} compact />
                <ContestBoardPreview
                  title={contest.title}
                  slateLabel={contest.slate}
                  statCategory={contest.statCategory}
                  lockTimeLabel={formatLockTime(contest.lockTime)}
                  rankedPlayers={getContestDefaultLineupOrder(contest)}
                  slatePlayers={getContestSelectablePlayers(contest)}
                />
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/contests/${contest.id}`} className="gap-2">
                    View Contest
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="section-card">
            <CardContent className="pt-6">
              <div className="empty-state-card text-sm text-muted-foreground">
                Featured contest details are live now. Additional Open Contests have not been published yet.
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function ContestStats({
  contest,
  compact = false,
}: {
  contest: ContestSummary;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'grid grid-cols-2 gap-3 text-sm' : 'grid grid-cols-2 gap-3 text-sm'}>
      <Stat icon={Clock} label="Slate" value={contest.slate} />
      <Stat icon={DollarSign} label="Prize Pool" value={contest.prizePool} />
      <Stat icon={Users} label="Entries" value={contest.entries} />
      <Stat icon={Clock} label="Lock Time" value={formatLockTime(contest.lockTime)} />
      <Stat icon={DollarSign} label="Entry Fee" value={contest.entryFee} />
    </div>
  );
}

function formatLockTime(lockTime: string) {
  return lockTime.replace(/^Locks\s+/, '');
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
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
