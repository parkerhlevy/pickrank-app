import Link from 'next/link';
import { ArrowRight, BarChart3, CheckCircle2, ListOrdered, ShieldCheck, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HowItWorksPage() {
  const steps = [
    {
      icon: ListOrdered,
      title: 'Choose a contest',
      description: 'Open Contests show the stat category, lock time, entry fee, prize pool, and current entry count.',
    },
    {
      icon: CheckCircle2,
      title: 'Build Your Lineup',
      description: 'For the MVP QB format, select and rank your top 10 from a 15-quarterback slate.',
    },
    {
      icon: BarChart3,
      title: 'Compare final stats',
      description:
        'After final stats are reviewed, each saved rank is compared with the official final rank. Add those differences across your lineup. Lower total wins.',
      href: '#rank-differential-example',
    },
    {
      icon: Trophy,
      title: 'See final results',
      description: 'Final leaderboard and results views appear after contest scoring is confirmed and saved.',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="screen-header space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <p className="eyebrow">How It Works</p>
            <h1 className="text-3xl font-black leading-tight">Skill-based ranking contests</h1>
            <p className="text-muted-foreground">
              PickRank asks one question: can you rank a player slate closer to the final stat order than everyone else?
            </p>
          </div>
          <span className="status-pill shrink-0">Public Guide</span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="PickRank basics">
        <GuideTile
          icon={ListOrdered}
          title="Pick 10 from 15"
          description="Start with the full slate. Save your ranked 10 before the contest locks."
        />
        <GuideTile
          icon={BarChart3}
          title="Lower score wins"
          description="Each miss distance adds points. Exact ranks add zero."
        />
        <GuideTile
          icon={ShieldCheck}
          title="Final stats only"
          description="Results appear after final stats are reviewed and saved."
        />
      </section>

      <Card className="section-card">
        <CardHeader>
          <CardTitle>Contest Flow Overview</CardTitle>
          <CardDescription>
            Follow the same path from contest browsing to saved final results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="step-row">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Step {index + 1}</p>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.href ? (
                      <Link href={step.href} className="inline-link inline-flex items-center gap-1">
                        View example
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="section-card" id="rank-differential-example">
        <CardHeader>
          <CardTitle>Scoring Snapshot</CardTitle>
          <CardDescription>Current scoring direction for the live MVP contest flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            ['Rank differential', 'Add the distance between each saved rank and the official final rank.'],
            ['Lower score wins', 'The best lineup has the lowest total differential across the 10 ranked picks.'],
            ['Tiebreaker 1', 'Most exact picks.'],
            ['Tiebreaker 2', 'Most one-off-or-better picks.'],
            ['Tiebreaker 3', 'Closest placement of the actual QB1.'],
          ].map(([label, description]) => (
            <div key={label} className="section-card-muted px-3 py-3">
              <p className="font-semibold">{label}</p>
              <p className="text-muted-foreground">{description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <CardTitle>Rank Differential Example</CardTitle>
          <CardDescription>Each lineup spot is compared to the official final rank for that stat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2">
                    Your Rank
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Final Rank
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Difference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  ['1st', '2nd', '1'],
                  ['2nd', '2nd', '0'],
                  ['3rd', '6th', '3'],
                ].map(([yourRank, finalRank, difference]) => (
                  <tr key={`${yourRank}-${finalRank}`}>
                    <td className="numeric px-3 py-2 font-medium">{yourRank}</td>
                    <td className="numeric px-3 py-2">{finalRank}</td>
                    <td className="numeric px-3 py-2 font-black">{difference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="section-card-muted p-3 text-muted-foreground">
            Add the differences across all 10 ranked picks. Lower total differential wins, with tiebreakers applied if
            needed.
          </p>
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <CardTitle>Where to Go Next</CardTitle>
          <CardDescription>Keep How It Works easy to reach, then continue into the live contest shell.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="detail-row">
            <span>Open Contests</span>
            <span className="text-muted-foreground">Browse current contest details</span>
          </div>
          <div className="detail-row">
            <span>Build Your Lineup</span>
            <span className="text-muted-foreground">Available after entry confirmation</span>
          </div>
          <Button asChild className="w-full">
            <Link href="/contests">View Open Contests</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function GuideTile({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ListOrdered;
  title: string;
  description: string;
}) {
  return (
    <div className="section-card flex flex-row items-start gap-3 p-3 sm:min-h-[8rem] sm:flex-col sm:gap-2 sm:p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="font-black leading-tight">{title}</p>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
