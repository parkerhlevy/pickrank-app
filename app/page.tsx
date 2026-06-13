import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, ShieldCheck, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { openContests } from '@/lib/phase-0-demo';

export default function HomePage() {
  const featuredContest = openContests[0];

  return (
    <div className="space-y-6">
      <section className="brand-panel space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="rounded-md bg-white/95 px-2 py-1 shadow-sm">
            <Image
              src="/brand/pickrank-wordmark-clean.png"
              alt="PickRank"
              width={220}
              height={78}
              className="h-auto w-[168px] sm:w-[200px]"
              priority
            />
          </div>
          <Link href="/how-it-works" className="inline-flex items-center gap-1 text-sm font-bold text-blue-200">
            How it works
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black leading-tight text-white">See it. Rank it. Prove it.</h1>
          <p className="text-sm leading-6 text-slate-300">
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
        <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-blue-300" aria-hidden="true" />
            Skill-based
          </div>
          <div>Fair contest</div>
          <div>Final results</div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Open Contests</CardTitle>
              <CardDescription>Contest cards for the current Phase 0 preview. Entry and payment logic comes later.</CardDescription>
            </div>
            <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="soft-panel">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{featuredContest.status}</p>
                <h2 className="text-lg font-semibold">{featuredContest.title}</h2>
              </div>
              <span className="status-pill">{featuredContest.entryFee}</span>
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
