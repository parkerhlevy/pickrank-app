import Link from 'next/link';
import { Medal, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { demoLeaderboardRows, openContests } from '@/lib/phase-0-demo';

export default function LeaderboardPage() {
  const contest = openContests[0];
  const topThree = demoLeaderboardRows.slice(0, 3);
  const remainingRows = demoLeaderboardRows.slice(3);

  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Leaderboard</p>
            <h1 className="text-3xl font-black leading-tight">Final Results Preview</h1>
          </div>
        </div>
        <p className="text-muted-foreground">
          Placeholder display for final-only results. In-game scoring updates are intentionally out of scope.
        </p>
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-950 text-white">
          <CardTitle>{contest.title}</CardTitle>
          <CardDescription className="text-slate-300">
            {contest.lockTime}. Rankings appear only after final stats are calculated in a future phase.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        {topThree.map((row) => (
          <div key={row.rank} className="rounded-lg border bg-card p-3 text-center shadow-sm">
            <Medal className="mx-auto mb-2 h-5 w-5 text-primary" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">{row.rank === 1 ? '1st' : row.rank === 2 ? '2nd' : '3rd'}</p>
            <p className="truncate text-sm font-semibold">{row.username}</p>
            <p className="text-sm text-muted-foreground">{row.points} pts</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Ranking Rows</CardTitle>
          </div>
          <CardDescription>Demo rows only. Tie handling and scoring remain governed by the repo specs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {remainingRows.map((row) => (
            <div key={row.rank} className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2 text-sm">
              <span className="font-medium">
                {row.rank}. {row.username}
              </span>
              <span className="text-muted-foreground">{row.points} pts</span>
            </div>
          ))}
          <Button asChild variant="secondary" className="w-full">
            <Link href="/contests">View Open Contests</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
