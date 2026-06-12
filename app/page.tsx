import Link from 'next/link';
import { ArrowRight, BookOpen, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { openContests } from '@/lib/phase-0-demo';

export default function HomePage() {
  const featuredContest = openContests[0];

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-primary">PickRank</p>
          <Link href="/how-it-works" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            How it works
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Rank the slate. Climb the final leaderboard.</h1>
          <p className="text-muted-foreground">
            PickRank is a skill-based ranking contest where players compete by ordering a slate around one stat category.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/contests">View Contests</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/how-it-works">Learn the Rules</Link>
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Open Contests</CardTitle>
              <CardDescription>Phase 0 UI preview. Entry and payment logic comes later.</CardDescription>
            </div>
            <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-primary">{featuredContest.status}</p>
                <h2 className="text-lg font-semibold">{featuredContest.title}</h2>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {featuredContest.entryFee}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Prize Pool</p>
                <p className="font-semibold">{featuredContest.prizePool}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Entries</p>
                <p className="font-semibold">{featuredContest.entries}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{featuredContest.lockTime}</p>
          </div>
          <Button asChild className="w-full">
            <Link href={`/contests/${featuredContest.id}`}>View Contest</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Contest Basics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select and rank your top 10 from the slate before lock. Final points are based on how close your lineup is to
            the official final stat rankings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
