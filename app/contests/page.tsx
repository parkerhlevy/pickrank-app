import Link from 'next/link';
import { ArrowRight, BarChart3, Clock, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listPublicContests, type ContestSummary } from '@/lib/contest-data';

export default async function ContestsPage() {
  const contests = await listPublicContests();

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
          Find and enter a contest, evaluate the 20-player pool, and build the most accurate board possible to beat the
          field.
        </p>
      </div>

      {contests.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2" aria-label="Available contests">
          {contests.map((contest) => (
            <Card key={contest.id} className="section-card flex flex-col overflow-hidden">
              <CardHeader className="section-card-header">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle>{contest.title}</CardTitle>
                    <CardDescription className="text-slate-300">{contest.task}</CardDescription>
                  </div>
                  <span className="status-pill shrink-0 border-white/15 bg-white/10 text-white">{contest.status}</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4 pt-4">
                <ContestStats contest={contest} />
                <Button asChild className="mt-auto w-full">
                  <Link href={`/contests/${contest.id}`} className="gap-2">
                    {contest.contestStatus === 'open' ? 'Enter Free Beta Contest' : 'View Contest'}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
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
      <Stat icon={Clock} label="Lock Time" value={formatLockTime(contest.lockTime)} />
      <Stat icon={BarChart3} label="Stat Category" value={contest.statCategory} />
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
