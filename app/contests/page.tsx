import Link from 'next/link';
import { ArrowRight, Clock, ListOrdered, ShieldCheck, Target, Ticket, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ContestBoardPreview } from '@/components/contests/contest-board-preview';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getContestDefaultLineupOrder, getContestSelectablePlayers, listPublicContests, type ContestSummary } from '@/lib/contest-data';
import { launchMode } from '@/lib/launch-mode';

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
          Find a free beta contest, scan the 15-player pool, and decide if you can build a more accurate board than
          the field. You can browse first and sign in only when you are ready to enter.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="How to read PickRank contests">
        <QuickRead
          icon={Target}
          title="One stat"
          description="Each free beta contest tracks one NFL stat category, such as QB passing yards."
        />
        <QuickRead
          icon={ListOrdered}
          title="Pick 10"
          description="Review the player pool, pick 10 players, and put your board in order before lock."
        />
        <QuickRead
          icon={ShieldCheck}
          title="Accuracy wins"
          description="Final scoring compares your saved ranks to the official final order."
        />
      </section>

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
                {featuredContest.contestStatus === 'open' ? 'Enter Free Beta Contest' : 'View Contest'}
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
          <h2 className="text-xl font-bold">Other Contests</h2>
          <p className="text-sm text-muted-foreground">
            Additional public contests will appear here as they are published.
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
                The featured contest is ready to review. More public contests will appear here when they are published.
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function QuickRead({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="section-card flex flex-row items-start gap-3 p-3 sm:min-h-[8.25rem] sm:flex-col sm:gap-2 sm:p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="font-black leading-tight">{title}</p>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
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
      <Stat icon={ListOrdered} label="Player Pool" value={formatPlayerPoolLabel(contest.slate)} />
      <Stat icon={Ticket} label="Beta Pass" value={launchMode.betaEntryLabel} />
      <Stat icon={Users} label="Entries" value={contest.entries} />
      <Stat icon={Clock} label="Lock Time" value={formatLockTime(contest.lockTime)} />
      <Stat icon={Ticket} label="Entry Cost" value={contest.entryFeeCents === 0 ? '$0.00' : contest.entryFee} />
    </div>
  );
}

function formatLockTime(lockTime: string) {
  return lockTime.replace(/^Locks\s+/, '');
}

function formatPlayerPoolLabel(label: string) {
  return label.replace(/\bslate\b/gi, 'player pool');
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
